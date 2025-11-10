import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RolesService } from '../roles/roles.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../roles/entities/role.entity';

@Injectable()
export class InitializationService implements OnModuleInit {
  private readonly logger = new Logger(InitializationService.name);

  constructor(
    private readonly rolesService: RolesService,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async onModuleInit() {
    await this.initializeApplication();
  }

  private async initializeApplication() {
    try {
      this.logger.log('🚀 Inicializando aplicación...');

      // Verificar y crear roles por defecto
      await this.ensureDefaultRoles();

      this.logger.log('✅ Inicialización completada exitosamente');
    } catch (error) {
      this.logger.error('❌ Error durante la inicialización:', error);
    }
  }

  private async ensureDefaultRoles() {
    try {
      this.logger.log('🔍 Verificando roles por defecto...');

      // Contar roles existentes
      const roleCount = await this.roleRepository.count();

      if (roleCount === 0) {
        this.logger.log('📋 No se encontraron roles. Creando roles por defecto...');
        
        const result = await this.rolesService.createDefaultRoles();
        
        this.logger.log(`✅ ${result.created} roles creados exitosamente:`);
        result.roles.forEach(role => {
          this.logger.log(`   - ${role.name}: ${role.description}`);
        });
      } else {
        this.logger.log(`✅ Se encontraron ${roleCount} roles existentes`);

        // Verificar roles críticos específicos
        await this.ensureCriticalRoles();
      }
    } catch (error) {
      this.logger.error('❌ Error verificando roles por defecto:', error);
    }
  }

  private async ensureCriticalRoles() {
    const criticalRoles = [
      { name: 'superadmin', description: 'Administrador con todos los permisos' },
      { name: 'ingeniero', description: 'Ingeniero con permisos de gestión' },
      { name: 'invitado', description: 'Usuario invitado con permisos limitados' },
    ];

    for (const roleData of criticalRoles) {
      const existingRole = await this.roleRepository.findOne({
        where: { name: roleData.name },
      });

      if (!existingRole) {
        this.logger.log(`📋 Creando rol crítico faltante: ${roleData.name}`);
        const role = this.roleRepository.create(roleData);
        await this.roleRepository.save(role);
        this.logger.log(`✅ Rol ${roleData.name} creado exitosamente`);
      }
    }
  }

  // Método público para reinicializar manualmente
  async reinitialize() {
    this.logger.log('🔄 Reinicializando aplicación manualmente...');
    await this.initializeApplication();
    return { message: 'Reinicialización completada' };
  }

  // Método para verificar el estado del sistema
  async getSystemStatus() {
    try {
      const roleCount = await this.roleRepository.count();
      const roles = await this.roleRepository.find({ 
        select: ['id', 'name', 'description', 'isActive', 'createdAt'] 
      });

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        roles: {
          total: roleCount,
          list: roles
        }
      };
    } catch (error) {
      this.logger.error('❌ Error obteniendo estado del sistema:', error);
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }
}