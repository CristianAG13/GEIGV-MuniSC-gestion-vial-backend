/**
 * Script para probar que el inspector puede crear boletas de alquiler
 * 
 * Prueba:
 * - POST /api/v1/machinery/rental-report (Inspector debe poder crear)
 * - GET /api/v1/machinery/rental-report (Inspector debe poder listar)
 */

const BASE_URL = 'http://localhost:3000/api/v1';

async function testInspectorRentalReportAccess() {
  console.log('🧪 Prueba: Acceso de Inspector a Reportes de Alquiler\n');

  try {
    // 1. Login como inspector
    console.log('1️⃣ Haciendo login como inspector...');
    
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
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
      console.error('❌ Error al hacer login:', loginResponse.status);
      const errorText = await loginResponse.text();
      console.error('Detalles:', errorText);
      
      if (loginResponse.status === 401) {
        console.log('\n⚠️ Verifica:');
        console.log('- El email y contraseña del inspector son correctos');
        console.log('- Que el usuario exista en la base de datos');
      }
      
      return;
    }

    const { access_token } = await loginResponse.json();
    console.log('✅ Login exitoso\n');

    // 2. Obtener información del inspector (para obtener su ID)
    console.log('2️⃣ Obteniendo información del inspector...');
    
    const meResponse = await fetch(`${BASE_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    if (!meResponse.ok) {
      console.error('❌ Error al obtener información del usuario:', meResponse.status);
      return;
    }

    const inspector = await meResponse.json();
    console.log('✅ Inspector:', inspector);
    console.log(`   ID: ${inspector.id}`);
    console.log(`   Nombre: ${inspector.name} ${inspector.lastname}`);
    console.log(`   Roles: ${inspector.roles?.map(r => r.name || r).join(', ')}\n`);

    // 3. Crear una boleta de alquiler
    console.log('3️⃣ Creando boleta de alquiler...');
    
    const createResponse = await fetch(`${BASE_URL}/machinery/rental-report`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fecha: new Date().toISOString().split('T')[0], // Fecha de hoy
        codigoCamino: '267',
        distrito: 'Desamparados',
        tipoMaquinaria: 'vagoneta',
        placa: 'TEST-001',
        actividad: 'Transporte de materiales',
        cantidad: 10,
        horas: 8,
        fuente: 'Municipal',
        // instructorIngenieroId se asignará automáticamente al ID del usuario actual
      }),
    });

    console.log('Status:', createResponse.status);

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('❌ Error al crear boleta de alquiler:', createResponse.status);
      console.error('Detalles:', errorText);
      
      if (createResponse.status === 403) {
        console.log('\n❌ El inspector NO TIENE acceso para crear boletas de alquiler');
        console.log('⚠️ Esto es un problema, debería tener acceso.');
      }
      
      return;
    }

    const rentalReport = await createResponse.json();
    console.log('✅ Boleta de alquiler creada exitosamente!');
    console.log('   ID:', rentalReport.id);
    console.log('   Actividad:', rentalReport.actividad);
    console.log('   Fecha:', rentalReport.fecha);
    console.log('   Instructor/Ingeniero ID:', rentalReport.instructorIngenieroId);
    console.log();

    // 4. Listar boletas de alquiler
    console.log('4️⃣ Listando boletas de alquiler...');
    
    const listResponse = await fetch(`${BASE_URL}/machinery/rental-report`, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    if (!listResponse.ok) {
      console.error('❌ Error al listar boletas de alquiler:', listResponse.status);
      return;
    }

    const rentalReports = await listResponse.json();
    console.log(`✅ Se encontraron ${rentalReports.length} boletas de alquiler\n`);

    // 5. Resumen final
    console.log('═══════════════════════════════════════════');
    console.log('✅ TODAS LAS PRUEBAS PASARON');
    console.log('═══════════════════════════════════════════');
    console.log('✓ El inspector puede hacer login');
    console.log('✓ El inspector puede obtener su información');
    console.log('✓ El inspector puede crear boletas de alquiler');
    console.log('✓ El inspector puede listar boletas de alquiler');
    console.log('═══════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
    console.error(error);
  }
}

// Ejecutar las pruebas
testInspectorRentalReportAccess();
