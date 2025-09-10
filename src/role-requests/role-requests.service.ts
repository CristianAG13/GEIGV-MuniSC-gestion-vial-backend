import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ForbiddenException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { RoleRequest, RoleRequestStatus } from './entities/role-request.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { CreateRoleRequestDto } from './dto/create-role-request.dto';
import { RejectRoleRequestDto } from './dto/reject-role-request.dto';

@Injectable()
export class RoleRequestsService {
  constructor(
    @InjectRepository(RoleRequest)
    private roleRequestRepository: Repository<RoleRequest>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async create(userId: number, createRoleRequestDto: CreateRoleRequestDto): Promise<RoleRequest> {
    const { requestedRole, justification } = createRoleRequestDto;

    // Buscar el rol por nombre
    const role = await this.roleRepository.findOne({
      where: { name: requestedRole.toLowerCase() }
    });

    if (!role) {
      throw new NotFoundException(`El rol '${requestedRole}' no existe`);
    }

    // Verificar que el usuario no tenga ya una solicitud pendiente para este rol
    const existingRequest = await this.roleRequestRepository.findOne({
      where: {
        userId,
        roleId: role.id,
        status: RoleRequestStatus.PENDING
      }
    });

    if (existingRequest) {
      throw new BadRequestException(`Ya tienes una solicitud pendiente para el rol '${requestedRole}'`);
    }

    // Verificar que el usuario no tenga ya este rol asignado
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles']
    });

    if (user.roles.some(userRole => userRole.id === role.id)) {
      throw new BadRequestException(`Ya tienes el rol '${requestedRole}' asignado`);
    }

    // Crear la solicitud
    const roleRequest = this.roleRequestRepository.create({
      userId,
      roleId: role.id,
      justification,
      status: RoleRequestStatus.PENDING
    });

    return this.roleRequestRepository.save(roleRequest);
  }

  async findAll(): Promise<RoleRequest[]> {
    return this.roleRequestRepository.find({
      relations: ['user', 'requestedRole', 'reviewer'],
      order: { createdAt: 'DESC' }
    });
  }

  async findPending(): Promise<RoleRequest[]> {
    return this.roleRequestRepository.find({
      where: { status: RoleRequestStatus.PENDING },
      relations: ['user', 'requestedRole'],
      order: { createdAt: 'ASC' }
    });
  }

  async findMyRequests(userId: number): Promise<RoleRequest[]> {
    return this.roleRequestRepository.find({
      where: { userId },
      relations: ['requestedRole', 'reviewer'],
      order: { createdAt: 'DESC' }
    });
  }

  async approve(requestId: number, adminId: number): Promise<RoleRequest> {
    const request = await this.roleRequestRepository.findOne({
      where: { id: requestId },
      relations: ['user', 'requestedRole']
    });

    if (!request) {
      throw new NotFoundException(`Solicitud con ID ${requestId} no encontrada`);
    }

    if (request.status !== RoleRequestStatus.PENDING) {
      throw new BadRequestException('Solo se pueden aprobar solicitudes pendientes');
    }

    // Actualizar el estado de la solicitud
    request.status = RoleRequestStatus.APPROVED;
    request.reviewedBy = adminId;
    request.reviewedAt = new Date();

    // Asignar el rol al usuario
    const user = await this.userRepository.findOne({
      where: { id: request.userId },
      relations: ['roles']
    });

    // Verificar si el usuario ya tiene el rol (por si acaso)
    if (!user.roles.some(role => role.id === request.roleId)) {
      user.roles.push(request.requestedRole);
      user.isActive = true; // Activar usuario al asignar rol
      await this.userRepository.save(user);
    }

    return this.roleRequestRepository.save(request);
  }

  async reject(requestId: number, adminId: number, rejectDto: RejectRoleRequestDto): Promise<RoleRequest> {
    const request = await this.roleRequestRepository.findOne({
      where: { id: requestId },
      relations: ['user', 'requestedRole']
    });

    if (!request) {
      throw new NotFoundException(`Solicitud con ID ${requestId} no encontrada`);
    }

    if (request.status !== RoleRequestStatus.PENDING) {
      throw new BadRequestException('Solo se pueden rechazar solicitudes pendientes');
    }

    request.status = RoleRequestStatus.REJECTED;
    request.reviewedBy = adminId;
    request.reviewedAt = new Date();
    request.rejectionReason = rejectDto.reason || 'Sin motivo especificado';

    return this.roleRequestRepository.save(request);
  }

  async getStats(): Promise<any> {
    const [pending, approved, rejected, total] = await Promise.all([
      this.roleRequestRepository.count({ where: { status: RoleRequestStatus.PENDING } }),
      this.roleRequestRepository.count({ where: { status: RoleRequestStatus.APPROVED } }),
      this.roleRequestRepository.count({ where: { status: RoleRequestStatus.REJECTED } }),
      this.roleRequestRepository.count()
    ]);

    return {
      pending,
      approved,
      rejected,
      total
    };
  }

  async cancelRequest(requestId: number, userId: number): Promise<void> {
    const request = await this.roleRequestRepository.findOne({
      where: { id: requestId }
    });

    if (!request) {
      throw new NotFoundException(`Solicitud con ID ${requestId} no encontrada`);
    }

    // Verificar que la solicitud pertenece al usuario
    if (request.userId !== userId) {
      throw new ForbiddenException('No puedes cancelar solicitudes de otros usuarios');
    }

    if (request.status !== RoleRequestStatus.PENDING) {
      throw new BadRequestException('Solo se pueden cancelar solicitudes pendientes');
    }

    await this.roleRequestRepository.remove(request);
  }

  async findOne(id: number): Promise<RoleRequest> {
    const request = await this.roleRequestRepository.findOne({
      where: { id },
      relations: ['user', 'requestedRole', 'reviewer']
    });

    if (!request) {
      throw new NotFoundException(`Solicitud con ID ${id} no encontrada`);
    }

    return request;
  }

}
