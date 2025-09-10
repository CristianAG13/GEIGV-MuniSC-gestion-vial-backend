import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { RoleRequestsService } from './role-requests.service';
import { CreateRoleRequestDto } from './dto/create-role-request.dto';
import { RejectRoleRequestDto } from './dto/reject-role-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('role-requests')
@UseGuards(JwtAuthGuard)
export class RoleRequestsController {
  constructor(private readonly roleRequestsService: RoleRequestsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createRequest(@Request() req, @Body() createRoleRequestDto: CreateRoleRequestDto) {
    const userId = req.user.id;
    const request = await this.roleRequestsService.create(userId, createRoleRequestDto);
    
    // Mensaje informativo que indica que cualquier rol existente será reemplazado
    return {
      ...request,
      message: `Solicitud de rol '${createRoleRequestDto.requestedRole}' creada con éxito. Al ser aprobada, reemplazará cualquier rol existente.`
    };
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('ingeniero', 'superadmin')
  async findAll() {
    return this.roleRequestsService.findAll();
  }

  @Get('pending')
  @UseGuards(RolesGuard)
  @Roles('ingeniero', 'superadmin')
  async findPending() {
    return this.roleRequestsService.findPending();
  }

  @Get('my-requests')
  async findMyRequests(@Request() req) {
    const userId = req.user.id;
    return this.roleRequestsService.findMyRequests(userId);
  }

  @Patch(':requestId/approve')
  @UseGuards(RolesGuard)
  @Roles('ingeniero', 'superadmin')
  @HttpCode(HttpStatus.OK)
  async approveRequest(@Param('requestId', ParseIntPipe) requestId: number, @Request() req) {
    const adminId = req.user.id;
    const result = await this.roleRequestsService.approve(requestId, adminId);
    
    return {
      ...result,
      message: `Solicitud aprobada con éxito. Se ha actualizado el rol del usuario a '${result.requestedRole.name}'.`
    };
  }

  @Patch(':requestId/reject')
  @UseGuards(RolesGuard)
  @Roles('ingeniero', 'superadmin')
  @HttpCode(HttpStatus.OK)
  async rejectRequest(
    @Param('requestId', ParseIntPipe) requestId: number,
    @Request() req,
    @Body() rejectDto: RejectRoleRequestDto
  ) {
    const adminId = req.user.id;
    return this.roleRequestsService.reject(requestId, adminId, rejectDto);
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles('ingeniero', 'superadmin')
  async getStats() {
    return this.roleRequestsService.getStats();
  }

  @Delete(':requestId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancelRequest(@Param('requestId', ParseIntPipe) requestId: number, @Request() req) {
    const userId = req.user.id;
    await this.roleRequestsService.cancelRequest(requestId, userId);
  }


}
