import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
  Req,
  UseInterceptors,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { MachineryService } from './machinery.service';
import { CreateMachineryDto } from './dto/create-machinery.dto';
import { UpdateMachineryDto } from './dto/update-machinery.dto';
import { CreateReportDto } from './dto/create-report.dto';
import { CreateRentalReportDto } from './dto/create-rental-report.dto';
import { CreateMaterialReportDto } from './dto/create-material-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { AuditInterceptor, Audit } from '../audit/interceptors/audit.interceptor';
import { AuditAction, AuditEntity } from '../audit/entities/audit-log.entity';
import { OperatorsService } from 'src/operators/operators.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('machinery')
@UseInterceptors(AuditInterceptor)
export class MachineryController {
  constructor(
    private readonly service: MachineryService,
    private readonly operatorsService: OperatorsService,
  ) {}

 // ---------- MAQUINARIAS ----------
  @Post()
  @Roles('superadmin')
  @Audit(AuditEntity.TRANSPORTE, AuditAction.CREATE) // Sin descripción estática para usar la generada automáticamente
  createMachinery(@Body() dto: CreateMachineryDto) {
    return this.service.createMachinery(dto);
  }

  @Get()
  findAllMachinery() {
    return this.service.findAllMachinery();
  }

  @Get(':id(\\d+)')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id(\\d+)')
  @Roles('superadmin')
  @Audit(AuditEntity.TRANSPORTE, AuditAction.UPDATE) // Sin descripción estática para usar la generada automáticamente
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMachineryDto,
  ) {
    return this.service.updateMachinery(id, dto);
  }

  @Delete(':id(\\d+)')
  @Roles('superadmin')
  @Audit(AuditEntity.TRANSPORTE, AuditAction.DELETE) // Sin descripción estática para usar la generada automáticamente
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  // GET /machinery/:id/last-counters?codigoCamino=267
  @Get(':id(\\d+)/last-counters')
  getLastCounters(
    @Param('id', ParseIntPipe) id: number,
    @Query('codigoCamino') codigoCamino?: string,
  ) {
    return this.service.getLastCounters(id, codigoCamino);
  }


  // ========= REPORTES MUNICIPALES =========

  // ESTÁTICAS PRIMERO
  @Get('report/deleted')
  @Roles('superadmin', 'ingeniero')
  getDeletedMunicipal() {
    return this.service.getDeletedMunicipal();
  }

  @Get('report/search')
  findReports(
    @Query('tipo') tipo?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.service.findReports({ tipo, start, end });
  }

  // CRUD base
  @Post('report')
  @Audit(AuditEntity.REPORTES, AuditAction.CREATE) // Sin descripción estática para usar la generada automáticamente
  async createReport(@Body() dto: CreateReportDto, @CurrentUser() user: any) {
    // Si es operario, solo puede crear reportes para sí mismo
    if (user.roles?.some((r: any) => r.name === 'operario')) {
      const operator = await this.operatorsService.findByUserId(user.id);
      if (!operator) {
        throw new ForbiddenException('No tienes un perfil de operario asociado');
      }
      
      // Forzar que el operadorId sea el del usuario actual
      dto.operadorId = operator.id;
    }
    
    return this.service.createReport(dto);
  }

  @Get('report')
  async findAllReports(@CurrentUser() user: any) {
    // Si es operario, solo puede ver sus propios reportes
    if (user.roles?.some((r: any) => r.name === 'operario')) {
      const operator = await this.operatorsService.findByUserId(user.id);
      if (!operator) {
        throw new ForbiddenException('No tienes un perfil de operario asociado');
      }
      return this.service.findAllReports(operator.id);
    }
    
    // Para otros roles, ver todos los reportes
    return this.service.findAllReports();
  }

  // DINÁMICAS AL FINAL + regex de dígitos
  @Get('report/:id(\\d+)')
  findReportById(@Param('id', ParseIntPipe) id: number) {
    return this.service.findReportById(id);
  }


  @Patch('report/:id(\\d+)')
  @Audit(AuditEntity.REPORTES, AuditAction.UPDATE)
  async updateReport(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReportDto,   // usar el DTO tipado
    @CurrentUser() user: any,
  ) {
    // Si es operario, verificar que el reporte le pertenezca
    if (user.roles?.some((r: any) => r.name === 'operario')) {
      const operator = await this.operatorsService.findByUserId(user.id);
      if (!operator) {
        throw new ForbiddenException('No tienes un perfil de operario asociado');
      }
      
      const report = await this.service.findReportById(id);
      if (!report) {
        throw new NotFoundException('Reporte no encontrado');
      }
      if (report.operador?.id !== operator.id) {
        throw new ForbiddenException('No tienes permiso para editar este reporte');
      }
    }
    
    return this.service.updateReport(id, dto);
  }

  @Delete('report/:id(\\d+)')
  @Audit(AuditEntity.REPORTES, AuditAction.DELETE) // Sin descripción estática para usar la generada automáticamente
  removeMunicipal(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { reason?: string } = {},
    @Req() req: any, 
  ) {
    const userId = req?.user?.id ?? req?.user?.sub ?? null;  // <-- AÑADIR
    return this.service.removeMunicipal(id, body?.reason ?? null, userId); // <-- PASAR userId
  }

  @Patch('report/:id(\\d+)/restore')
  @Roles('superadmin', 'ingeniero')
  @Audit(AuditEntity.REPORTES, AuditAction.RESTORE) // Sin descripción estática para usar la generada automáticamente
  restoreMunicipal(@Param('id', ParseIntPipe) id: number) {
    return this.service.restoreMunicipal(id);
  }

  // ========= REPORTES DE ALQUILER =========

  // (si vas a listar eliminados de alquiler, agrega aquí rental-report/deleted)
  // @Get('rental-report/deleted')
  // getDeletedRental() { return this.service.getDeletedRental(); }

  @Post('rental-report')
  async createRentalReport(@Body() dto: CreateRentalReportDto, @CurrentUser() user: any) {
    // Si es operario, solo puede crear reportes de alquiler para sí mismo
    if (user.roles?.some((r: any) => r.name === 'operario')) {
      const operator = await this.operatorsService.findByUserId(user.id);
      if (!operator) {
        throw new ForbiddenException('No tienes un perfil de operario asociado');
      }
      
      // Forzar que el operadorId sea el del usuario actual
      dto.operadorId = operator.id;
    }
    
    return this.service.createRentalReport(dto);
  }

  @Get('rental-report')
  async findAllRentalReports(@CurrentUser() user: any) {
    // Si es operario, solo puede ver sus propios reportes de alquiler
    if (user.roles?.some((r: any) => r.name === 'operario')) {
      const operator = await this.operatorsService.findByUserId(user.id);
      if (!operator) {
        throw new ForbiddenException('No tienes un perfil de operario asociado');
      }
      return this.service.findAllRentalReports(operator.id);
    }
    
    // Para otros roles, ver todos los reportes de alquiler
    return this.service.findAllRentalReports();
  }

  @Get('rental-report/:id(\\d+)')
  findRentalReportById(@Param('id', ParseIntPipe) id: number) {
    return this.service.findRentalReportById(id);
  }

  @Patch('rental-report/:id(\\d+)')
  async updateRentalReport(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    // Si es operario, verificar que el reporte de alquiler le pertenezca
    if (user.roles?.some((r: any) => r.name === 'operario')) {
      const operator = await this.operatorsService.findByUserId(user.id);
      if (!operator) {
        throw new ForbiddenException('No tienes un perfil de operario asociado');
      }
      
      const rentalReport = await this.service.findRentalReportById(id);
      if (rentalReport.operador?.id !== operator.id) {
        throw new ForbiddenException('No tienes permiso para editar este reporte de alquiler');
      }
    }
    
    return this.service.updateRentalReport(id, dto);
  }

  @Delete('rental-report/:id(\\d+)')
  removeRental(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { reason?: string } = {},
     @Req() req: any, 
  ) {
    const userId = req?.user?.id ?? req?.user?.sub ?? null;  // <-- AÑADIR
    return this.service.removeRental(id, body?.reason ?? null, userId); // <-- PASAR userId
  }

  @Get('rental-report/deleted')
  @Roles('superadmin', 'ingeniero')
  getDeletedRental() {
    return this.service.getDeletedRental();
  }

  @Patch('rental-report/:id(\\d+)/restore')
  @Roles('superadmin', 'ingeniero')
  @Audit(AuditEntity.REPORTES, AuditAction.RESTORE) // Sin descripción estática para usar la generada automáticamente
  restoreRental(@Param('id', ParseIntPipe) id: number) {
    return this.service.restoreRental(id);
  }
  
  // ---------- REPORTES DE MATERIALES ----------
  @Post('material-report')
  createMaterialReport(@Body() dto: CreateMaterialReportDto) {
    return this.service.createMaterialReport(dto);
  }

  @Get('material-report')
  findAllMaterialReports() {
    return this.service.findAllMaterialReports();
  }

  @Get('material-report/by-source')
  findMaterialsBySource(@Query('source') source: string) {
    return this.service.findMaterialsBySource(source);
  }

  // ---------- RESÚMENES ----------
  @Get('report/summary/materials')
  @Roles('superadmin', 'ingeniero')
  getMaterialSummary(@Query('month') month: number) {
    return this.service.getMaterialSummaryByMonth(month);
  }

  @Get('report/summary/operadores')
  @Roles('superadmin', 'ingeniero')
  getHorasOperador(@Query('month') month: number) {
    return this.service.getHorasMaquinaByOperador(month);
  }

  @Get('rental-report/summary')
  @Roles('superadmin', 'ingeniero')
  getRentalSummary(@Query('month') month: number) {
    return this.service.getRentalSummaryByMonth(month);
  }
}