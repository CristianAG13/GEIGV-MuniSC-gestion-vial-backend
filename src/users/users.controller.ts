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

@Controller('users')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor) // Para excluir campos como password
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ingeniero')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('ingeniero', 'manager')
  findAll(@Query('role') role?: string) {
    if (role) {
      return this.usersService.findByRole(role);
    }
    return this.usersService.findAll();
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles('ingeniero')
  getStats() {
    return this.usersService.getStats();
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('ingeniero', 'manager')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ingeniero')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Post(':id/roles')
  @UseGuards(RolesGuard)
  @Roles('ingeniero')
  assignRoles(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignRolesDto: AssignRolesDto,
  ) {
    return this.usersService.assignRoles(id, assignRolesDto);
  }

  @Delete(':id/roles/:roleId')
  @UseGuards(RolesGuard)
  @Roles('ingeniero')
  removeRole(
    @Param('id', ParseIntPipe) id: number,
    @Param('roleId', ParseIntPipe) roleId: number,
  ) {
    return this.usersService.removeRole(id, roleId);
  }

  @Patch(':id/deactivate')
  @UseGuards(RolesGuard)
  @Roles('ingeniero')
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.deactivate(id);
  }

  @Patch(':id/activate')
  @UseGuards(RolesGuard)
  @Roles('ingeniero')
  activate(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.activate(id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ingeniero')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }

  @Delete(':id/force')
  @UseGuards(RolesGuard)
  @Roles('superadmin') // Solo superadmin puede forzar eliminación
  forceRemove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.forceRemove(id);
  }
}