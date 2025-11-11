// Test script para verificar acceso de inspector al módulo de auditoría
// Ejecutar con: node test-inspector-audit-access.js

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1'; // Cambiar por URL de producción si es necesario

async function testInspectorAuditAccess() {
  console.log('🔍 Testing Inspector Access to Audit Module');
  console.log('==========================================\n');

  try {
    // 1. Login como inspector (asume que existe un usuario inspector)
    console.log('1. Intentando login como inspector...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'inspector@test.com', // Cambiar por email real de inspector
      password: 'password123'     // Cambiar por contraseña real
    });

    if (loginResponse.data.access_token) {
      console.log('✅ Login exitoso como inspector');
      const token = loginResponse.data.access_token;
      const userRoles = loginResponse.data.user.roles.map(r => r.name);
      console.log(`   Roles: ${userRoles.join(', ')}\n`);

      // Headers para requests autenticados
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // 2. Probar acceso a logs de auditoría
      console.log('2. Probando acceso a logs de auditoría...');
      try {
        const logsResponse = await axios.get(`${BASE_URL}/audit/logs?page=1&limit=5`, { headers });
        console.log('✅ Acceso a logs exitoso');
        console.log(`   Logs encontrados: ${logsResponse.data.data?.length || 0}`);
        console.log(`   Total pages: ${logsResponse.data.totalPages || 'N/A'}\n`);
      } catch (error) {
        console.log('❌ Error accediendo a logs:', error.response?.data?.message || error.message);
      }

      // 3. Probar acceso a estadísticas
      console.log('3. Probando acceso a estadísticas...');
      try {
        const statsResponse = await axios.get(`${BASE_URL}/audit/stats`, { headers });
        console.log('✅ Acceso a estadísticas exitoso');
        console.log(`   Estadísticas disponibles: ${Object.keys(statsResponse.data).join(', ')}\n`);
      } catch (error) {
        console.log('❌ Error accediendo a estadísticas:', error.response?.data?.message || error.message);
      }

      // 4. Probar acceso a resumen de actividad
      console.log('4. Probando acceso a resumen de actividad...');
      try {
        const activityResponse = await axios.get(`${BASE_URL}/audit/users/activity-summary`, { headers });
        console.log('✅ Acceso a resumen de actividad exitoso');
        console.log(`   Usuarios con actividad: ${activityResponse.data.length || 0}\n`);
      } catch (error) {
        console.log('❌ Error accediendo a resumen:', error.response?.data?.message || error.message);
      }

      // 5. Probar endpoint de exportación
      console.log('5. Probando endpoint de exportación...');
      try {
        const exportResponse = await axios.get(`${BASE_URL}/audit/export?limit=10`, { headers });
        console.log('✅ Acceso a exportación exitoso');
        console.log(`   Formato: ${exportResponse.data.format}`);
        console.log(`   Registros para exportar: ${exportResponse.data.data?.data?.length || 0}\n`);
      } catch (error) {
        console.log('❌ Error accediendo a exportación:', error.response?.data?.message || error.message);
      }

    } else {
      console.log('❌ Login fallido - no se recibió token');
    }

  } catch (error) {
    console.log('❌ Error en login:', error.response?.data?.message || error.message);
    console.log('\n📋 Instrucciones:');
    console.log('1. Asegúrate de que el servidor esté corriendo en ' + BASE_URL);
    console.log('2. Crea un usuario con rol "inspector" o modifica las credenciales en este script');
    console.log('3. Verifica que el rol "inspector" existe en la base de datos');
  }

  console.log('\n🏁 Test completado');
}

// Ejecutar el test
testInspectorAuditAccess().catch(console.error);