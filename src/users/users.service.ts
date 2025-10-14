import { 
  Injectable, 
  NotFoundException, 
  ConflictException,
  BadRequestException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignRolesDto } from './dto/assign-roles.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, name, lastname, roleIds } = createUserDto;

    // Verificar si el email ya existe
    const existingUser = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el usuario
    const user = this.userRepository.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      lastname,
    });

    // Verificar si este es el primer usuario en el sistema
    const userCount = await this.userRepository.count();

    if (userCount === 0) {
      // Si es el primer usuario, asignarle el rol de superadmin
      const superadminRole = await this.roleRepository.findOne({
        where: { name: 'superadmin' }
      });

      if (!superadminRole) {
        // Si no existe el rol, crear uno
        throw new BadRequestException('El rol superadmin no existe en el sistema');
      }

      user.roles = [superadminRole];
    } else {
      // Para los demás usuarios, asignar roles si se proporcionaron
      if (roleIds && roleIds.length > 0) {
        const roles = await this.roleRepository.findBy({
          id: In(roleIds),
        });

        if (roles.length !== roleIds.length) {
          throw new BadRequestException('Uno o más roles no existen');
        }

        user.roles = roles;
      } else {
        // Si no se proporcionaron roles, asignar rol de invitado por defecto
        const invitadoRole = await this.roleRepository.findOne({
          where: { name: 'invitado' }
        });

        if (invitadoRole) {
          user.roles = [invitadoRole];
        }
      }
    }

    const savedUser = await this.userRepository.save(user);

    // Mostrar información de usuario creado
    const roleNames = savedUser.roles?.map(r => r.name).join(', ') || 'sin roles';
    console.log(`✅ Usuario creado: ${savedUser.email} | Roles: ${roleNames}`);

    // Retornar el usuario con roles
    return this.findOne(savedUser.id);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      relations: ['roles'],
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles'],
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email: email.toLowerCase() },
      relations: ['roles'],
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    const { roleIds, password, email, ...otherUpdates } = updateUserDto;

    // Verificar email único si se está actualizando
    if (email && email.toLowerCase() !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        throw new ConflictException('El email ya está registrado');
      }
      user.email = email.toLowerCase();
    }

    // Actualizar contraseña si se proporciona
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    // Actualizar roles si se proporcionan
    if (roleIds !== undefined) {
      if (roleIds.length === 0) {
        user.roles = [];
      } else {
        const roles = await this.roleRepository.findBy({
          id: In(roleIds),
        });

        if (roles.length !== roleIds.length) {
          throw new BadRequestException('Uno o más roles no existen');
        }

        user.roles = roles;
      }
    }

    // Aplicar otras actualizaciones
    Object.assign(user, otherUpdates);

    const updatedUser = await this.userRepository.save(user);
    
    // Mostrar información de usuario actualizado
    const roleNames = updatedUser.roles?.map(r => r.name).join(', ') || 'sin roles';
    console.log(`🔄 Usuario actualizado: ${updatedUser.email} | Roles: ${roleNames}`);
    
    return this.findOne(id);
  }

  // async assignRoles(id: number, assignRolesDto: AssignRolesDto): Promise<User> {
  //   const user = await this.findOne(id);
  //   const { roleIds } = assignRolesDto;

  //   const roles = await this.roleRepository.findBy({
  //     id: In(roleIds),
  //   });

  //   if (roles.length !== roleIds.length) {
  //     throw new BadRequestException('Uno o más roles no existen');
  //   }

  //   user.roles = roles;
  //   await this.userRepository.save(user);

  //   return this.findOne(id);
  // }

  async assignRoles(id: number, assignRolesDto: AssignRolesDto): Promise<User> {
  const user = await this.findOne(id);
  const { roleIds } = assignRolesDto;

  if (roleIds.length === 0) {
    // Remover todos los roles Y marcar como inactivo
    user.roles = [];
    user.isActive = false; // Agregar esta línea
    await this.userRepository.save(user);
    
    // Mostrar información de roles removidos
    console.log(`🚫 Todos los roles removidos de: ${user.email} | Usuario desactivado`);
    
    return this.findOne(id);
  }

  // Para roles no vacíos, validar que existan y marcar como activo
  const roles = await this.roleRepository.findBy({
    id: In(roleIds),
  });

  if (roles.length !== roleIds.length) {
    throw new BadRequestException('Uno o más roles no existen');
  }

  user.roles = roles;
  user.isActive = true; // Activar cuando se asignan roles
  await this.userRepository.save(user);
  
  // Mostrar información de roles asignados
  const roleNames = roles.map(r => r.name).join(', ');
  console.log(`👤 Roles asignados a: ${user.email} | Nuevos roles: ${roleNames}`);
  
  return this.findOne(id);
}

  async removeRole(userId: number, roleId: number): Promise<User> {
    const user = await this.findOne(userId);
    
    const roleToRemove = user.roles.find(role => role.id === roleId);
    user.roles = user.roles.filter(role => role.id !== roleId);
    await this.userRepository.save(user);

    // Mostrar información de rol removido
    if (roleToRemove) {
      console.log(`➖ Rol removido de: ${user.email} | Rol eliminado: ${roleToRemove.name}`);
    }

    return this.findOne(userId);
  }

  async remove(id: number): Promise<{ id: number; email: string; deletedData: any }> {
    const user = await this.findOne(id);
    
    // Capturar datos para auditoría antes de eliminar
    const userDataForAudit = {
      id: user.id,
      email: user.email,
      name: user.name,
      lastname: user.lastname,
      isActive: user.isActive,
      roles: user.roles?.map(role => ({ id: role.id, name: role.name })) || [],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin,
    };
    
    try {
      // Intentar eliminar directamente (debería funcionar con las configuraciones onDelete)
      await this.userRepository.remove(user);
      
      // Mostrar información de usuario eliminado
      console.log(`🗑️ Usuario eliminado: ${user.email} | ID: ${user.id}`);
      
      // ✅ Backend registra automáticamente - la auditoría la maneja el interceptor
      // Retornar datos para que el interceptor pueda capturarlos
      return {
        id: user.id,
        email: user.email,
        deletedData: userDataForAudit
      };
    } catch (error) {
      // Si hay error por restricciones de integridad referencial, 
      // podemos manejarlo manualmente si es necesario
      if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === '23000') {
        throw new BadRequestException(
          'No se puede eliminar el usuario porque tiene registros relacionados. ' +
          'Considere desactivar el usuario en lugar de eliminarlo.'
        );
      }
      throw error;
    }
  }

  async forceRemove(id: number): Promise<{ id: number; email: string; deletedData: any }> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles'],
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    // Capturar datos para auditoría antes de eliminar
    const userDataForAudit = {
      id: user.id,
      email: user.email,
      name: user.name,
      lastname: user.lastname,
      isActive: user.isActive,
      roles: user.roles?.map(role => ({ id: role.id, name: role.name })) || [],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin,
    };

    // Usar una transacción para asegurar consistencia
    await this.userRepository.manager.transaction(async transactionalEntityManager => {
      // 1. Limpiar roles (tabla many-to-many)
      if (user.roles && user.roles.length > 0) {
        user.roles = [];
        await transactionalEntityManager.save(User, user);
      }

      // 2. Las relaciones con onDelete: 'CASCADE' o 'SET NULL' se manejarán automáticamente
      // 3. Eliminar el usuario
      await transactionalEntityManager.remove(User, user);

      // ✅ Backend registra automáticamente - la auditoría la maneja el interceptor
      // No se registra manualmente para evitar duplicados
    });

    // Mostrar información de usuario eliminado forzadamente
    console.log(`💥 Usuario eliminado forzadamente: ${user.email} | ID: ${user.id}`);

    // Retornar datos para que el interceptor pueda capturarlos
    return {
      id: user.id,
      email: user.email,
      deletedData: userDataForAudit
    };
  }

  async deactivate(id: number): Promise<User> {
    const user = await this.findOne(id);
    user.isActive = false;
    await this.userRepository.save(user);
    
    // Mostrar información de usuario desactivado
    console.log(`⏸️ Usuario desactivado: ${user.email} | ID: ${user.id}`);
    
    return user;
  }

  async activate(id: number): Promise<User> {
    const user = await this.findOne(id);
    user.isActive = true;
    await this.userRepository.save(user);
    
    // Mostrar información de usuario activado
    console.log(`▶️ Usuario activado: ${user.email} | ID: ${user.id}`);
    
    return user;
  }

  async updateLastLogin(id: number): Promise<void> {
    await this.userRepository.update(id, { 
      lastLogin: new Date() 
    });
  }

  // Método para buscar usuarios por rol
  async findByRole(roleName: string): Promise<User[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect('user.roles', 'role')
      .where('role.name = :roleName', { roleName })
      .getMany();
  }

  // Método para obtener estadísticas básicas
  async getStats() {
    const totalUsers = await this.userRepository.count();
    const activeUsers = await this.userRepository.count({
      where: { isActive: true },
    });
    const inactiveUsers = totalUsers - activeUsers;

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
    };
  }
}