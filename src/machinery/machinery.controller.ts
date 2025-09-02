import { Controller, Post, Get, Body, Query, UseGuards, ParseIntPipe, Param, Patch, Delete, NotFoundException } from '@nestjs/common';
import { MachineryService } from './machinery.service';
import { CreateMachineryDto } from './dto/create-machinery.dto';
import { CreateReportDto } from './dto/create-report.dto';
import { CreateRentalReportDto } from './dto/create-rental-report.dto';
import { CreateMaterialReportDto } from './dto/create-material-report.dto';


// 👇 Agregar estas dos importaciones
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UpdateMachineryDto } from './dto/update-machinery.dto';


@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('machinery')
export class MachineryController {

  constructor(private readonly service: MachineryService) {}

  // Maquinaria
  @Post()
  createMachinery(@Body() dto: CreateMachineryDto) {
    return this.service.createMachinery(dto);
  }

  @Get()
  findAllMachinery() {
    return this.service.findAllMachinery();
  }

  @Get(':id')
findOne(@Param('id', ParseIntPipe) id: number) {
  return this.service.findOne(id);
}

  // Reportes municipales
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

  // Reportes de alquiler
  @Post('rental-report')
  createRentalReport(@Body() dto: CreateRentalReportDto) {
    return this.service.createRentalReport(dto);
  }

  @Get('rental-report')
  findAllRentalReports() {
    return this.service.findAllRentalReports();
  }

  // Reportes de materiales
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

  @Roles('admin', 'superadmin')
@Get('report/summary/materials')
getMaterialSummary(@Query('month') month: number) {
  return this.service.getMaterialSummaryByMonth(month);
}

@Roles('admin', 'superadmin')
@Get('report/summary/operadores')
getHorasOperador(@Query('month') month: number) {
  return this.service.getHorasMaquinaByOperador(month);
}

@Roles('admin', 'superadmin')
@Get('rental-report/summary')
getRentalSummary(@Query('month') month: number) {
  return this.service.getRentalSummaryByMonth(month);
}

// 🚀 NUEVO PATCH
  @Patch(':id')
  @Roles('admin')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMachineryDto
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const deleted = await this.service.remove(id);
    if (!deleted) {
      throw new NotFoundException(`Maquinaria con ID ${id} no encontrada`);
    }
    return { message: 'Maquinaria eliminada correctamente' };
  }
}

