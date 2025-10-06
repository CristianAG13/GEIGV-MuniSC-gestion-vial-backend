import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    if (!user.roles || !Array.isArray(user.roles)) {
      throw new ForbiddenException('Acceso denegado: sin roles asignados');
    }

    const isSuperAdmin = user.roles.some((userRole: any) => 
      userRole.name === 'superadmin' || userRole.name === 'super_admin'
    );

    if (!isSuperAdmin) {
      throw new ForbiddenException('Acceso denegado: solo superadministradores pueden acceder a los logs de auditoría');
    }

    return true;
  }
}