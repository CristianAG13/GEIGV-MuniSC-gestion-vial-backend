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
      const auditLog = this.auditLogRepository.create(createAuditLogDto);
      return await this.auditLogRepository.save(auditLog);
    } catch (error) {
      this.logger.error('Error creating audit log:', error);
      // No lanzamos error para evitar que falle la operación principal
      return null;
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
      whereConditions.action = action as AuditAction;
    }
    
    // Validar y convertir entity si es válido
    if (entity && Object.values(AuditEntity).includes(entity as AuditEntity)) {
      whereConditions.entity = entity as AuditEntity;
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

    return {
      totalLogs,
      logsByAction,
      logsByEntity,
      logsByUser,
      logsToday,
      logsThisWeek,
      logsThisMonth,
    };
  }

  /**
   * Obtener logs por entidad específica
   */
  async findLogsByEntity(entity: AuditEntity, entityId: string, page: number = 1, limit: number = 10) {
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

  async logCreate(entity: AuditEntity, entityData: any, description?: string, userId?: string, userEmail?: string, userName?: string, userLastname?: string, userRoles?: string[]) {
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

  async logUpdate(entity: AuditEntity, entityId: string, beforeData: any, afterData: any, description?: string, userId?: string, userEmail?: string, userName?: string, userLastname?: string, userRoles?: string[]) {
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

  async logDelete(entity: AuditEntity, entityId: string, entityData: any, description?: string, userId?: string, userEmail?: string, userName?: string, userLastname?: string, userRoles?: string[]) {
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

  async logRestore(entity: AuditEntity, entityId: string, restoredData: any, description?: string, userId?: string, userEmail?: string, userName?: string, userLastname?: string, userRoles?: string[]) {
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
}