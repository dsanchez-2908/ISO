import sql from 'mssql';

const config: sql.config = {
  server: process.env.DB_SERVER || 'localhost\\SQLEXPRESS',
  database: process.env.DB_NAME || 'ISO',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '123',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true',
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// Exportar config como sqlConfig para uso directo
export const sqlConfig = config;

let pool: sql.ConnectionPool | null = null;

/**
 * Obtiene la conexión a la base de datos
 * Reutiliza la conexión existente o crea una nueva
 */
export async function getConnection(): Promise<sql.ConnectionPool> {
  try {
    if (pool && pool.connected) {
      return pool;
    }

    if (pool && pool.connecting) {
      // Esperar a que termine de conectar
      await new Promise(resolve => setTimeout(resolve, 100));
      return getConnection();
    }

    pool = await new sql.ConnectionPool(config).connect();
    
    console.log('✓ Conexión a SQL Server establecida');
    
    // Manejar errores de conexión
    pool.on('error', (err) => {
      console.error('Error en conexión SQL:', err);
      pool = null;
    });

    return pool;
  } catch (error) {
    console.error('Error al conectar a SQL Server:', error);
    throw new Error('No se pudo establecer conexión con la base de datos');
  }
}

/**
 * Ejecuta una consulta SQL y retorna los resultados
 */
export async function query<T = any>(
  queryString: string,
  params?: Record<string, any>
): Promise<T[]> {
  try {
    const connection = await getConnection();
    const request = connection.request();

    // Agregar parámetros si existen
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        request.input(key, value);
      });
    }

    const result = await request.query(queryString);
    return result.recordset as T[];
  } catch (error) {
    console.error('Error en query:', error);
    throw error;
  }
}

/**
 * Ejecuta un stored procedure
 */
export async function executeProcedure<T = any>(
  procedureName: string,
  params?: Record<string, any>
): Promise<T[]> {
  try {
    const connection = await getConnection();
    const request = connection.request();

    // Agregar parámetros si existen
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        request.input(key, value);
      });
    }

    const result = await request.execute(procedureName);
    return result.recordset as T[];
  } catch (error) {
    console.error('Error en procedimiento:', error);
    throw error;
  }
}

/**
 * Cierra la conexión a la base de datos
 */
export async function closeConnection(): Promise<void> {
  try {
    if (pool) {
      await pool.close();
      pool = null;
      console.log('✓ Conexión a SQL Server cerrada');
    }
  } catch (error) {
    console.error('Error al cerrar conexión:', error);
  }
}

// Cerrar conexión al terminar el proceso
if (typeof process !== 'undefined') {
  process.on('SIGINT', async () => {
    await closeConnection();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await closeConnection();
    process.exit(0);
  });
}

export default { getConnection, query, executeProcedure, closeConnection };
