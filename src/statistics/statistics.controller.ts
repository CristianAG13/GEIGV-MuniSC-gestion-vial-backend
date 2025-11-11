import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { DateRangeDto } from './dto/date-range.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuditInterceptor } from '../audit/interceptors/audit.interceptor';

@Controller('statistics')
@UseGuards(JwtAuthGuard, RolesGuard)
// @UseInterceptors(AuditInterceptor) // Comentado temporalmente para debug
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  /**
   * Obtener todas las estadísticas del dashboard
   */
  @Get('dashboard')
  @Roles('superadmin', 'ingeniero', 'inspector')
  async getDashboardStats(@Query() dateRange: DateRangeDto) {
    return await this.statisticsService.getDashboardStats(dateRange);
  }

  /**
   * Obtener resumen general del sistema
   */
  @Get('overview')
  @Roles('superadmin', 'ingeniero', 'inspector')
  async getSystemOverview(@Query() dateRange: DateRangeDto) {
    return await this.statisticsService.getSystemOverview(dateRange);
  }

  /**
   * Obtener estadísticas de usuarios
   */
  @Get('users')
  @Roles('superadmin', 'ingeniero')
  async getUserStats(@Query() dateRange: DateRangeDto) {
    return await this.statisticsService.getUserStats(dateRange);
  }

  /**
   * Obtener estadísticas de maquinaria
   */
  @Get('machinery')
  @Roles('superadmin', 'ingeniero', 'inspector')
  async getMachineryStats(@Query() dateRange: DateRangeDto) {
    return await this.statisticsService.getMachineryStats(dateRange);
  }

  /**
   * Obtener estadísticas de operadores
   */
  @Get('operators')
  @Roles('superadmin', 'ingeniero', 'inspector')
  async getOperatorStats(@Query() dateRange: DateRangeDto) {
    try {
      const result = await this.statisticsService.getOperatorStats(dateRange);
      
      // Asegurándonos de que el resultado tenga la estructura correcta
      return {
        totalOperators: Number(result.totalOperators) || 0,
        activeOperators: Number(result.activeOperators) || 0,
        operatorsWithoutUser: Number(result.operatorsWithoutUser) || 0,
        operatorsByStatus: Array.isArray(result.operatorsByStatus) ? result.operatorsByStatus : [],
        topActiveOperators: Array.isArray(result.topActiveOperators) ? result.topActiveOperators : [],
        averageHoursPerOperator: Number(result.averageHoursPerOperator) || 0
      };
    } catch (error) {
      console.error('Error in getOperatorStats controller:', error);
      // Devolvemos una respuesta de fallback en caso de error
      return {
        totalOperators: 0,
        activeOperators: 0,
        operatorsWithoutUser: 0,
        operatorsByStatus: [],
        topActiveOperators: [],
        averageHoursPerOperator: 0
      };
    }
  }

  /**
   * Obtener estadísticas de reportes
   */
  @Get('reports')
  @Roles('superadmin', 'ingeniero', 'inspector')
  async getReportStats(@Query() dateRange: DateRangeDto) {
    return await this.statisticsService.getReportStats(dateRange);
  }

  /**
   * Obtener estadísticas avanzadas de auditoría
   */
  @Get('audit')
  @Roles('superadmin', 'ingeniero', 'inspector')
  async getAuditStats(@Query() dateRange: DateRangeDto) {
    return await this.statisticsService.getAuditStatsAdvanced(dateRange);
  }

  /**
   * Obtener tendencias del sistema
   */
  @Get('trends')
  @Roles('superadmin', 'ingeniero', 'inspector')
  async getTrends(@Query() dateRange: DateRangeDto) {
    return await this.statisticsService.getTrends(dateRange);
  }

  /**
   * Obtener alertas del sistema
   */
  @Get('alerts')
  @Roles('superadmin', 'ingeniero', 'inspector')
  async getSystemAlerts() {
    return await this.statisticsService.getSystemAlerts();
  }

  /**
   * Endpoint de prueba para verificar conectividad
   */
  @Get('test')
  @Roles('superadmin', 'ingeniero', 'inspector')
  testEndpoint() {
    return {
      message: '✅ El módulo de estadísticas funciona correctamente',
      timestamp: new Date().toISOString(),
      service: 'statistics-service',
      version: '1.0.0',
      endpoints: [
        'GET /api/v1/statistics/dashboard - Estadísticas completas del dashboard',
        'GET /api/v1/statistics/overview - Resumen general del sistema',
        'GET /api/v1/statistics/users - Estadísticas de usuarios',
        'GET /api/v1/statistics/machinery - Estadísticas de maquinaria',
        'GET /api/v1/statistics/operators - Estadísticas de operadores',
        'GET /api/v1/statistics/reports - Estadísticas de reportes',
        'GET /api/v1/statistics/audit - Estadísticas de auditoría',
        'GET /api/v1/statistics/trends - Tendencias del sistema',
        'GET /api/v1/statistics/alerts - Alertas del sistema',
      ]
    };
  }
}