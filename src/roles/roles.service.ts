import { 
  Injectable, 
  NotFoundException, 
  ConflictException,
  BadRequestException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const { name, description } = createRoleDto;

    // Verificar si el rol ya existe
    const existingRole = await this.roleRepository.findOne({
      where: { name: name.toLowerCase() },
    });

    if (existingRole) {
      throw new ConflictException(`El rol '${name}' ya existe`);
    }

    // Crear el rol
    const role = this.roleRepository.create({
      name: name.toLowerCase(),
      description,
    });

    return this.roleRepository.save(role);
  }

  async findAll(): Promise<Role[]> {
    return this.roleRepository.find({
      relations: ['users'],
      order: { createdAt: 'DESC' },
    });
  }

  async findActive(): Promise<Role[]> {
    return this.roleRepository.find({
      where: { isActive: true },
      relations: ['users'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['users'],
    });

    if (!role) {
      throw new NotFoundException(`Rol con ID ${id} no encontrado`);
    }

    return role;
  }

  async findByName(name: string): Promise<Role | null> {
    return this.roleRepository.findOne({
      where: { name: name.toLowerCase() },
      relations: ['users'],
    });
  }

  async update(id: number, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);
    const { name, ...otherUpdates } = updateRoleDto;

    // Verificar nombre único si se está actualizando
    if (name && name.toLowerCase() !== role.name) {
      const existingRole = await this.roleRepository.findOne({
        where: { name: name.toLowerCase() },
      });

      if (existingRole) {
        throw new ConflictException(`El rol '${name}' ya existe`);
      }
      role.name = name.toLowerCase();
    }

    // Aplicar otras actualizaciones
    Object.assign(role, otherUpdates);

    return this.roleRepository.save(role);
  }

  async remove(id: number): Promise<void> {
    const role = await this.findOne(id);

    // Verificar si el rol tiene usuarios asignados
    if (role.users && role.users.length > 0) {
      throw new BadRequestException(
        `No se puede eliminar el rol '${role.name}' porque tiene ${role.users.length} usuario(s) asignado(s)`
      );
    }

    await this.roleRepository.remove(role);
  }

  async activate(id: number): Promise<Role> {
    const role = await this.findOne(id);
    role.isActive = true;
    return this.roleRepository.save(role);
  }

  async deactivate(id: number): Promise<Role> {
    const role = await this.findOne(id);
    
    // Verificar si es un rol crítico
    if (['admin', 'superadmin'].includes(role.name)) {
      throw new BadRequestException(`No se puede desactivar el rol '${role.name}'`);
    }

    role.isActive = false;
    return this.roleRepository.save(role);
  }

  // Método para obtener estadísticas
  async getStats() {
    const totalRoles = await this.roleRepository.count();
    const activeRoles = await this.roleRepository.count({
      where: { isActive: true },
    });
    const inactiveRoles = totalRoles - activeRoles;

    // Contar usuarios por rol
    const rolesWithUserCount = await this.roleRepository
      .createQueryBuilder('role')
      .leftJoinAndSelect('role.users', 'user')
      .loadRelationCountAndMap('role.userCount', 'role.users')
      .getMany();

    return {
      totalRoles,
      activeRoles,
      inactiveRoles,
      rolesWithUserCount: rolesWithUserCount.map(role => ({
        id: role.id,
        name: role.name,
        description: role.description,
        isActive: role.isActive,
        userCount: (role as any).userCount,
      })),
    };
  }

  // Método para crear roles por defecto
async createDefaultRoles(): Promise<any> {
  try {
    const defaultRoles = [
      { name: 'admin', description: 'Administrador del sistema' },
      { name: 'manager', description: 'Gerente con permisos de gestión' },
      { name: 'user', description: 'Usuario estándar' },
      { name: 'guest', description: 'Usuario invitado con permisos limitados' },
      { name: 'superadmin', description: 'Administrador con todos los permisos' },
    ];

    const createdRoles = [];

    for (const roleData of defaultRoles) {
      const existingRole = await this.roleRepository.findOne({
        where: { name: roleData.name },
      });

      if (!existingRole) {
        const role = this.roleRepository.create(roleData);
        const savedRole = await this.roleRepository.save(role);
        createdRoles.push(savedRole);
      } else {
        createdRoles.push(existingRole);
      }
    }

    return {
      message: 'Roles por defecto procesados exitosamente',
      roles: createdRoles,
      created: createdRoles.length
    };
  } catch (error) {
    console.error('Error creating default roles:', error);
    throw error;
  }
}
}