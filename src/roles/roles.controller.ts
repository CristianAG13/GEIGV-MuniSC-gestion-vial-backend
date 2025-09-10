// roles/roles.controller.ts - VERSIÓN PARA TESTING
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  // ===== ENDPOINTS SIN AUTENTICACIÓN PARA TESTING =====
  
  @Get('test')
  testEndpoint() {
    return {
      message: '✅ El endpoint de roles funciona correctamente',
      timestamp: new Date().toISOString(),
      service: 'roles-service'
    };
  }

  @Get('public')
  findAllPublic(@Query('active') active?: string) {
    if (active === 'true') {
      return this.rolesService.findActive();
    }
    return this.rolesService.findAll();
  }

  // @Post('public/default')
  // createDefaultRolesPublic() {
  //   return this.rolesService.createDefaultRoles();
  // }
  @Post('public/default')
async createDefaultRolesPublic() {
  try {
    const result = await this.rolesService.createDefaultRoles();
    return result;
  } catch (error) {
    throw new BadRequestException('Error creando roles por defecto');
  }
}

  @Post('public')
  createPublic(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get('public/stats')
  getStatsPublic() {
    return this.rolesService.getStats();
  }

  @Get('public/:id')
  findOnePublic(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.findOne(id);
  }

  // ===== ENDPOINTS CON AUTENTICACIÓN (ORIGINALES) =====

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ingeniero')
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Post('default')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ingeniero')
  createDefaultRoles() {
    return this.rolesService.createDefaultRoles();
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ingeniero', 'manager','superadmin')
  findAll(@Query('active') active?: string) {
    if (active === 'true') {
      return this.rolesService.findActive();
    }
    return this.rolesService.findAll();
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ingeniero')
  getStats() {
    return this.rolesService.getStats();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ingeniero', 'manager')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ingeniero')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Patch(':id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ingeniero')
  activate(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.activate(id);
  }

  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ingeniero')
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.deactivate(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ingeniero')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.remove(id);
  }

    @Get('available-for-request')
@UseGuards(JwtAuthGuard) // cualquier usuario logueado puede verlos
async getAvailableForRequest() {
  return this.rolesService.getAvailableForRequest();
}
}