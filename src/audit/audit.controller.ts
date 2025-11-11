import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from './guards/super-admin.guard';
import { AuditAccessGuard } from './guards/audit-access.guard';
import { AuditService } from './audit.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { FilterAuditLogsDto } from './dto/filter-audit-logs.dto';
import { AuditEntity } from './entities/audit-log.entity';
import { CleanQueryParamsInterceptor } from './interceptors/clean-query-params.interceptor';
import { UTCDateInterceptor } from '../common/interceptors/utc-date.interceptor';

@Controller('audit')
@UseGuards(JwtAuthGuard)
@UseInterceptors(CleanQueryParamsInterceptor, UTCDateInterceptor)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Post('log')
  async createLog(@Body() createAuditLogDto: CreateAuditLogDto) {
    return await this.auditService.createLog(createAuditLogDto);
  }

  @Post('log-action')
  async logAction(@Body() auditData: any) {
    // Endpoint específico para que el frontend registre acciones de auditoría
    return await this.auditService.createLog(auditData);
  }

  @Get('logs')
  @UseGuards(AuditAccessGuard)
  async findLogs(@Query() filterDto: FilterAuditLogsDto) {
    return await this.auditService.findLogs(filterDto);
  }

  @Get('stats')
  @UseGuards(AuditAccessGuard)
  async getStats() {
    return await this.auditService.getStats();
  }

  @Get('logs/entity/:entity/:id')
  @UseGuards(AuditAccessGuard)
  async findLogsByEntity(
    @Param('entity') entity: AuditEntity,
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return await this.auditService.findLogsByEntity(
      entity,
      id,
      page || 1,
      limit || 10,
    );
  }

  @Get('logs/user/:userId')
  @UseGuards(AuditAccessGuard)
  async findLogsByUser(
    @Param('userId') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return await this.auditService.findLogsByUser(
      userId,
      page || 1,
      limit || 10,
    );
  }

  @Get('users/activity-summary')
  @UseGuards(AuditAccessGuard)
  async getUserActivitySummary() {
    return await this.auditService.getUserActivitySummary();
  }

  @Get('export')
  @UseGuards(AuditAccessGuard)
  async exportLogs(@Query() filterDto: FilterAuditLogsDto) {
    // TODO: Implementar exportación a CSV
    // Por ahora retorna los datos en formato JSON que el frontend puede convertir
    const logs = await this.auditService.findLogs(filterDto);
    return {
      message: 'Exportación de logs de auditoría',
      format: 'json',
      data: logs,
      timestamp: new Date().toISOString(),
    };
  }
}