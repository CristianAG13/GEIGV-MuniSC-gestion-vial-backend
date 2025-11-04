// users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuditInterceptor, Audit } from '../audit/interceptors/audit.interceptor';
import { AuditEntity, AuditAction } from '../audit/entities/audit-log.entity';

@Controller('users')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor, AuditInterceptor) // Para excluir campos como password y auditoría automática
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('superadmin')
  @Audit(AuditEntity.USUARIOS, AuditAction.CREATE) // Sin descripción estática para usar la generada automáticamente
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'ingeniero')
  findAll(@Query('role') role?: string) {
    if (role) {
      return this.usersService.findByRole(role);
    }
    return this.usersService.findAll();
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'ingeniero')
  getStats() {
    return this.usersService.getStats();
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'ingeniero')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('superadmin')
  @Audit(AuditEntity.USUARIOS, AuditAction.UPDATE) // Sin descripción estática para usar la generada automáticamente
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Post(':id/roles')
  @UseGuards(RolesGuard)
  @Roles('superadmin')
  @Audit(AuditEntity.USUARIOS, AuditAction.ROLE_CHANGE) // Sin descripción estática para usar la generada automáticamente
  assignRoles(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignRolesDto: AssignRolesDto,
  ) {
    return this.usersService.assignRoles(id, assignRolesDto);
  }

  @Delete(':id/roles/:roleId')
  @UseGuards(RolesGuard)
  @Roles('superadmin')
  @Audit(AuditEntity.USUARIOS, AuditAction.ROLE_CHANGE) // Sin descripción estática para usar la generada automáticamente
  removeRole(
    @Param('id', ParseIntPipe) id: number,
    @Param('roleId', ParseIntPipe) roleId: number,
  ) {
    return this.usersService.removeRole(id, roleId);
  }

  @Patch(':id/deactivate')
  @UseGuards(RolesGuard)
  @Roles('superadmin')
  @Audit(AuditEntity.USUARIOS, AuditAction.UPDATE) // Sin descripción estática para usar la generada automáticamente
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.deactivate(id);
  }

  @Patch(':id/activate')
  @UseGuards(RolesGuard)
  @Roles('superadmin')
  @Audit(AuditEntity.USUARIOS, AuditAction.UPDATE) // Sin descripción estática para usar la generada automáticamente
  activate(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.activate(id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('superadmin')
  @Audit(AuditEntity.USUARIOS, AuditAction.DELETE) // Sin descripción estática para usar la generada automáticamente
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }

  @Delete(':id/force')
  @UseGuards(RolesGuard)
  @Roles('superadmin') // Solo superadmin puede forzar eliminación
  @Audit(AuditEntity.USUARIOS, AuditAction.DELETE) // Sin descripción estática para usar la generada automáticamente
  forceRemove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.forceRemove(id);
  }
}