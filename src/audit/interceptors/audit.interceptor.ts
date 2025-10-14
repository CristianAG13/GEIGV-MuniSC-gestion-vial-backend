import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { AuditService } from '../audit.service';
import { AuditAction, AuditEntity } from '../entities/audit-log.entity';

// Decorator para marcar métodos que deben ser auditados
export const AUDIT_KEY = 'audit';
export const Audit = (entity: AuditEntity, action: AuditAction, description?: string) => 
  (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(AUDIT_KEY, { entity, action, description }, descriptor.value);
  };

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly auditService: AuditService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditMetadata = this.reflector.get<{
      entity: AuditEntity;
      action: AuditAction;
      description?: string;
    }>(AUDIT_KEY, context.getHandler());

    if (!auditMetadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const { entity, action, description } = auditMetadata;

    return next.handle().pipe(
      tap(async (result) => {
        try {
          // Extraer información del request
          const userAgent = request.headers['user-agent'];
          const ip = request.ip || request.connection.remoteAddress;
          const url = request.url;
          const method = request.method;

          // Preparar datos base para auditoría
          const auditData = {
            action,
            entity,
            userId: user?.id,
            userEmail: user?.email,
            userName: user?.name,
            userLastname: user?.lastname,
            userRoles: user?.roles?.map((role: any) => role.name),
            description: description || this.generateDescription(action, entity, result, request),
            userAgent,
            ip,
            url,
          };

          // Agregar datos específicos según la acción
          switch (action) {
            case AuditAction.CREATE:
              auditData['entityId'] = result?.id || result?.data?.id;
              auditData['changesAfter'] = this.sanitizeData(result?.data || result);
              break;

            case AuditAction.UPDATE:
              auditData['entityId'] = request.params?.id || result?.id;
              auditData['changesBefore'] = this.sanitizeData(request.body?.currentData);
              auditData['changesAfter'] = this.sanitizeData(result?.data || result);
              break;

            case AuditAction.DELETE:
              auditData['entityId'] = request.params?.id;
              auditData['changesBefore'] = this.sanitizeData(request.body?.entityData || result?.deletedData);
              break;

            case AuditAction.ROLE_CHANGE:
              auditData['entityId'] = request.params?.id;
              auditData['changesBefore'] = this.sanitizeData(request.body?.currentRoles);
              auditData['changesAfter'] = this.sanitizeData(result?.roles || result?.data?.roles);
              break;

            case AuditAction.RESTORE:
              auditData['entityId'] = request.params?.id;
              auditData['changesAfter'] = this.sanitizeData(result?.data || result);
              break;
          }

          // Registrar en auditoría de forma asíncrona
          await this.auditService.createLog(auditData);
        } catch (error) {
          // Log del error pero no fallar la operación principal
          console.error('Error logging audit:', error);
        }
      }),
    );
  }

  private generateDescription(action: AuditAction, entity: AuditEntity, result: any, request?: any): string {
    const entityName = entity.charAt(0).toUpperCase() + entity.slice(1);
    const entityId = result?.id || result?.data?.id || 'desconocido';
    
    // Para usuarios, incluir email en la descripción si está disponible
    if (entity === AuditEntity.USUARIOS) {
      const email = result?.email || result?.data?.email;
      
      switch (action) {
        case AuditAction.CREATE:
          return email ? `Se creó usuario: ${email} (ID: ${entityId})` : `Se creó usuario con ID ${entityId}`;
        case AuditAction.UPDATE:
          return email ? `Se actualizó usuario: ${email} (ID: ${entityId})` : `Se actualizó usuario con ID ${entityId}`;
        case AuditAction.DELETE:
          return email ? `Se eliminó usuario: ${email} (ID: ${entityId})` : `Se eliminó usuario con ID ${entityId}`;
        case AuditAction.ROLE_CHANGE:
          return email ? `Se modificaron roles del usuario: ${email} (ID: ${entityId})` : `Se modificaron roles del usuario con ID ${entityId}`;
        case AuditAction.RESTORE:
          return email ? `Se restauró usuario: ${email} (ID: ${entityId})` : `Se restauró usuario con ID ${entityId}`;
        default:
          return email ? `Operación ${action} en usuario: ${email}` : `Operación ${action} en usuario con ID ${entityId}`;
      }
    }

    // Para operadores, incluir nombre e identificación en la descripción si está disponible
    if (entity === AuditEntity.OPERADORES) {
      const name = result?.name || result?.data?.name;
      const lastName = result?.last || result?.data?.last;
      const identification = result?.identification || result?.data?.identification;
      const fullName = name && lastName ? `${name} ${lastName}` : name || lastName;
      const operatorInfo = fullName && identification ? `${fullName} (CC: ${identification})` : 
                          fullName ? fullName : 
                          identification ? `CC: ${identification}` : null;
      
      // Detectar operaciones específicas basadas en la URL
      const url = request?.url || '';
      const isAssociateUser = url.includes('/associate-user/');
      const isRemoveAssociation = url.includes('/remove-user-association');
      
      switch (action) {
        case AuditAction.CREATE:
          return operatorInfo ? `Se creó operador: ${operatorInfo} (ID: ${entityId})` : `Se creó operador con ID ${entityId}`;
        case AuditAction.UPDATE:
          if (isAssociateUser) {
            return operatorInfo ? `Se asoció usuario con operador: ${operatorInfo} (ID: ${entityId})` : `Se asoció usuario con operador ID ${entityId}`;
          } else if (isRemoveAssociation) {
            return operatorInfo ? `Se removió asociación de usuario del operador: ${operatorInfo} (ID: ${entityId})` : `Se removió asociación de usuario del operador ID ${entityId}`;
          }
          return operatorInfo ? `Se actualizó operador: ${operatorInfo} (ID: ${entityId})` : `Se actualizó operador con ID ${entityId}`;
        case AuditAction.DELETE:
          return operatorInfo ? `Se eliminó operador: ${operatorInfo} (ID: ${entityId})` : `Se eliminó operador con ID ${entityId}`;
        case AuditAction.RESTORE:
          return operatorInfo ? `Se restauró operador: ${operatorInfo} (ID: ${entityId})` : `Se restauró operador con ID ${entityId}`;
        default:
          return operatorInfo ? `Operación ${action} en operador: ${operatorInfo}` : `Operación ${action} en operador con ID ${entityId}`;
      }
    }

    // Para maquinaria (transporte), incluir tipo y placa en la descripción si está disponible
    if (entity === AuditEntity.TRANSPORTE) {
      const tipo = result?.tipo || result?.data?.tipo;
      const placa = result?.placa || result?.data?.placa;
      const machineryInfo = tipo && placa ? `${tipo} (Placa: ${placa})` : 
                           tipo ? tipo : 
                           placa ? `Placa: ${placa}` : null;
      
      switch (action) {
        case AuditAction.CREATE:
          return machineryInfo ? `Se creó maquinaria: ${machineryInfo} (ID: ${entityId})` : `Se creó maquinaria con ID ${entityId}`;
        case AuditAction.UPDATE:
          return machineryInfo ? `Se actualizó maquinaria: ${machineryInfo} (ID: ${entityId})` : `Se actualizó maquinaria con ID ${entityId}`;
        case AuditAction.DELETE:
          return machineryInfo ? `Se eliminó maquinaria: ${machineryInfo} (ID: ${entityId})` : `Se eliminó maquinaria con ID ${entityId}`;
        case AuditAction.RESTORE:
          return machineryInfo ? `Se restauró maquinaria: ${machineryInfo} (ID: ${entityId})` : `Se restauró maquinaria con ID ${entityId}`;
        default:
          return machineryInfo ? `Operación ${action} en maquinaria: ${machineryInfo}` : `Operación ${action} en maquinaria con ID ${entityId}`;
      }
    }

    // Para reportes, incluir fecha y tipo de reporte en la descripción si está disponible
    if (entity === AuditEntity.REPORTES) {
      const fecha = result?.fecha || result?.data?.fecha;
      const tipoActividad = result?.tipoActividad || result?.data?.tipoActividad;
      const url = request?.url || '';
      const isRentalReport = url.includes('rental-report');
      const isMaterialReport = url.includes('material-report');
      const reportType = isRentalReport ? 'Alquiler' : isMaterialReport ? 'Material' : 'Municipal';
      
      let reportInfo = `Reporte ${reportType}`;
      if (fecha) reportInfo += ` (${fecha})`;
      if (tipoActividad) reportInfo += ` - ${tipoActividad}`;
      
      switch (action) {
        case AuditAction.CREATE:
          return `Se creó ${reportInfo} (ID: ${entityId})`;
        case AuditAction.UPDATE:
          return `Se actualizó ${reportInfo} (ID: ${entityId})`;
        case AuditAction.DELETE:
          return `Se eliminó ${reportInfo} (ID: ${entityId})`;
        case AuditAction.RESTORE:
          return `Se restauró ${reportInfo} (ID: ${entityId})`;
        default:
          return `Operación ${action} en ${reportInfo}`;
      }
    }

    // Para roles, incluir nombre del rol en la descripción si está disponible
    if (entity === AuditEntity.ROLES) {
      const name = result?.name || result?.data?.name;
      const roleInfo = name ? `rol ${name}` : 'rol';
      
      switch (action) {
        case AuditAction.CREATE:
          return name ? `Se creó ${roleInfo} (ID: ${entityId})` : `Se creó rol con ID ${entityId}`;
        case AuditAction.UPDATE:
          const url = request?.url || '';
          if (url.includes('/activate/')) {
            return name ? `Se activó ${roleInfo} (ID: ${entityId})` : `Se activó rol con ID ${entityId}`;
          } else if (url.includes('/deactivate/')) {
            return name ? `Se desactivó ${roleInfo} (ID: ${entityId})` : `Se desactivó rol con ID ${entityId}`;
          }
          return name ? `Se actualizó ${roleInfo} (ID: ${entityId})` : `Se actualizó rol con ID ${entityId}`;
        case AuditAction.DELETE:
          return name ? `Se eliminó ${roleInfo} (ID: ${entityId})` : `Se eliminó rol con ID ${entityId}`;
        default:
          return name ? `Operación ${action} en ${roleInfo}` : `Operación ${action} en rol con ID ${entityId}`;
      }
    }

    // Para solicitudes de rol, incluir detalles de la solicitud si están disponibles
    if (entity === AuditEntity.SOLICITUDES) {
      const requestedRole = result?.requestedRole || result?.data?.requestedRole;
      const userName = result?.user?.email || result?.data?.user?.email;
      const requestInfo = requestedRole && userName ? `solicitud de rol ${requestedRole} para ${userName}` : 
                         requestedRole ? `solicitud de rol ${requestedRole}` : 
                         userName ? `solicitud de rol para ${userName}` : 'solicitud de rol';
      
      switch (action) {
        case AuditAction.CREATE:
          return `Se creó ${requestInfo} (ID: ${entityId})`;
        case AuditAction.UPDATE:
          const url = request?.url || '';
          if (url.includes('/approve/')) {
            return `Se aprobó ${requestInfo} (ID: ${entityId})`;
          } else if (url.includes('/reject/')) {
            return `Se rechazó ${requestInfo} (ID: ${entityId})`;
          }
          return `Se actualizó ${requestInfo} (ID: ${entityId})`;
        case AuditAction.DELETE:
          return `Se canceló ${requestInfo} (ID: ${entityId})`;
        default:
          return `Operación ${action} en ${requestInfo}`;
      }
    }

    // Para otras entidades, usar formato genérico
    switch (action) {
      case AuditAction.CREATE:
        return `Se creó ${entityName} con ID ${entityId}`;
      case AuditAction.UPDATE:
        return `Se actualizó ${entityName} con ID ${entityId}`;
      case AuditAction.DELETE:
        return `Se eliminó ${entityName} con ID ${entityId}`;
      case AuditAction.RESTORE:
        return `Se restauró ${entityName} con ID ${entityId}`;
      default:
        return `Operación ${action} en ${entityName}`;
    }
  }

  private sanitizeData(data: any): any {
    if (!data) return null;

    // Crear una copia para evitar modificar el original
    const sanitized = JSON.parse(JSON.stringify(data));

    // Remover campos sensibles
    const sensitiveFields = ['password', 'hash', 'salt', 'token', 'secret'];
    
    const removeSensitiveFields = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(removeSensitiveFields);
      }
      
      if (obj && typeof obj === 'object') {
        const cleaned = { ...obj };
        sensitiveFields.forEach(field => {
          if (cleaned[field]) {
            cleaned[field] = '[REDACTED]';
          }
        });
        
        // Recursivamente limpiar objetos anidados
        Object.keys(cleaned).forEach(key => {
          if (cleaned[key] && typeof cleaned[key] === 'object') {
            cleaned[key] = removeSensitiveFields(cleaned[key]);
          }
        });
        
        return cleaned;
      }
      
      return obj;
    };

    return removeSensitiveFields(sanitized);
  }
}