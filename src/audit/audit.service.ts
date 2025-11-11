import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, FindOptionsWhere } from 'typeorm';
import { AuditLog, AuditAction, AuditEntity } from './entities/audit-log.entity';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { FilterAuditLogsDto } from './dto/filter-audit-logs.dto';
import { AuditStatsDto } from './dto/audit-stats.dto';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * Crear un nuevo log de auditoría
   */
  async createLog(createAuditLogDto: CreateAuditLogDto): Promise<AuditLog> {
    try {
      // Validar datos básicos antes de crear
      if (!createAuditLogDto.action || !createAuditLogDto.entity) {
        this.logger.warn('Datos de auditoría incompletos:', createAuditLogDto);
        return null;
      }

      // Sanitizar datos para evitar errores de serialización
      const sanitizedDto = {
        ...createAuditLogDto,
        changesAfter: this.sanitizeForDatabase(createAuditLogDto.changesAfter),
        changesBefore: this.sanitizeForDatabase(createAuditLogDto.changesBefore),
        userRoles: Array.isArray(createAuditLogDto.userRoles) ? 
          createAuditLogDto.userRoles : [],
      };

      const auditLog = this.auditLogRepository.create(sanitizedDto);
      const savedLog = await this.auditLogRepository.save(auditLog);
      
      this.logger.log(`✅ Audit log created: ${sanitizedDto.action} on ${sanitizedDto.entity}`);
      return savedLog;
    } catch (error) {
      this.logger.error('❌ Error creating audit log:', {
        error: error.message,
        stack: error.stack,
        data: createAuditLogDto
      });
      // No lanzamos error para evitar que falle la operación principal
      return null;
    }
  }

  /**
   * Sanitizar datos para base de datos
   */
  private sanitizeForDatabase(data: any): any {
    if (!data) return null;
    
    try {
      // Convertir a JSON y parsearlo para eliminar funciones y referencias circulares
      const jsonString = JSON.stringify(data, (key, value) => {
        // Filtrar funciones y propiedades problemáticas
        if (typeof value === 'function') return undefined;
        if (key === 'password' || key === 'hash' || key === 'salt') return '[REDACTED]';
        return value;
      });
      
      return JSON.parse(jsonString);
    } catch (error) {
      this.logger.warn('Error sanitizing data for database:', error);
      return { error: 'Data could not be serialized' };
    }
  }

  /**
   * Obtener logs con filtros y paginación
   */
  async findLogs(filterDto: FilterAuditLogsDto) {
    const {
      action,
      entity,
      entityId,
      userId,
      userEmail,
      startDate,
      endDate,
      search,
      page,
      limit,
      sortBy,
      sortOrder,
    } = filterDto;

    const whereConditions: FindOptionsWhere<AuditLog> = {};

    // Validar y convertir action si es válido
    if (action && Object.values(AuditAction).includes(action as AuditAction)) {
      whereConditions.action = action;
    }
    
    // Validar y convertir entity si es válido
    if (entity && Object.values(AuditEntity).includes(entity as AuditEntity)) {
      whereConditions.entity = entity;
    }
    if (entityId) whereConditions.entityId = entityId;
    if (userId) whereConditions.userId = userId;
    if (userEmail) whereConditions.userEmail = Like(`%${userEmail}%`);

    if (startDate && endDate) {
      whereConditions.timestamp = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      whereConditions.timestamp = Between(new Date(startDate), new Date());
    }

    // Si hay término de búsqueda general, usar query builder simplificado
    if (search) {
      const queryBuilder = this.auditLogRepository.createQueryBuilder('log')
        .leftJoinAndSelect('log.user', 'user');

      // Aplicar filtros básicos
      Object.keys(whereConditions).forEach(key => {
        if (key !== 'timestamp') {
          queryBuilder.andWhere(`log.${key} = :${key}`, { [key]: whereConditions[key] });
        }
      });

      // Aplicar filtro de fecha si existe
      if (whereConditions.timestamp) {
        if (startDate && endDate) {
          queryBuilder.andWhere('log.timestamp BETWEEN :startDate AND :endDate', {
            startDate: new Date(startDate),
            endDate: new Date(endDate)
          });
        } else if (startDate) {
          queryBuilder.andWhere('log.timestamp >= :startDate', {
            startDate: new Date(startDate)
          });
        }
      }

      // Búsqueda solo en campos básicos que funcionan bien
      queryBuilder.andWhere(
        '(log.description ILIKE :search OR ' +
        'log.userEmail ILIKE :search OR ' +
        'log.entityId ILIKE :search)',
        { search: `%${search}%` }
      );

      queryBuilder
        .orderBy(`log.${sortBy}`, sortOrder)
        .skip((page - 1) * limit)
        .take(limit);

      const [logs, total] = await queryBuilder.getManyAndCount();

      return {
        data: this.transformLogsForResponse(logs),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }

    // Si no hay búsqueda, usar findAndCount normal
    const [logs, total] = await this.auditLogRepository.findAndCount({
      where: whereConditions,
      relations: ['user'],
      order: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: this.transformLogsForResponse(logs),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtener estadísticas de auditoría
   */
  async getStats(): Promise<AuditStatsDto> {
    const totalLogs = await this.auditLogRepository.count();

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

    // Logs por usuario (top 10)
    const logsByUserRaw = await this.auditLogRepository
      .createQueryBuilder('log')
      .select('log.userId', 'userId')
      .addSelect('log.userEmail', 'userEmail')
      .addSelect('COUNT(*)', 'count')
      .where('log.userId IS NOT NULL')
      .groupBy('log.userId, log.userEmail')
      .orderBy('COUNT(*)', 'DESC')
      .limit(10)
      .getRawMany();

    const logsByUser = logsByUserRaw.map(item => ({
      userId: item.userId,
      userEmail: item.userEmail,
      count: parseInt(item.count),
    }));

    // Logs de hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const logsToday = await this.auditLogRepository.count({
      where: {
        timestamp: Between(today, tomorrow),
      },
    });

    // Logs de esta semana
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const logsThisWeek = await this.auditLogRepository.count({
      where: {
        timestamp: Between(startOfWeek, new Date()),
      },
    });

    // Logs de este mes
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const logsThisMonth = await this.auditLogRepository.count({
      where: {
        timestamp: Between(startOfMonth, new Date()),
      },
    });

    // Nuevas métricas avanzadas
    const logsByHour = await this.getLogsByHour();
    const logsByDay = await this.getLogsByDay();
    const securityEvents = await this.getSecurityEvents();
    const errorRate = await this.getErrorRate();
    const averageLogsPerDay = await this.getAverageLogsPerDay();
    const peakActivity = await this.getPeakActivity();
    const trends = await this.getAuditTrends();

    return {
      totalLogs,
      logsByAction,
      logsByEntity,
      logsByUser,
      logsToday,
      logsThisWeek,
      logsThisMonth,
      logsByHour,
      logsByDay,
      securityEvents,
      errorRate,
      averageLogsPerDay,
      peakActivity,
      trends,
    };
  }

  /**
   * Obtener logs por entidad específica
   */
  async findLogsByEntity(entity: string, entityId: string, page: number = 1, limit: number = 10) {
    const [logs, total] = await this.auditLogRepository.findAndCount({
      where: { entity, entityId },
      relations: ['user'],
      order: { timestamp: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtener logs por usuario específico
   */
  async findLogsByUser(userId: string, page: number = 1, limit: number = 10) {
    const [logs, total] = await this.auditLogRepository.findAndCount({
      where: { userId },
      relations: ['user'],
      order: { timestamp: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }



  /**
   * Obtener logs agrupados por usuario para identificar duplicados
   */
  async getUserActivitySummary() {
    const summary = await this.auditLogRepository
      .createQueryBuilder('log')
      .select('log.userEmail', 'userEmail')
      .addSelect('log.userName', 'userName') 
      .addSelect('log.userLastname', 'userLastname')
      .addSelect('log.userId', 'userId')
      .addSelect('COUNT(*)', 'totalActions')
      .addSelect('MAX(log.timestamp)', 'lastActivity')
      .addSelect('MIN(log.timestamp)', 'firstActivity')
      .where('log.userId IS NOT NULL')
      .groupBy('log.userEmail, log.userName, log.userLastname, log.userId')
      .orderBy('COUNT(*)', 'DESC')
      .getRawMany();

    return summary.map(item => ({
      userEmail: item.userEmail,
      userName: item.userName,
      userLastname: item.userLastname,
      userId: item.userId,
      fullName: `${item.userName || ''} ${item.userLastname || ''}`.trim(),
      totalActions: parseInt(item.totalActions),
      lastActivity: item.lastActivity,
      firstActivity: item.firstActivity,
    }));
  }

  // Métodos de conveniencia para logging automático

  async logCreate(entity: string, entityData: any, description?: string, userId?: string, userEmail?: string, userName?: string, userLastname?: string, userRoles?: string[]) {
    return this.createLog({
      action: AuditAction.CREATE,
      entity,
      entityId: entityData?.id,
      userId,
      userEmail,
      userName,
      userLastname,
      userRoles,
      description: description || `Se creó ${entity} con ID ${entityData?.id}`,
      changesAfter: entityData,
    });
  }

  async logUpdate(entity: string, entityId: string, beforeData: any, afterData: any, description?: string, userId?: string, userEmail?: string, userName?: string, userLastname?: string, userRoles?: string[]) {
    return this.createLog({
      action: AuditAction.UPDATE,
      entity,
      entityId,
      userId,
      userEmail,
      userName,
      userLastname,
      userRoles,
      description: description || `Se actualizó ${entity} con ID ${entityId}`,
      changesBefore: beforeData,
      changesAfter: afterData,
    });
  }

  async logDelete(entity: string, entityId: string, entityData: any, description?: string, userId?: string, userEmail?: string, userName?: string, userLastname?: string, userRoles?: string[]) {
    return this.createLog({
      action: AuditAction.DELETE,
      entity,
      entityId,
      userId,
      userEmail,
      userName,
      userLastname,
      userRoles,
      description: description || `Se eliminó ${entity} con ID ${entityId}`,
      changesBefore: entityData,
    });
  }

  async logAuth(description: string, userId?: string, userEmail?: string, userName?: string, userLastname?: string) {
    return this.createLog({
      action: AuditAction.AUTH,
      entity: AuditEntity.AUTHENTICATION,
      userId,
      userEmail,
      userName,
      userLastname,
      description,
    });
  }

  async logSystem(description: string) {
    return this.createLog({
      action: AuditAction.SYSTEM,
      entity: AuditEntity.SYSTEM,
      description,
    });
  }

  async logRoleChange(userId: string, userEmail: string, userName: string, userLastname: string, oldRoles: string[], newRoles: string[], description?: string) {
    return this.createLog({
      action: AuditAction.ROLE_CHANGE,
      entity: AuditEntity.ROLES,
      entityId: userId,
      userId,
      userEmail,
      userName,
      userLastname,
      userRoles: newRoles,
      description: description || `Se cambiaron los roles del usuario ${userEmail} (${userName} ${userLastname})`,
      changesBefore: { roles: oldRoles },
      changesAfter: { roles: newRoles },
    });
  }

  async logRestore(entity: string, entityId: string, restoredData: any, description?: string, userId?: string, userEmail?: string, userName?: string, userLastname?: string, userRoles?: string[]) {
    return this.createLog({
      action: AuditAction.RESTORE,
      entity,
      entityId,
      userId,
      userEmail,
      userName,
      userLastname,
      userRoles,
      description: description || `Se restauró ${entity} con ID ${entityId}`,
      changesAfter: restoredData,
    });
  }

  /**
   * Transformar logs para asegurar que las fechas estén en formato UTC correcto
   */
  private transformLogsForResponse(logs: AuditLog[]): any[] {
    return logs.map(log => ({
      ...log,
      // Forzar que el timestamp se envíe como string ISO para evitar conversión de zona horaria
      timestamp: log.timestamp.toISOString(),
      // Agregar información adicional si se necesita
      timestampFormatted: this.formatDateUTC(log.timestamp),
      timestampMs: log.timestamp.getTime()
    }));
  }



  /**
   * Formatear fecha en UTC para mostrar al usuario
   */
  private formatDateUTC(date: Date): string {
    // Crear fecha UTC explícita para evitar conversión de zona horaria
    const utcDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return utcDate.toLocaleString('es-CO', {
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'UTC'
    }) + ' UTC';
  }

  // Nuevos métodos para estadísticas avanzadas

  /**
   * Obtener logs agrupados por hora del día
   */
  async getLogsByHour() {
    const logsByHourRaw = await this.auditLogRepository
      .createQueryBuilder('log')
      .select('HOUR(log.timestamp)', 'hour')
      .addSelect('COUNT(*)', 'count')
      .groupBy('HOUR(log.timestamp)')
      .getRawMany();

    return Array.from({ length: 24 }, (_, i) => {
      const found = logsByHourRaw.find(item => parseInt(item.hour) === i);
      return {
        hour: i,
        count: found ? parseInt(found.count) : 0,
      };
    });
  }

  /**
   * Obtener logs agrupados por día (últimos 30 días)
   */
  async getLogsByDay() {
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

    return logsByDayRaw.map(item => ({
      date: item.date,
      count: parseInt(item.count),
    }));
  }

  /**
   * Obtener eventos de seguridad
   */
  async getSecurityEvents() {
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

    return securityEventsRaw.map(item => ({
      type: item.type,
      count: parseInt(item.count),
      lastOccurrence: new Date(item.lastOccurrence),
    }));
  }

  /**
   * Calcular tasa de errores
   */
  async getErrorRate(): Promise<number> {
    const totalLogs = await this.auditLogRepository.count();
    const errorLogs = await this.auditLogRepository.count({
      where: { action: 'SYSTEM' }
    });
    
    return totalLogs > 0 ? Math.round((errorLogs / totalLogs) * 100 * 100) / 100 : 0;
  }

  /**
   * Calcular promedio de logs por día
   */
  async getAverageLogsPerDay(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logsInPeriod = await this.auditLogRepository.count({
      where: { timestamp: Between(thirtyDaysAgo, new Date()) }
    });

    return Math.round((logsInPeriod / 30) * 100) / 100;
  }

  /**
   * Obtener hora y día de mayor actividad
   */
  async getPeakActivity() {
    // Hora pico
    const peakHourResult = await this.auditLogRepository
      .createQueryBuilder('log')
      .select('HOUR(log.timestamp)', 'hour')
      .addSelect('COUNT(*)', 'count')
      .groupBy('HOUR(log.timestamp)')
      .orderBy('COUNT(*)', 'DESC')
      .limit(1)
      .getRawOne();

    // Día pico (últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const peakDayResult = await this.auditLogRepository
      .createQueryBuilder('log')
      .select('DATE(log.timestamp)', 'day')
      .addSelect('COUNT(*)', 'count')
      .where('log.timestamp >= :thirtyDaysAgo', { thirtyDaysAgo })
      .groupBy('DATE(log.timestamp)')
      .orderBy('COUNT(*)', 'DESC')
      .limit(1)
      .getRawOne();

    return {
      hour: peakHourResult ? parseInt(peakHourResult.hour) : 12,
      day: peakDayResult?.day || new Date().toISOString().split('T')[0],
      count: peakDayResult ? parseInt(peakDayResult.count) : 0,
    };
  }

  /**
   * Obtener tendencias de auditoría
   */
  async getAuditTrends() {
    const now = new Date();
    
    // Comparar con día anterior
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const dayBefore = new Date(now);
    dayBefore.setDate(now.getDate() - 2);

    // Comparar con semana anterior
    const lastWeek = new Date(now);
    lastWeek.setDate(now.getDate() - 7);
    const weekBefore = new Date(now);
    weekBefore.setDate(now.getDate() - 14);

    // Comparar con mes anterior
    const lastMonth = new Date(now);
    lastMonth.setMonth(now.getMonth() - 1);
    const monthBefore = new Date(now);
    monthBefore.setMonth(now.getMonth() - 2);

    const [
      logsYesterday, logsDayBefore,
      logsLastWeek, logsWeekBefore,
      logsLastMonth, logsMonthBefore
    ] = await Promise.all([
      this.auditLogRepository.count({ where: { timestamp: Between(yesterday, now) } }),
      this.auditLogRepository.count({ where: { timestamp: Between(dayBefore, yesterday) } }),
      this.auditLogRepository.count({ where: { timestamp: Between(lastWeek, now) } }),
      this.auditLogRepository.count({ where: { timestamp: Between(weekBefore, lastWeek) } }),
      this.auditLogRepository.count({ where: { timestamp: Between(lastMonth, now) } }),
      this.auditLogRepository.count({ where: { timestamp: Between(monthBefore, lastMonth) } }),
    ]);

    const dailyGrowth = logsDayBefore > 0 ? 
      Math.round(((logsYesterday - logsDayBefore) / logsDayBefore) * 100 * 100) / 100 : 0;
    
    const weeklyGrowth = logsWeekBefore > 0 ? 
      Math.round(((logsLastWeek - logsWeekBefore) / logsWeekBefore) * 100 * 100) / 100 : 0;
    
    const monthlyGrowth = logsMonthBefore > 0 ? 
      Math.round(((logsLastMonth - logsMonthBefore) / logsMonthBefore) * 100 * 100) / 100 : 0;

    return {
      dailyGrowth,
      weeklyGrowth,
      monthlyGrowth,
    };
  }
}