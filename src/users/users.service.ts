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

    // Asignar roles si se proporcionaron
    if (roleIds && roleIds.length > 0) {
      const roles = await this.roleRepository.findBy({
        id: In(roleIds),
      });

      if (roles.length !== roleIds.length) {
        throw new BadRequestException('Uno o más roles no existen');
      }

      user.roles = roles;
    }

    const savedUser = await this.userRepository.save(user);

    // Retornar el usuario con roles
    return this.findOne(savedUser.id);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      relations: ['roles'],
      order: { createdAt: 'DESC' },
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

    await this.userRepository.save(user);
    return this.findOne(id);
  }

  async assignRoles(id: number, assignRolesDto: AssignRolesDto): Promise<User> {
    const user = await this.findOne(id);
    const { roleIds } = assignRolesDto;

    const roles = await this.roleRepository.findBy({
      id: In(roleIds),
    });

    if (roles.length !== roleIds.length) {
      throw new BadRequestException('Uno o más roles no existen');
    }

    user.roles = roles;
    await this.userRepository.save(user);

    return this.findOne(id);
  }

  async removeRole(userId: number, roleId: number): Promise<User> {
    const user = await this.findOne(userId);
    
    user.roles = user.roles.filter(role => role.id !== roleId);
    await this.userRepository.save(user);

    return this.findOne(userId);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  async deactivate(id: number): Promise<User> {
    const user = await this.findOne(id);
    user.isActive = false;
    await this.userRepository.save(user);
    return user;
  }

  async activate(id: number): Promise<User> {
    const user = await this.findOne(id);
    user.isActive = true;
    await this.userRepository.save(user);
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