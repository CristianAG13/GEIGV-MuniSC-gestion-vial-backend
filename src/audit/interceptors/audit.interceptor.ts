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
            description: description || this.generateDescription(action, entity, result),
            userAgent,
            ip,
            url,
            metadata: {
              method,
              timestamp: new Date().toISOString(),
            },
          };

          // Agregar datos específicos según la acción
          switch (action) {
            case AuditAction.CREATE:
              auditData['entityId'] = result?.id || result?.data?.id;
              // Para CREATE, capturar tanto el request body como la respuesta
              auditData['changesAfter'] = this.sanitizeData(result?.data || result);
              auditData['requestData'] = this.sanitizeData(request.body);
              break;

            case AuditAction.UPDATE:
              auditData['entityId'] = request.params?.id || result?.id;
              auditData['changesBefore'] = this.sanitizeData(request.body?.currentData);
              auditData['changesAfter'] = this.sanitizeData(result?.data || result);
              auditData['requestData'] = this.sanitizeData(request.body);
              break;

            case AuditAction.DELETE:
              auditData['entityId'] = request.params?.id;
              auditData['changesBefore'] = this.sanitizeData(request.body?.entityData || result?.deletedData);
              break;

            case AuditAction.ROLE_CHANGE:
              auditData['entityId'] = request.params?.id;
              auditData['changesBefore'] = this.sanitizeData(request.body?.currentRoles);
              auditData['changesAfter'] = this.sanitizeData(result?.roles || result?.data?.roles);
              auditData['requestData'] = this.sanitizeData(request.body);
              break;

            case AuditAction.RESTORE:
              auditData['entityId'] = request.params?.id;
              auditData['changesAfter'] = this.sanitizeData(result?.data || result);
              auditData['metadata']['restoredFrom'] = 'soft_delete';
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

  private generateDescription(action: AuditAction, entity: AuditEntity, result: any): string {
    const entityName = entity.charAt(0).toUpperCase() + entity.slice(1);
    const entityId = result?.id || result?.data?.id || 'desconocido';

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