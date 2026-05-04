// Script para verificar la conexión a la base de datos
import { getConnection, query } from '../lib/db';

async function testConnection() {
  console.log('🔍 Verificando conexión a SQL Server...\n');

  try {
    // Intentar conectar
    const connection = await getConnection();
    console.log('✓ Conexión establecida exitosamente\n');

    // Verificar tablas
    console.log('📊 Verificando tablas...');
    const tables = await query<{ name: string }>(
      `SELECT TABLE_NAME as name FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME`
    );
    console.log(`✓ ${tables.length} tablas encontradas\n`);

    // Verificar usuarios
    console.log('👥 Verificando usuarios...');
    const usuarios = await query(`SELECT cdUsuario, dsUsuario, dsNombreCompleto FROM TD_USUARIOS WHERE cdEstado = 1`);
    console.log(`✓ ${usuarios.length} usuarios activos:`);
    usuarios.forEach((u: any) => {
      console.log(`   - ${u.dsUsuario}: ${u.dsNombreCompleto}`);
    });
    console.log('');

    // Verificar empresas consultoras
    console.log('🏢 Verificando empresas consultoras...');
    const empresas = await query(`SELECT cdEmpresaConsultora, dsNombreEmpresaConsultora FROM TD_EMPRESAS_CONSULTORAS WHERE cdEstado = 1`);
    console.log(`✓ ${empresas.length} empresas activas:`);
    empresas.forEach((e: any) => {
      console.log(`   - [${e.cdEmpresaConsultora}] ${e.dsNombreEmpresaConsultora}`);
    });
    console.log('');

    // Verificar estados
    console.log('📋 Verificando catálogos...');
    const estados = await query(`SELECT COUNT(*) as count FROM TV_ESTADOS WHERE snActivo = 1`);
    const paises = await query(`SELECT COUNT(*) as count FROM TV_PAISES WHERE snActivo = 1`);
    const provincias = await query(`SELECT COUNT(*) as count FROM TV_PROVINCIAS WHERE snActivo = 1`);
    console.log(`✓ ${estados[0].count} estados`);
    console.log(`✓ ${paises[0].count} países`);
    console.log(`✓ ${provincias[0].count} provincias`);
    console.log('');

    console.log('✅ Todas las verificaciones pasaron exitosamente\n');
    console.log('🚀 El sistema está listo para usar:');
    console.log('   • Super Admin: http://localhost:3000/login/0 (admin / 123)');
    console.log('   • Empresa Consultora: http://localhost:3000/login/1 (ISO / 123)\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error en la verificación:', error);
    process.exit(1);
  }
}

testConnection();
