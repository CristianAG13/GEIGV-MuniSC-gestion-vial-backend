// =========================================================
// Script para probar el sistema de solicitudes de rol
// =========================================================

console.log('🧪 SISTEMA DE SOLICITUDES DE ROL - GUÍA DE TESTING\n');

console.log('📋 RUTAS IMPLEMENTADAS:\n');

console.log('1️⃣ CREAR SOLICITUD (Usuario autenticado)');
console.log('POST /api/v1/role-requests');
console.log('Headers: Authorization: Bearer {token}');
console.log('Body:');
console.log(JSON.stringify({
  "requestedRole": "admin",
  "justification": "Necesito permisos de administrador para gestionar el sistema"
}, null, 2));

console.log('\n2️⃣ VER SOLICITUDES PENDIENTES (Solo admins)');
console.log('GET /api/v1/role-requests/pending');
console.log('Headers: Authorization: Bearer {admin-token}');

console.log('\n3️⃣ VER MIS SOLICITUDES (Usuario autenticado)');
console.log('GET /api/v1/role-requests/my-requests');
console.log('Headers: Authorization: Bearer {token}');

console.log('\n4️⃣ APROBAR SOLICITUD (Solo admins)');
console.log('PATCH /api/v1/role-requests/{requestId}/approve');
console.log('Headers: Authorization: Bearer {admin-token}');

console.log('\n5️⃣ RECHAZAR SOLICITUD (Solo admins)');
console.log('PATCH /api/v1/role-requests/{requestId}/reject');
console.log('Headers: Authorization: Bearer {admin-token}');
console.log('Body:');
console.log(JSON.stringify({
  "reason": "No cumple con los requisitos necesarios"
}, null, 2));

console.log('\n6️⃣ ESTADÍSTICAS (Solo admins)');
console.log('GET /api/v1/role-requests/stats');
console.log('Headers: Authorization: Bearer {admin-token}');

console.log('\n7️⃣ CANCELAR SOLICITUD (Propio usuario)');
console.log('DELETE /api/v1/role-requests/{requestId}');
console.log('Headers: Authorization: Bearer {token}');

console.log('\n🔐 ROLES CON PERMISOS:');
console.log('- Crear solicitud: Cualquier usuario autenticado');
console.log('- Ver pendientes: admin, superadmin');
console.log('- Aprobar/Rechazar: admin, superadmin');
console.log('- Ver estadísticas: admin, superadmin');
console.log('- Ver mis solicitudes: usuario propietario');
console.log('- Cancelar: usuario propietario (solo pendientes)');

console.log('\n📊 RESPUESTA DE ESTADÍSTICAS:');
console.log(JSON.stringify({
  "pending": 3,
  "approved": 15,
  "rejected": 2,
  "total": 20
}, null, 2));

console.log('\n✅ FLUJO COMPLETO DE PRUEBA:');
console.log('1. Registrar usuario sin rol');
console.log('2. Hacer login');
console.log('3. Crear solicitud de rol');
console.log('4. Admin ve solicitudes pendientes');
console.log('5. Admin aprueba/rechaza solicitud');
console.log('6. Usuario verifica que se asignó el rol');
console.log('7. Verificar estadísticas');

console.log('\n🚀 ¡Sistema de solicitudes de rol implementado exitosamente!');
