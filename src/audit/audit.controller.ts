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
  @UseGuards(SuperAdminGuard)
  async findLogs(@Query() filterDto: FilterAuditLogsDto) {
    return await this.auditService.findLogs(filterDto);
  }

  @Get('stats')
  @UseGuards(SuperAdminGuard)
  async getStats() {
    return await this.auditService.getStats();
  }

  @Get('logs/entity/:entity/:id')
  @UseGuards(SuperAdminGuard)
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
  @UseGuards(SuperAdminGuard)
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
  @UseGuards(SuperAdminGuard)
  async getUserActivitySummary() {
    return await this.auditService.getUserActivitySummary();
  }
}