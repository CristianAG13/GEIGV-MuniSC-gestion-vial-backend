// =========================================================
// Script para probar las solicitudes de rol
// =========================================================

console.log('🧪 PROBANDO SISTEMA DE SOLICITUDES DE ROL\n');

const ejemplos = {
  
  // 1. CREAR SOLICITUD DE ROL
  crearSolicitud: {
    metodo: 'POST',
    url: 'http://localhost:3001/api/v1/role-requests',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_USER_TOKEN_HERE'
    },
    body: {
      requestedRole: 'admin',
      justification: 'Necesito permisos de administrador para gestionar el sistema de gestión vial. Tengo experiencia en administración de sistemas similares y soy responsable del área de tecnología.'
    }
  },

  // 2. VER MIS SOLICITUDES
  misSolicitudes: {
    metodo: 'GET',
    url: 'http://localhost:3001/api/v1/role-requests/my-requests',
    headers: {
      'Authorization': 'Bearer YOUR_USER_TOKEN_HERE'
    }
  },

  // 3. VER SOLICITUDES PENDIENTES (ADMIN)
  solicitudesPendientes: {
    metodo: 'GET',
    url: 'http://localhost:3001/api/v1/role-requests/pending',
    headers: {
      'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE'
    }
  },

  // 4. VER TODAS LAS SOLICITUDES (ADMIN)
  todasLasSolicitudes: {
    metodo: 'GET',
    url: 'http://localhost:3001/api/v1/role-requests',
    headers: {
      'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE'
    }
  },

  // 5. ESTADÍSTICAS (ADMIN)
  estadisticas: {
    metodo: 'GET',
    url: 'http://localhost:3001/api/v1/role-requests/stats',
    headers: {
      'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE'
    }
  },

  // 6. APROBAR SOLICITUD (ADMIN)
  aprobarSolicitud: {
    metodo: 'PATCH',
    url: 'http://localhost:3001/api/v1/role-requests/1/approve',
    headers: {
      'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE'
    }
  },

  // 7. RECHAZAR SOLICITUD (ADMIN)
  rechazarSolicitud: {
    metodo: 'PATCH',
    url: 'http://localhost:3001/api/v1/role-requests/1/reject',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE'
    },
    body: {
      reason: 'No cumple con los requisitos necesarios para el rol solicitado'
    }
  }
};

console.log('📋 ENDPOINTS PARA PROBAR:\n');

Object.keys(ejemplos).forEach((key, index) => {
  const ejemplo = ejemplos[key];
  console.log(`${index + 1}. ${key.toUpperCase()}`);
  console.log(`   ${ejemplo.metodo} ${ejemplo.url}`);
  
  if (ejemplo.body) {
    console.log(`   Body: ${JSON.stringify(ejemplo.body, null, 2)}`);
  }
  console.log('');
});

console.log('🔐 PASOS PARA PROBAR:');
console.log('1. Hacer login para obtener un token');
console.log('2. Reemplazar YOUR_USER_TOKEN_HERE con tu token');
console.log('3. Crear una solicitud de rol');
console.log('4. Ver que la solicitud aparece en "mis solicitudes"');
console.log('5. Con admin token, ver solicitudes pendientes');
console.log('6. Aprobar/rechazar la solicitud');
console.log('7. Verificar que el usuario recibió el rol\n');

console.log('📊 RESPUESTAS ESPERADAS:');
console.log('- Crear solicitud: { id, userId, roleId, justification, status: "pending", ... }');
console.log('- Ver solicitudes: [ { id, user: {...}, requestedRole: {...}, status, ... } ]');
console.log('- Estadísticas: { pending: X, approved: Y, rejected: Z, total: W }');
console.log('- Aprobar: { status: "approved", reviewedBy: adminId, reviewedAt: "..." }');

console.log('\n🚀 ¡Listo para probar el sistema de solicitudes de rol!');
