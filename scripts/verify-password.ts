import { query } from '../lib/db';
import { verifyPassword } from '../lib/auth';
import * as crypto from 'crypto';

async function verifyPasswords() {
  try {
    console.log('🔍 Verificando contraseñas de usuarios...\n');

    // Obtener todos los usuarios
    const usuarios = await query<{
      cdUsuario: number;
      dsUsuario: string;
      dsClave: string;
      cdEmpresaConsultora: number | null;
    }>(
      `
      SELECT cdUsuario, dsUsuario, dsClave, cdEmpresaConsultora
      FROM TD_USUARIOS
      WHERE cdEstado = 1
      `
    );

    console.log(`✓ Encontrados ${usuarios.length} usuarios activos\n`);

    for (const usuario of usuarios) {
      console.log(`👤 Usuario: ${usuario.dsUsuario}`);
      console.log(`   Hash en BD: ${usuario.dsClave}`);
      console.log(`   Empresa: ${usuario.cdEmpresaConsultora || 'Super Admin'}`);

      // Verificar si es MD5 (32 caracteres hexadecimales)
      const isMD5 = /^[a-f0-9]{32}$/i.test(usuario.dsClave);
      console.log(`   Tipo de hash: ${isMD5 ? 'MD5' : 'bcrypt'}`);

      // Probar contraseña "123"
      const password = '123';
      const match = await verifyPassword(password, usuario.dsClave);
      console.log(`   ✓ Contraseña "123": ${match ? '✅ VÁLIDA' : '❌ INVÁLIDA'}`);

      // Si es MD5, calcular el hash de "123" para comparar
      if (isMD5) {
        const md5Hash = crypto.createHash('md5').update(password).digest('hex');
        console.log(`   MD5 de "123": ${md5Hash}`);
        console.log(`   Coincide: ${md5Hash === usuario.dsClave ? '✅' : '❌'}`);
      }

      console.log('');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyPasswords();
