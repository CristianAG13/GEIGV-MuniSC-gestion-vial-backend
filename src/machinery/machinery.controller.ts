
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
} from '@nestjs/common';

import { MachineryService } from './machinery.service';
import { CreateMachineryDto } from './dto/create-machinery.dto';
import { UpdateMachineryDto } from './dto/update-machinery.dto';
import { CreateReportDto } from './dto/create-report.dto';
import { CreateRentalReportDto } from './dto/create-rental-report.dto';
import { CreateMaterialReportDto } from './dto/create-material-report.dto';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { AuditInterceptor, Audit } from '../audit/interceptors/audit.interceptor';
import { AuditAction, AuditEntity } from '../audit/entities/audit-log.entity';
import { UpdateReportDto } from './dto/update-report.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('machinery')
@UseInterceptors(AuditInterceptor)
export class MachineryController {
  constructor(private readonly service: MachineryService) {}

 // ---------- MAQUINARIAS ----------
  @Post()
  @Roles('admin')
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
  @Roles('admin')
  @Audit(AuditEntity.TRANSPORTE, AuditAction.UPDATE) // Sin descripción estática para usar la generada automáticamente
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMachineryDto,
  ) {
    return this.service.updateMachinery(id, dto);
  }

  @Delete(':id(\\d+)')
  @Roles('admin')
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
  @Roles('admin','superadmin')
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
  createReport(@Body() dto: CreateReportDto) {
    return this.service.createReport(dto);
  }

  @Get('report')
  findAllReports() {
    return this.service.findAllReports();
  }

  // DINÁMICAS AL FINAL + regex de dígitos
  @Get('report/:id(\\d+)')
  findReportById(@Param('id', ParseIntPipe) id: number) {
    return this.service.findReportById(id);
  }


  @Patch('report/:id(\\d+)')
@Audit(AuditEntity.REPORTES, AuditAction.UPDATE)
updateReport(
  @Param('id', ParseIntPipe) id: number,
  @Body() dto: UpdateReportDto,   // <— usar el DTO tipado
) {
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
  @Roles('admin','superadmin')
  @Audit(AuditEntity.REPORTES, AuditAction.RESTORE) // Sin descripción estática para usar la generada automáticamente
  restoreMunicipal(@Param('id', ParseIntPipe) id: number) {
  return this.service.restoreMunicipal(id);
  }

  // ========= REPORTES DE ALQUILER =========

  // (si vas a listar eliminados de alquiler, agrega aquí rental-report/deleted)
  // @Get('rental-report/deleted')
  // getDeletedRental() { return this.service.getDeletedRental(); }

  @Post('rental-report')
  createRentalReport(@Body() dto: CreateRentalReportDto) {
    return this.service.createRentalReport(dto);
  }

  @Get('rental-report')
  findAllRentalReports() {
    return this.service.findAllRentalReports();
  }

  @Get('rental-report/:id(\\d+)')
  findRentalReportById(@Param('id', ParseIntPipe) id: number) {
    return this.service.findRentalReportById(id);
  }

  @Patch('rental-report/:id(\\d+)')
  updateRentalReport(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
  ) {
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
  @Roles('admin','superadmin')
  getDeletedRental() {
    return this.service.getDeletedRental();
  }

  @Patch('rental-report/:id(\\d+)/restore')
  @Roles('admin','superadmin')
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
  @Roles('admin', 'superadmin')
  getMaterialSummary(@Query('month') month: number) {
    return this.service.getMaterialSummaryByMonth(month);
  }

  @Get('report/summary/operadores')
  @Roles('admin', 'superadmin')
  getHorasOperador(@Query('month') month: number) {
    return this.service.getHorasMaquinaByOperador(month);
  }

  @Get('rental-report/summary')
  @Roles('admin', 'superadmin')
  getRentalSummary(@Query('month') month: number) {
    return this.service.getRentalSummaryByMonth(month);
  }
}

