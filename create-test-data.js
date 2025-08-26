// Script para crear datos de prueba
const bcrypt = require('bcrypt');

async function createTestData() {
  console.log('🔧 Generando datos de prueba...\n');
  
  // Generar hash para contraseña "123456"
  const password = '123456';
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  
  console.log('📋 DATOS DE PRUEBA PARA INSERTAR EN LA BASE DE DATOS:\n');
  
  console.log('=== ROLES ===');
  console.log(`INSERT INTO roles (name, description, isActive, createdAt, updatedAt) VALUES
('superadmin', 'Administrador con todos los permisos', true, NOW(), NOW()),
('admin', 'Administrador del sistema', true, NOW(), NOW()),
('usuario', 'Usuario estándar', true, NOW(), NOW()),
('invitado', 'Usuario invitado con permisos limitados', true, NOW(), NOW());`);
  
  console.log('\n=== USUARIO DE PRUEBA ===');
  console.log(`INSERT INTO users (name, lastname, email, password, isActive, createdAt, updatedAt) VALUES
('Admin', 'Test', 'admin@test.com', '${hashedPassword}', true, NOW(), NOW()),
('Usuario', 'Demo', 'user@test.com', '${hashedPassword}', true, NOW(), NOW());`);
  
  console.log('\n=== ASIGNAR ROLES ===');
  console.log(`INSERT INTO user_roles (user_id, role_id) VALUES
(1, 2),
(2, 3);`);
  
  console.log('\n📝 CREDENCIALES PARA LOGIN:');
  console.log('👤 Admin:');
  console.log('   Email: admin@test.com');
  console.log('   Password: 123456');
  console.log('');
  console.log('👤 User:');
  console.log('   Email: user@test.com');
  console.log('   Password: 123456');
}

createTestData().catch(console.error);