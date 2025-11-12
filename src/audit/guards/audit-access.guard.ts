import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AuditAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    if (!user.roles || !Array.isArray(user.roles)) {
      throw new ForbiddenException('Acceso denegado: sin roles asignados');
    }

    const hasAccess = user.roles.some((userRole: any) => 
      userRole.name === 'superadmin' || 
      userRole.name === 'super_admin' ||
      userRole.name === 'ingeniero' ||
      userRole.name === 'inspector'
    );

    if (!hasAccess) {
      throw new ForbiddenException('Acceso denegado: solo superadministradores, ingenieros e inspectores pueden acceder a los logs de auditoría');
    }

    return true;
  }
}