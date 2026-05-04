/**
 * Script para probar el login desde la consola
 */
async function testLogin() {
  try {
    console.log('🔐 Probando login de Super Admin...\n');

    const loginData = {
      dsUsuario: 'admin',
      dsClave: '123',
      cdEmpresaConsultora: 0,
    };

    console.log('📤 Enviando petición con datos:');
    console.log(JSON.stringify(loginData, null, 2));
    console.log('');

    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData),
    });

    console.log(`📥 Respuesta HTTP: ${response.status} ${response.statusText}\n`);

    const data = await response.json();

    if (data.success) {
      console.log('✅ Login exitoso!');
      console.log('\n👤 Usuario:');
      console.log(`   - ID: ${data.data.user.cdUsuario}`);
      console.log(`   - Usuario: ${data.data.user.dsUsuario}`);
      console.log(`   - Tipo: ${data.data.user.cdTipoUsuario === 1 ? 'Super Admin' : 'Normal'}`);
      console.log(`   - Empresa: ${data.data.user.cdEmpresaConsultora || 'N/A'}`);
      console.log(`\n🔑 Token generado: ${data.data.token.substring(0, 50)}...`);
    } else {
      console.log('❌ Login fallido!');
      console.log(`   Error: ${data.error}`);
    }

    console.log('\n\n🔐 Probando login de Empresa Consultora...\n');

    const loginData2 = {
      dsUsuario: 'ISO',
      dsClave: '123',
      cdEmpresaConsultora: 1,
    };

    console.log('📤 Enviando petición con datos:');
    console.log(JSON.stringify(loginData2, null, 2));
    console.log('');

    const response2 = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData2),
    });

    console.log(`📥 Respuesta HTTP: ${response2.status} ${response2.statusText}\n`);

    const data2 = await response2.json();

    if (data2.success) {
      console.log('✅ Login exitoso!');
      console.log('\n👤 Usuario:');
      console.log(`   - ID: ${data2.data.user.cdUsuario}`);
      console.log(`   - Usuario: ${data2.data.user.dsUsuario}`);
      console.log(`   - Tipo: ${data2.data.user.cdTipoUsuario === 1 ? 'Super Admin' : 'Normal'}`);
      console.log(`   - Empresa: ${data2.data.user.cdEmpresaConsultora || 'N/A'}`);
      console.log(`   - Roles: ${data2.data.user.roles.join(', ')}`);
      console.log(`\n🔑 Token generado: ${data2.data.token.substring(0, 50)}...`);
    } else {
      console.log('❌ Login fallido!');
      console.log(`   Error: ${data2.error}`);
    }
  } catch (error) {
    console.error('\n❌ Error de conexión:', error);
  }
}

testLogin();
