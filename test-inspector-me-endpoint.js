/**
 * Script para probar el acceso del inspector al endpoint /me
 * 
 * Endpoints probados:
 * - GET /api/v1/users/me (Inspector debe tener acceso)
 */

const API_URL = 'https://geigv-munisc-gestion-vial-backend-production.up.railway.app';

async function testInspectorMeAccess() {
  console.log('🧪 Prueba: Acceso de Inspector a /api/v1/users/me\n');

  try {
    // 1. Login como inspector
    console.log('1️⃣ Haciendo login como inspector...');
    
    const loginResponse = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'inspector1@test.com', // Cambia esto por el email del inspector
        password: 'Inspector123!', // Cambia esto por la contraseña del inspector
      }),
    });

    if (!loginResponse.ok) {
      const errorData = await loginResponse.json();
      console.error('❌ Error en login:', errorData);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login exitoso');
    console.log('👤 Usuario:', loginData.user.email);
    console.log('🎭 Roles:', loginData.user.roles.map(r => r.name).join(', '));
    console.log('🔑 Token obtenido\n');

    const token = loginData.access_token;

    // 2. Probar acceso a /me
    console.log('2️⃣ Probando acceso a /api/v1/users/me...');
    
    const meResponse = await fetch(`${API_URL}/api/v1/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('📊 Status Code:', meResponse.status);

    if (!meResponse.ok) {
      const errorData = await meResponse.json();
      console.error('❌ Error al obtener /me:', errorData);
      
      // Diagnosticar el problema
      console.log('\n🔍 Diagnóstico:');
      if (meResponse.status === 403) {
        console.log('- Error 403: Forbidden');
        console.log('- El usuario está autenticado pero no tiene los permisos necesarios');
        console.log('- Verificar que el rol "inspector" esté asignado correctamente');
        console.log('- Verificar que el RolesGuard esté funcionando correctamente');
      } else if (meResponse.status === 401) {
        console.log('- Error 401: Unauthorized');
        console.log('- Token inválido o expirado');
      }
      return;
    }

    const meData = await meResponse.json();
    console.log('✅ Datos obtenidos correctamente:');
    console.log(JSON.stringify(meData, null, 2));

    console.log('\n🎉 Prueba completada exitosamente!');
    console.log('✅ El inspector TIENE acceso al endpoint /me');

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
}

// Ejecutar la prueba
testInspectorMeAccess();
