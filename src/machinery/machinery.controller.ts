
// machinery.controller.ts
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

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('machinery')
export class MachineryController {
  constructor(private readonly service: MachineryService) {}

  // ---------- Maquinarias ----------
  @Post()
  @Roles('admin') // ajusta si quieres permitir a otros
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

  //ULTIMO HORIMETRO, ULTIMA ESTACION
  // machinery.controller.ts
@Get(':id/last-counters')
getLastCounters(@Param('id', ParseIntPipe) id: number) {
  return this.service.getLastCounters(id);
}


  @Patch(':id')
  @Roles('admin')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMachineryDto,
  ) {
    return this.service.updateMachinery(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  // ---------- Reportes municipales ----------
  @Post('report')
  createReport(@Body() dto: CreateReportDto) {
    return this.service.createReport(dto);
  }

  @Get('report')
  findAllReports() {
    return this.service.findAllReports();
  }
  

  @Get('report/by-operator')
  findReportsByOperatorAndDate(
    @Query('operadorId') operadorId: number,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    return this.service.findReportsByOperatorAndDate(operadorId, start, end);
  }

  @Get('report/by-type')
  findReportsByMachineryType(@Query('tipo') tipo: string) {
    return this.service.findReportsByMachineryType(tipo);
  }

  @Get('report/cisterna')
  findCisternaReports() {
    return this.service.findCisternaReports();
  }

  // ---------- Reportes de alquiler ----------
  @Post('rental-report')
  createRentalReport(@Body() dto: CreateRentalReportDto) {
    return this.service.createRentalReport(dto);
  }

  @Get('rental-report')
  findAllRentalReports() {
    return this.service.findAllRentalReports();
  }

  // ---------- Reportes de materiales ----------
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

  // ---------- Resúmenes (ej. dashboards) ----------
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


