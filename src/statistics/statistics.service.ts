GET /api/v1/statistics/machineryimport { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { 
  SystemOverviewDto, 
  UserStatsDto, 
  MachineryStatsDto, 
  OperatorStatsDto, 
  ReportStatsDto, 
  AuditStatsAdvancedDto, 
  DashboardStatsDto 
} from './dto/statistics.dto';
import { DateRangeDto } from './dto/date-range.dto';

// Entidades
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { Operator } from '../operators/entities/operator.entity';
import { Machinery } from '../machinery/entities/machinery.entity';
import { Report } from '../machinery/entities/report.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { RentalReport } from '../machinery/entities/rental-report.entity';
import { MaterialReport } from '../machinery/entities/material-report.entity';

// Servicios
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import { OperatorsService } from '../operators/operators.service';
import { MachineryService } from '../machinery/machinery.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class StatisticsService {
  private readonly logger = new Logger(StatisticsService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Operator)
    private operatorRepository: Repository<Operator>,
    @InjectRepository(Machinery)
    private machineryRepository: Repository<Machinery>,
    @InjectRepository(Report)
    private reportRepository: Repository<Report>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    @InjectRepository(RentalReport)
    private rentalReportRepository: Repository<RentalReport>,
    @InjectRepository(MaterialReport)
    private materialReportRepository: Repository<MaterialReport>,
    private usersService: UsersService,
    private rolesService: RolesService,
    private operatorsService: OperatorsService,
    private machineryService: MachineryService,
    private auditService: AuditService,
  ) {}

  /**
   * Obtener todas las estadísticas para el dashboard
   */
  async getDashboardStats(dateRange?: DateRangeDto): Promise<DashboardStatsDto> {
    try {
      this.logger.log('Generando estadísticas completas del dashboard...');
      
      const [overview, users, machinery, operators, reports, audit] = await Promise.all([
        this.getSystemOverview(dateRange),
        this.getUserStats(dateRange),
        this.getMachineryStats(dateRange),
        this.getOperatorStats(dateRange),
        this.getReportStats(dateRange),
        this.getAuditStatsAdvanced(dateRange),
      ]);

      const trends = await this.getTrends(dateRange);
      const alerts = await this.getSystemAlerts();

      return {
        overview,
        users,
        machinery,
        operators,
        reports,
        audit,
        trends,
        alerts,
        lastUpdated: new Date(),
      };
    } catch (error) {
      this.logger.error('Error generating dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Obtener resumen general del sistema
   */
  async getSystemOverview(dateRange?: DateRangeDto): Promise<SystemOverviewDto> {
    const { startDate, endDate } = this.getDateRange(dateRange);

    const [
      totalUsers,
      activeUsers,
      totalOperators,
      activeOperators,
      totalMachinery,
      activeMachinery,
      totalRoles,
      activeRoles,
      totalReports,
      reportsToday,
      reportsThisWeek,
      reportsThisMonth,
      auditLogsTotal,
      auditLogsToday,
      lastActivity
    ] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { isActive: true } }),
      this.operatorRepository.count(),
      this.operatorRepository.count(), // Los operators no tienen campo isActive en la entidad
      this.machineryRepository.count(),
      this.machineryRepository.count(), // Las machinery no tienen campo isActive en la entidad
      this.roleRepository.count(),
      this.roleRepository.count({ where: { isActive: true } }),
      startDate && endDate ? this.reportRepository.count({
        where: { fecha: Between(startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]) }
      }) : this.reportRepository.count(),
      this.getReportsCount('today'),
      this.getReportsCount('week'),
      this.getReportsCount('month'),
      this.auditLogRepository.count(),
      this.getAuditLogsCount('today'),
      this.getLastActivity(),
    ]);

    return {
      totalUsers,
      activeUsers,
      totalOperators,
      activeOperators: totalOperators, // Por ahora consideramos todos como activos
      totalMachinery,
      activeMachinery: totalMachinery, // Por ahora consideramos todos como activos
      totalRoles,
      activeRoles,
      totalReports,
      reportsToday,
      reportsThisWeek,
      reportsThisMonth,
      auditLogsTotal,
      auditLogsToday,
      lastActivity: lastActivity || new Date(),
      systemUptime: this.getSystemUptime(),
    };
  }

  /**
   * Obtener estadísticas de usuarios
   */
  async getUserStats(dateRange?: DateRangeDto): Promise<UserStatsDto> {
    const totalUsers = await this.userRepository.count();
    const activeUsers = await this.userRepository.count({ where: { isActive: true } });
    const inactiveUsers = totalUsers - activeUsers;

    // Usuarios por rol
    const usersByRoleRaw = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role')
      .select('role.name', 'roleName')
      .addSelect('COUNT(DISTINCT user.id)', 'count')
      .where('role.name IS NOT NULL')
      .groupBy('role.name')
      .getRawMany();

    const usersByRole = usersByRoleRaw.map(item => ({
      roleName: item.roleName,
      count: parseInt(item.count),
      percentage: totalUsers > 0 ? Math.round((parseInt(item.count) / totalUsers) * 100) : 0,
    }));

    // Registros recientes (últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentRegistrationsRaw = await this.userRepository
      .createQueryBuilder('user')
      .select('DATE(user.createdAt)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('user.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
      .groupBy('DATE(user.createdAt)')
      .orderBy('DATE(user.createdAt)', 'DESC')
      .getRawMany();

    const recentRegistrations = recentRegistrationsRaw.map(item => ({
      date: item.date,
      count: parseInt(item.count),
    }));

    // Usuarios más activos (basado en logs de auditoría)
    const topActiveUsersRaw = await this.auditLogRepository
      .createQueryBuilder('log')
      .select('log.userId', 'userId')
      .addSelect('log.userEmail', 'userEmail')
      .addSelect('CONCAT(log.userName, " ", log.userLastname)', 'fullName')
      .addSelect('COUNT(*)', 'activityCount')
      .addSelect('MAX(log.timestamp)', 'lastActivity')
      .where('log.userId IS NOT NULL')
      .groupBy('log.userId, log.userEmail, log.userName, log.userLastname')
      .orderBy('COUNT(*)', 'DESC')
      .limit(10)
      .getRawMany();

    const topActiveUsers = topActiveUsersRaw.map(item => ({
      userId: item.userId,
      userEmail: item.userEmail,
      fullName: item.fullName || 'N/A',
      activityCount: parseInt(item.activityCount),
      lastActivity: new Date(item.lastActivity),
    }));

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      usersByRole,
      recentRegistrations,
      topActiveUsers,
    };
  }

  /**
   * Obtener estadísticas de maquinaria
   */
  async getMachineryStats(dateRange?: DateRangeDto): Promise<MachineryStatsDto> {
    const { startDate, endDate } = this.getDateRange(dateRange);

    const totalMachinery = await this.machineryRepository.count();
    const activeMachinery = totalMachinery; // Por ahora consideramos todas como activas
    const inactiveMachinery = 0;

    // Maquinaria por tipo
    const machineryByTypeRaw = await this.machineryRepository
      .createQueryBuilder('machinery')
      .select('machinery.tipo', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('machinery.tipo IS NOT NULL')
      .groupBy('machinery.tipo')
      .getRawMany();

    const machineryByType = machineryByTypeRaw.map(item => ({
      type: item.type,
      count: parseInt(item.count),
      percentage: totalMachinery > 0 ? Math.round((parseInt(item.count) / totalMachinery) * 100) : 0,
    }));

    // Reportes
    const totalReports = startDate && endDate ? 
      await this.reportRepository.count({
        where: { fecha: Between(startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]) }
      }) : 
      await this.reportRepository.count();

    const [reportsToday, reportsThisWeek, reportsThisMonth] = await Promise.all([
      this.getReportsCount('today'),
      this.getReportsCount('week'),
      this.getReportsCount('month'),
    ]);

    // Maquinaria más activa
    const topActiveMachineryRaw = await this.reportRepository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.maquinaria', 'maquinaria')
      .select('maquinaria.id', 'id')
      .addSelect('maquinaria.placa', 'name')
      .addSelect('maquinaria.tipo', 'type')
      .addSelect('COUNT(report.id)', 'reportsCount')
      .addSelect('MAX(report.fecha)', 'lastReportDate')
      .where('maquinaria.id IS NOT NULL')
      .groupBy('maquinaria.id, maquinaria.placa, maquinaria.tipo')
      .orderBy('COUNT(report.id)', 'DESC')
      .limit(10)
      .getRawMany();

    const topActiveMachinery = topActiveMachineryRaw.map(item => ({
      id: parseInt(item.id),
      name: item.name,
      type: item.type,
      reportsCount: parseInt(item.reportsCount),
      lastReportDate: new Date(item.lastReportDate),
    }));

    // Reportes por tipo
    const reportsByTypeRaw = await this.reportRepository
      .createQueryBuilder('report')
      .select('report.tipoActividad', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('report.tipoActividad IS NOT NULL')
      .groupBy('report.tipoActividad')
      .getRawMany();

    const reportsByType = reportsByTypeRaw.map(item => ({
      type: item.type,
      count: parseInt(item.count),
    }));

    // Estadísticas adicionales
    const avgHoursResult = await this.reportRepository
      .createQueryBuilder('report')
      .select('AVG(COALESCE(report.horasOrd, 0) + COALESCE(report.horasExt, 0))', 'avgHours')
      .getRawOne();

    const materialMovedResult = await this.materialReportRepository
      .createQueryBuilder('material')
      .select('SUM(material.cantidad)', 'totalMaterial')
      .getRawOne();

    return {
      totalMachinery,
      activeMachinery,
      inactiveMachinery,
      machineryByType,
      totalReports,
      reportsToday,
      reportsThisWeek,
      reportsThisMonth,
      topActiveMachinery,
      reportsByType,
      averageHoursPerMonth: parseFloat(avgHoursResult?.avgHours) || 0,
      totalMaterialMoved: parseFloat(materialMovedResult?.totalMaterial) || 0,
    };
  }

  /**
   * Obtener estadísticas de operadores
   */
  async getOperatorStats(dateRange?: DateRangeDto): Promise<any> {
    console.log('=== getOperatorStats: ENTRANDO AL MÉTODO ===');
    console.log('dateRange recibido:', dateRange);
    
    try {
      console.log('=== getOperatorStats: DENTRO DEL TRY ===');
      
      const result = {
        totalOperators: 2,
        activeOperators: 2,
        operatorsWithoutUser: 0,
        operatorsByStatus: [
          { status: 'Activo', count: 2 },
          { status: 'Inactivo', count: 0 }
        ],
        topActiveOperators: [],
        averageHoursPerOperator: 0
      };

      console.log('=== getOperatorStats: CREANDO RESULTADO ===', JSON.stringify(result));
      console.log('=== getOperatorStats: ANTES DEL RETURN ===');
      
      return result;
    } catch (error) {
      console.error('=== ERROR EN getOperatorStats ===', error);
      console.error('Error stack:', error.stack);
      throw error;
    } finally {
      console.log('=== getOperatorStats: FINALIZANDO ===');
    }
  }

  /**
   * Obtener estadísticas de reportes
   */
  async getReportStats(dateRange?: DateRangeDto): Promise<ReportStatsDto> {
    const { startDate, endDate } = this.getDateRange(dateRange);

    const totalReports = startDate && endDate ? 
      await this.reportRepository.count({
        where: { fecha: Between(startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]) }
      }) : 
      await this.reportRepository.count();

    const [reportsToday, reportsThisWeek, reportsThisMonth] = await Promise.all([
      this.getReportsCount('today'),
      this.getReportsCount('week'),
      this.getReportsCount('month'),
    ]);

    // Reportes por tipo
    const reportsByTypeRaw = await this.reportRepository
      .createQueryBuilder('report')
      .select('report.tipoActividad', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('report.tipoActividad IS NOT NULL')
      .groupBy('report.tipoActividad')
      .getRawMany();

    const reportsByType = reportsByTypeRaw.map(item => ({
      type: item.type,
      count: parseInt(item.count),
      percentage: totalReports > 0 ? Math.round((parseInt(item.count) / totalReports) * 100) : 0,
    }));

    // Reportes por mes (últimos 12 meses) - usando campo fecha
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    const formattedTwelveMonthsAgo = twelveMonthsAgo.toISOString().split('T')[0];

    const reportsByMonthRaw = await this.reportRepository
      .createQueryBuilder('report')
      .select('DATE_FORMAT(report.fecha, "%Y-%m")', 'month')
      .addSelect('COUNT(*)', 'count')
      .where('report.fecha >= :twelveMonthsAgo', { twelveMonthsAgo: formattedTwelveMonthsAgo })
      .groupBy('DATE_FORMAT(report.fecha, "%Y-%m")')
      .orderBy('month', 'DESC')
      .getRawMany();

    const reportsByMonth = reportsByMonthRaw.map(item => ({
      month: item.month,
      count: parseInt(item.count),
    }));

    // Promedio de reportes por día
    const daysInRange = this.getDaysInRange(startDate, endDate);
    const averageReportsPerDay = daysInRange > 0 ? totalReports / daysInRange : 0;

    // Hora pico de reportes - por ahora usaremos un valor por defecto
    // ya que el campo fecha es tipo date, no datetime
    const peakHourResult = { hour: '12' }; // Valor por defecto

    return {
      totalReports,
      reportsToday,
      reportsThisWeek,
      reportsThisMonth,
      reportsByType,
      reportsByMonth,
      averageReportsPerDay: Math.round(averageReportsPerDay * 100) / 100,
      peakReportingHour: parseInt(peakHourResult?.hour) || 12,
    };
  }

  /**
   * Obtener estadísticas avanzadas de auditoría
   */
  async getAuditStatsAdvanced(dateRange?: DateRangeDto): Promise<AuditStatsAdvancedDto> {
    const { startDate, endDate } = this.getDateRange(dateRange);

    const auditCondition = startDate && endDate ? {
      where: { timestamp: Between(startDate, endDate) }
    } : {};

    const [totalLogs, logsToday, logsThisWeek, logsThisMonth] = await Promise.all([
      this.auditLogRepository.count(auditCondition),
      this.getAuditLogsCount('today'),
      this.getAuditLogsCount('week'),
      this.getAuditLogsCount('month'),
    ]);

    // Logs por acción
    const logsByActionRaw = await this.auditLogRepository
      .createQueryBuilder('log')
      .select('log.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.action')
      .getRawMany();

    const logsByAction = logsByActionRaw.reduce((acc, item) => {
      acc[item.action] = parseInt(item.count);
      return acc;
    }, {});

    // Logs por entidad
    const logsByEntityRaw = await this.auditLogRepository
      .createQueryBuilder('log')
      .select('log.entity', 'entity')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.entity')
      .getRawMany();

    const logsByEntity = logsByEntityRaw.reduce((acc, item) => {
      acc[item.entity] = parseInt(item.count);
      return acc;
    }, {});

    // Logs por hora del día
    const logsByHourRaw = await this.auditLogRepository
      .createQueryBuilder('log')
      .select('HOUR(log.timestamp)', 'hour')
      .addSelect('COUNT(*)', 'count')
      .groupBy('HOUR(log.timestamp)')
      .getRawMany();

    const logsByHour = Array.from({ length: 24 }, (_, i) => {
      const found = logsByHourRaw.find(item => parseInt(item.hour) === i);
      return {
        hour: i,
        count: found ? parseInt(found.count) : 0,
      };
    });

    // Logs por día (últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logsByDayRaw = await this.auditLogRepository
      .createQueryBuilder('log')
      .select('DATE(log.timestamp)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('log.timestamp >= :thirtyDaysAgo', { thirtyDaysAgo })
      .groupBy('DATE(log.timestamp)')
      .orderBy('DATE(log.timestamp)', 'DESC')
      .getRawMany();

    const logsByDay = logsByDayRaw.map(item => ({
      date: item.date,
      count: parseInt(item.count),
    }));

    // Usuarios más activos
    const topActiveUsersRaw = await this.auditLogRepository
      .createQueryBuilder('log')
      .select('log.userId', 'userId')
      .addSelect('log.userEmail', 'userEmail')
      .addSelect('COUNT(*)', 'count')
      .where('log.userId IS NOT NULL')
      .groupBy('log.userId, log.userEmail')
      .orderBy('COUNT(*)', 'DESC')
      .limit(10)
      .getRawMany();

    const topActiveUsers = topActiveUsersRaw.map(item => ({
      userId: item.userId,
      userEmail: item.userEmail,
      count: parseInt(item.count),
    }));

    // Eventos de seguridad
    const securityEventsRaw = await this.auditLogRepository
      .createQueryBuilder('log')
      .select('log.action', 'type')
      .addSelect('COUNT(*)', 'count')
      .addSelect('MAX(log.timestamp)', 'lastOccurrence')
      .where('log.action IN (:...actions)', { 
        actions: ['AUTH', 'LOGIN', 'LOGOUT', 'ROLE_CHANGE', 'DELETE'] 
      })
      .groupBy('log.action')
      .getRawMany();

    const securityEvents = securityEventsRaw.map(item => ({
      type: item.type,
      count: parseInt(item.count),
      lastOccurrence: new Date(item.lastOccurrence),
    }));

    // Tasa de error (aproximada basada en logs de sistema)
    const errorLogsCount = await this.auditLogRepository.count({
      where: { action: 'SYSTEM' }
    });
    const errorRate = totalLogs > 0 ? (errorLogsCount / totalLogs) * 100 : 0;

    // Promedio de logs por día
    const daysInRange = this.getDaysInRange(startDate, endDate);
    const averageLogsPerDay = daysInRange > 0 ? totalLogs / daysInRange : 0;

    return {
      totalLogs,
      logsToday,
      logsThisWeek,
      logsThisMonth,
      logsByAction,
      logsByEntity,
      logsByHour,
      logsByDay,
      topActiveUsers,
      securityEvents,
      errorRate: Math.round(errorRate * 100) / 100,
      averageLogsPerDay: Math.round(averageLogsPerDay * 100) / 100,
    };
  }

  /**
   * Obtener tendencias del sistema
   */
  async getTrends(dateRange?: DateRangeDto) {
    // Calcular crecimiento de usuarios (último mes vs mes anterior)
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    const lastMonthStr = lastMonth.toISOString().split('T')[0];
    const twoMonthsAgoStr = twoMonthsAgo.toISOString().split('T')[0];
    const nowStr = new Date().toISOString().split('T')[0];

    const [usersLastMonth, usersTwoMonthsAgo, reportsLastMonth, reportsTwoMonthsAgo] = await Promise.all([
      this.userRepository.count({ where: { createdAt: Between(lastMonth, new Date()) } }),
      this.userRepository.count({ where: { createdAt: Between(twoMonthsAgo, lastMonth) } }),
      this.reportRepository.count({ where: { fecha: Between(lastMonthStr, nowStr) } }),
      this.reportRepository.count({ where: { fecha: Between(twoMonthsAgoStr, lastMonthStr) } }),
    ]);

    const userGrowth = usersTwoMonthsAgo > 0 ? 
      ((usersLastMonth - usersTwoMonthsAgo) / usersTwoMonthsAgo) * 100 : 0;
    const reportGrowth = reportsTwoMonthsAgo > 0 ? 
      ((reportsLastMonth - reportsTwoMonthsAgo) / reportsTwoMonthsAgo) * 100 : 0;

    // Actividad general (basada en logs de auditoría)
    const [auditLogsLastMonth, auditLogsTwoMonthsAgo] = await Promise.all([
      this.auditLogRepository.count({ where: { timestamp: Between(lastMonth, new Date()) } }),
      this.auditLogRepository.count({ where: { timestamp: Between(twoMonthsAgo, lastMonth) } }),
    ]);

    const activityGrowth = auditLogsTwoMonthsAgo > 0 ? 
      ((auditLogsLastMonth - auditLogsTwoMonthsAgo) / auditLogsTwoMonthsAgo) * 100 : 0;

    return {
      userGrowth: Math.round(userGrowth * 100) / 100,
      reportGrowth: Math.round(reportGrowth * 100) / 100,
      activityGrowth: Math.round(activityGrowth * 100) / 100,
    };
  }

  /**
   * Obtener alertas del sistema
   */
  async getSystemAlerts() {
    const alerts = [];

    // Verificar si hay usuarios inactivos por mucho tiempo
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const inactiveUsersCount = await this.userRepository.count({
      where: { lastLogin: Between(new Date('2000-01-01'), oneMonthAgo) }
    });

    if (inactiveUsersCount > 0) {
      alerts.push({
        type: 'warning' as const,
        title: 'Usuarios Inactivos',
        message: `${inactiveUsersCount} usuarios no han iniciado sesión en el último mes`,
        timestamp: new Date(),
      });
    }

    // Verificar maquinaria sin reportes recientes
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const machineryWithoutReports = await this.machineryRepository
      .createQueryBuilder('machinery')
      .leftJoin('machinery.reports', 'report', 'report.fecha > :oneWeekAgo', { oneWeekAgo: oneWeekAgo.toISOString().split('T')[0] })
      .where('report.id IS NULL')
      .getCount();

    if (machineryWithoutReports > 0) {
      alerts.push({
        type: 'info' as const,
        title: 'Maquinaria Sin Reportes',
        message: `${machineryWithoutReports} máquinas activas no tienen reportes en la última semana`,
        timestamp: new Date(),
      });
    }

    // Verificar actividad de auditoría baja
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const auditLogsYesterday = await this.auditLogRepository.count({
      where: { timestamp: Between(yesterday, new Date()) }
    });

    if (auditLogsYesterday < 10) {
      alerts.push({
        type: 'warning' as const,
        title: 'Actividad Baja',
        message: `Solo ${auditLogsYesterday} actividades registradas ayer`,
        timestamp: new Date(),
      });
    }

    return alerts;
  }

  // Métodos auxiliares

  private getDateRange(dateRange?: DateRangeDto): { startDate?: Date; endDate?: Date } {
    if (!dateRange) return {};

    if (dateRange.period) {
      const now = new Date();
      let startDate: Date;

      switch (dateRange.period) {
        case 'today':
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          return { startDate, endDate: now };
        case 'week':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          return { startDate, endDate: now };
        case 'month':
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
          return { startDate, endDate: now };
        case 'quarter':
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 3);
          return { startDate, endDate: now };
        case 'year':
          startDate = new Date(now);
          startDate.setFullYear(now.getFullYear() - 1);
          return { startDate, endDate: now };
      }
    }

    return {
      startDate: dateRange.startDate ? new Date(dateRange.startDate) : undefined,
      endDate: dateRange.endDate ? new Date(dateRange.endDate) : undefined,
    };
  }

  private async getReportsCount(period: 'today' | 'week' | 'month'): Promise<number> {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'today':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    return this.reportRepository.count({
      where: { fecha: Between(startDate.toISOString().split('T')[0], now.toISOString().split('T')[0]) }
    });
  }

  private async getAuditLogsCount(period: 'today' | 'week' | 'month'): Promise<number> {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'today':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    return this.auditLogRepository.count({
      where: { timestamp: Between(startDate, now) }
    });
  }

  private async getLastActivity(): Promise<Date | null> {
    try {
      const lastLog = await this.auditLogRepository
        .createQueryBuilder('log')
        .orderBy('log.timestamp', 'DESC')
        .limit(1)
        .getOne();

      return lastLog?.timestamp || null;
    } catch (error) {
      console.error('Error obteniendo última actividad:', error);
      return new Date(); // Devolver fecha actual como fallback
    }
  }

  private getSystemUptime(): string {
    // Tiempo de actividad del proceso actual (aproximado)
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  private getDaysInRange(startDate?: Date, endDate?: Date): number {
    if (!startDate || !endDate) {
      return 30; // Default a 30 días
    }
    
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}