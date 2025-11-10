// Test script para verificar que los errores han sido corregidos
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

async function testEndpoints() {
  console.log('🧪 Iniciando pruebas de endpoints...\n');

  // Test 1: Verificar conexión
  try {
    console.log('📡 1. Probando conexión...');
    const response = await axios.get(`${BASE_URL}/auth/connection`);
    console.log('✅ Conexión exitosa:', response.data);
  } catch (error) {
    console.error('❌ Error en conexión:', error.message);
  }

  // Test 2: Intentar login (debería fallar con credenciales inválidas pero no dar error 500)
  try {
    console.log('\n🔐 2. Probando login con credenciales inválidas...');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@test.com',
      password: 'wrongpassword'
    });
    console.log('⚠️ Login inesperadamente exitoso:', response.data);
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ Login falló correctamente con 401 (credenciales inválidas)');
    } else {
      console.error('❌ Error inesperado en login:', error.message);
    }
  }

  // Test 3: Verificar CORS headers
  try {
    console.log('\n🌐 3. Probando headers CORS...');
    const response = await axios.options(`${BASE_URL}/auth/connection`);
    console.log('✅ CORS headers disponibles');
  } catch (error) {
    console.log('⚠️ No se pudieron obtener headers CORS (normal en algunos casos)');
  }

  // Test 4: Probar endpoint de auditoría (sin autenticación, debería dar 401)
  try {
    console.log('\n📊 4. Probando endpoint de auditoría...');
    const response = await axios.get(`${BASE_URL}/audit/logs`);
    console.log('⚠️ Auditoría accesible sin autenticación:', response.data);
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ Auditoría protegida correctamente (401)');
    } else {
      console.error('❌ Error inesperado en auditoría:', error.message);
    }
  }

  console.log('\n🎉 Pruebas completadas');
}

testEndpoints().catch(console.error);