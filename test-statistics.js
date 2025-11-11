// Script de prueba para el nuevo módulo de estadísticas
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// Token de prueba - debes reemplazar con un token válido
const TOKEN = 'tu-jwt-token-aqui';

const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json'
};

async function testStatistics() {
  console.log('🧪 Probando el nuevo módulo de estadísticas...\n');

  try {
    // 1. Probar estadísticas del dashboard completo
    console.log('1. Probando estadísticas del dashboard...');
    try {
      const dashboardResponse = await axios.get(`${BASE_URL}/statistics/dashboard`, { headers });
      console.log('✅ Dashboard stats exitoso');
      console.log(`   - Total usuarios: ${dashboardResponse.data.overview.totalUsers}`);
      console.log(`   - Total maquinaria: ${dashboardResponse.data.overview.totalMachinery}`);
      console.log(`   - Total reportes: ${dashboardResponse.data.overview.totalReports}`);
      console.log(`   - Logs de auditoría: ${dashboardResponse.data.overview.auditLogsTotal}\n`);
    } catch (error) {
      console.log('❌ Error en dashboard stats:', error.response?.data?.message || error.message);
    }

    // 2. Probar estadísticas de usuarios
    console.log('2. Probando estadísticas de usuarios...');
    try {
      const usersResponse = await axios.get(`${BASE_URL}/statistics/users`, { headers });
      console.log('✅ Users stats exitoso');
      console.log(`   - Usuarios activos: ${usersResponse.data.activeUsers}/${usersResponse.data.totalUsers}`);
      console.log(`   - Roles disponibles: ${usersResponse.data.usersByRole?.length || 0}\n`);
    } catch (error) {
      console.log('❌ Error en users stats:', error.response?.data?.message || error.message);
    }

    // 3. Probar estadísticas de maquinaria
    console.log('3. Probando estadísticas de maquinaria...');
    try {
      const machineryResponse = await axios.get(`${BASE_URL}/statistics/machinery`, { headers });
      console.log('✅ Machinery stats exitoso');
      console.log(`   - Maquinaria activa: ${machineryResponse.data.activeMachinery}/${machineryResponse.data.totalMachinery}`);
      console.log(`   - Reportes este mes: ${machineryResponse.data.reportsThisMonth}\n`);
    } catch (error) {
      console.log('❌ Error en machinery stats:', error.response?.data?.message || error.message);
    }

    // 4. Probar estadísticas de operadores
    console.log('4. Probando estadísticas de operadores...');
    try {
      const operatorsResponse = await axios.get(`${BASE_URL}/statistics/operators`, { headers });
      console.log('✅ Operators stats exitoso');
      console.log(`   - Operadores activos: ${operatorsResponse.data.activeOperators}/${operatorsResponse.data.totalOperators}`);
      console.log(`   - Sin usuario asignado: ${operatorsResponse.data.operatorsWithoutUser}\n`);
    } catch (error) {
      console.log('❌ Error en operators stats:', error.response?.data?.message || error.message);
    }

    // 5. Probar estadísticas de reportes
    console.log('5. Probando estadísticas de reportes...');
    try {
      const reportsResponse = await axios.get(`${BASE_URL}/statistics/reports`, { headers });
      console.log('✅ Reports stats exitoso');
      console.log(`   - Total reportes: ${reportsResponse.data.totalReports}`);
      console.log(`   - Reportes hoy: ${reportsResponse.data.reportsToday}`);
      console.log(`   - Promedio diario: ${reportsResponse.data.averageReportsPerDay}\n`);
    } catch (error) {
      console.log('❌ Error en reports stats:', error.response?.data?.message || error.message);
    }

    // 6. Probar estadísticas de auditoría avanzadas
    console.log('6. Probando estadísticas de auditoría...');
    try {
      const auditResponse = await axios.get(`${BASE_URL}/statistics/audit`, { headers });
      console.log('✅ Audit stats exitoso');
      console.log(`   - Total logs: ${auditResponse.data.totalLogs}`);
      console.log(`   - Logs hoy: ${auditResponse.data.logsToday}`);
      console.log(`   - Tasa de error: ${auditResponse.data.errorRate}%\n`);
    } catch (error) {
      console.log('❌ Error en audit stats:', error.response?.data?.message || error.message);
    }

    // 7. Probar estadísticas con filtros de fecha
    console.log('7. Probando estadísticas con filtros de fecha...');
    try {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      const today = new Date();

      const filteredResponse = await axios.get(`${BASE_URL}/statistics/dashboard`, {
        headers,
        params: {
          startDate: lastWeek.toISOString(),
          endDate: today.toISOString()
        }
      });
      console.log('✅ Filtered stats exitoso');
      console.log(`   - Reportes en última semana: ${filteredResponse.data.overview.totalReports}\n`);
    } catch (error) {
      console.log('❌ Error en filtered stats:', error.response?.data?.message || error.message);
    }

    // 8. Probar tendencias
    console.log('8. Probando tendencias del sistema...');
    try {
      const trendsResponse = await axios.get(`${BASE_URL}/statistics/trends`, { headers });
      console.log('✅ Trends exitoso');
      console.log(`   - Crecimiento de usuarios: ${trendsResponse.data.userGrowth}%`);
      console.log(`   - Crecimiento de reportes: ${trendsResponse.data.reportGrowth}%`);
      console.log(`   - Crecimiento de actividad: ${trendsResponse.data.activityGrowth}%\n`);
    } catch (error) {
      console.log('❌ Error en trends:', error.response?.data?.message || error.message);
    }

    // 9. Probar estadísticas mejoradas de auditoría (endpoint original)
    console.log('9. Probando estadísticas mejoradas de auditoría...');
    try {
      const auditEnhancedResponse = await axios.get(`${BASE_URL}/audit/stats`, { headers });
      console.log('✅ Enhanced audit stats exitoso');
      
      if (auditEnhancedResponse.data.logsByHour) {
        const peakHour = auditEnhancedResponse.data.logsByHour
          .reduce((peak, current) => current.count > peak.count ? current : peak);
        console.log(`   - Hora pico de actividad: ${peakHour.hour}:00 (${peakHour.count} logs)`);
      }
      
      if (auditEnhancedResponse.data.trends) {
        console.log(`   - Crecimiento diario: ${auditEnhancedResponse.data.trends.dailyGrowth}%`);
        console.log(`   - Crecimiento semanal: ${auditEnhancedResponse.data.trends.weeklyGrowth}%`);
      }
      
      console.log(`   - Tasa de error: ${auditEnhancedResponse.data.errorRate}%`);
      console.log(`   - Promedio de logs/día: ${auditEnhancedResponse.data.averageLogsPerDay}\n`);
    } catch (error) {
      console.log('❌ Error en enhanced audit stats:', error.response?.data?.message || error.message);
    }

    console.log('🎉 Pruebas del módulo de estadísticas completadas!');

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

// Instrucciones para usar el script
console.log(`
📊 NUEVO MÓDULO DE ESTADÍSTICAS - GUÍA DE PRUEBAS
==============================================

Para probar este módulo:

1. Asegúrate de que el servidor esté corriendo:
   npm run start:dev

2. Obtén un token JWT válido (login como superadmin, ingeniero o inspector)

3. Reemplaza 'tu-jwt-token-aqui' en este archivo con tu token real

4. Ejecuta las pruebas:
   node test-statistics.js

ENDPOINTS DISPONIBLES:
📈 GET /api/v1/statistics/dashboard - Estadísticas completas del dashboard
👥 GET /api/v1/statistics/users - Estadísticas de usuarios
🚛 GET /api/v1/statistics/machinery - Estadísticas de maquinaria
👷 GET /api/v1/statistics/operators - Estadísticas de operadores
📋 GET /api/v1/statistics/reports - Estadísticas de reportes
🔍 GET /api/v1/statistics/audit - Estadísticas avanzadas de auditoría
📊 GET /api/v1/statistics/trends - Tendencias del sistema
📅 GET /api/v1/statistics/overview - Resumen general del sistema

FILTROS DE FECHA:
Todos los endpoints aceptan parámetros de fecha:
- startDate: Fecha de inicio (ISO string)
- endDate: Fecha de fin (ISO string)
- period: 'today', 'week', 'month', 'quarter', 'year'

EJEMPLO:
GET /api/v1/statistics/dashboard?period=month
GET /api/v1/statistics/users?startDate=2024-01-01&endDate=2024-01-31

PERMISOS:
- Dashboard, overview, machinery, operators, reports, audit, trends: superadmin, ingeniero, inspector
- Users: solo superadmin, ingeniero

¡El módulo está listo para usar! 🚀
`);

// Ejecutar las pruebas si se proporciona un token
if (TOKEN !== 'tu-jwt-token-aqui') {
  testStatistics();
} else {
  console.log('\n⚠️  Por favor, actualiza el TOKEN antes de ejecutar las pruebas.');
}