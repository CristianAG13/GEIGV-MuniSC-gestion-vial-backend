/**
 * Script de prueba para el endpoint GET /users/me
 * 
 * Este endpoint permite a inspectores e ingenieros obtener su propio ID
 * y datos para utilizarlos al rellenar boletas
 * 
 * Uso:
 * 1. Primero hacer login para obtener el token
 * 2. Luego llamar a /users/me con el token
 */

const BASE_URL = 'http://localhost:3000';

// ====================================
// 1. LOGIN
// ====================================
async function login(email, password) {
  try {
    console.log('\n🔐 Intentando login...');
    console.log(`Email: ${email}`);
    
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Error en login:', data);
      return null;
    }

    console.log('✅ Login exitoso');
    console.log('Usuario:', data.user);
    console.log('Roles:', data.user.roles);
    console.log('Token obtenido');
    
    return data.access_token;
  } catch (error) {
    console.error('❌ Error en login:', error.message);
    return null;
  }
}

// ====================================
// 2. OBTENER MI INFORMACIÓN (ID)
// ====================================
async function getMyInfo(token) {
  try {
    console.log('\n📋 Obteniendo información del usuario actual...');
    
    const response = await fetch(`${BASE_URL}/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Error al obtener información:', data);
      return null;
    }

    console.log('✅ Información obtenida exitosamente:');
    console.log('─'.repeat(50));
    console.log('ID:', data.id);
    console.log('Nombre:', data.name);
    console.log('Apellido:', data.lastname);
    console.log('Email:', data.email);
    console.log('Roles:', data.roles.join(', '));
    console.log('─'.repeat(50));
    console.log('\n💡 Usa el ID:', data.id, 'para rellenar tus boletas');
    
    return data;
  } catch (error) {
    console.error('❌ Error al obtener información:', error.message);
    return null;
  }
}

// ====================================
// FUNCIÓN PRINCIPAL DE PRUEBA
// ====================================
async function testMyInspectorIngenieroId() {
  console.log('═'.repeat(60));
  console.log('🧪 TEST: Obtener ID de Inspector/Ingeniero');
  console.log('═'.repeat(60));

  // CAMBIAR ESTOS DATOS POR UN USUARIO INSPECTOR O INGENIERO REAL
  const email = 'inspector@test.com';
  const password = 'password123';

  // 1. Login
  const token = await login(email, password);
  if (!token) {
    console.error('\n❌ No se pudo obtener el token. Asegúrate de usar credenciales válidas.');
    return;
  }

  // 2. Obtener mi información
  const myInfo = await getMyInfo(token);
  if (!myInfo) {
    console.error('\n❌ No se pudo obtener la información del usuario.');
    return;
  }

  console.log('\n✅ PRUEBA COMPLETADA EXITOSAMENTE');
  console.log('\n📝 RESUMEN:');
  console.log(`   - Tu ID de usuario es: ${myInfo.id}`);
  console.log(`   - Nombre completo: ${myInfo.name} ${myInfo.lastname}`);
  console.log(`   - Puedes usar este ID al crear boletas`);
}

// ====================================
// EJEMPLOS ADICIONALES
// ====================================

// Ejemplo 1: Probar con múltiples usuarios
async function testMultipleUsers() {
  console.log('\n═'.repeat(60));
  console.log('🧪 TEST: Múltiples Usuarios');
  console.log('═'.repeat(60));

  const usuarios = [
    { email: 'inspector@test.com', password: 'password123', rol: 'inspector' },
    { email: 'ingeniero@test.com', password: 'password123', rol: 'ingeniero' },
  ];

  for (const usuario of usuarios) {
    console.log(`\n\n🔍 Probando ${usuario.rol}...`);
    const token = await login(usuario.email, usuario.password);
    if (token) {
      await getMyInfo(token);
    }
  }
}

// Ejemplo 2: Simular el uso en el frontend
async function simulateFrontendUsage() {
  console.log('\n═'.repeat(60));
  console.log('🌐 SIMULACIÓN: Uso en Frontend');
  console.log('═'.repeat(60));

  const email = 'inspector@test.com';
  const password = 'password123';

  // 1. Usuario hace login
  const token = await login(email, password);
  if (!token) return;

  // 2. Guardar token en localStorage (simulado)
  console.log('\n💾 Guardando token en localStorage (simulado)...');

  // 3. Al cargar la página de crear boleta, obtener el ID del usuario
  console.log('\n📄 Usuario navega a página de crear boleta...');
  const myInfo = await getMyInfo(token);
  
  if (myInfo) {
    console.log('\n🎯 Rellenando formulario con:');
    console.log(`   - Inspector/Ingeniero ID: ${myInfo.id}`);
    console.log(`   - Nombre: ${myInfo.name} ${myInfo.lastname}`);
    console.log('\n✅ El formulario puede usar este ID automáticamente');
  }
}

// ====================================
// EJECUTAR PRUEBAS
// ====================================

// Ejecutar la prueba principal
testMyInspectorIngenieroId();

// Descomentar para probar otros escenarios:
// testMultipleUsers();
// simulateFrontendUsage();
