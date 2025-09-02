import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Machinery } from './entities/machinery.entity';
import { Report } from './entities/report.entity';
import { RentalReport } from './entities/rental-report.entity';
import { MaterialReport } from './entities/material-report.entity';
import { CreateMachineryDto } from './dto/create-machinery.dto';
import { CreateReportDto } from './dto/create-report.dto';
import { CreateRentalReportDto } from './dto/create-rental-report.dto';
import { CreateMaterialReportDto } from './dto/create-material-report.dto';
import { UpdateMachineryDto } from './dto/update-machinery.dto';

@Injectable()
export class MachineryService {
  constructor(
    @InjectRepository(Machinery) private machineryRepo: Repository<Machinery>,
    @InjectRepository(Report) private reportRepo: Repository<Report>,
    @InjectRepository(RentalReport) private rentalRepo: Repository<RentalReport>,
    @InjectRepository(MaterialReport) private materialRepo: Repository<MaterialReport>,
  ) {}

  // Maquinaria
  createMachinery(dto: CreateMachineryDto) {
    return this.machineryRepo.save(dto);
  }

  findAllMachinery() {
    return this.machineryRepo.find({ relations: ['reports'] });
  }

  // Reportes municipales
  createReport(dto: CreateReportDto) {
    return this.reportRepo.save(dto);
  }

  findAllReports() {
    return this.reportRepo.find({ relations: ['operador', 'maquinaria', 'materiales'] });
  }

  // Filtros útiles
  findReportsByOperatorAndDate(operadorId: number, start: string, end: string) {
    return this.reportRepo.find({
      where: {
        operador: { id: operadorId },
        fecha: Between(new Date(start), new Date(end)),
      },
      relations: ['operador', 'maquinaria', 'materiales'],
    });
  }

  findReportsByMachineryType(tipo: string) {
    return this.reportRepo.find({
      where: { maquinaria: { tipo } },
      relations: ['operador', 'maquinaria', 'materiales'],
    });
  }

  findCisternaReports() {
    return this.reportRepo.find({
      where: { maquinaria: { placa: '5711', rol: 'cisterna' } },
      relations: ['operador', 'maquinaria', 'materiales'],
    });
  }

  // Reportes de alquiler
  createRentalReport(dto: CreateRentalReportDto) {
    return this.rentalRepo.save(dto);
  }

  findAllRentalReports() {
    return this.rentalRepo.find();
  }

  // Reportes de materiales
  createMaterialReport(dto: CreateMaterialReportDto) {
    return this.materialRepo.save(dto);
  }

  findAllMaterialReports() {
    return this.materialRepo.find({ relations: ['report'] });
  }

  findMaterialsBySource(source: string) {
    return this.materialRepo.find({ where: { fuente: source }, relations: ['report'] });
  }



  // Informe: materiales comprados por fuente
getMaterialSummaryByMonth(month: number) {
  return this.materialRepo
    .createQueryBuilder("m")
    .select("m.fuente", "fuente")
    .addSelect("SUM(m.cantidad)", "totalCantidad")
    .where("MONTH(m.fecha) = :month", { month })
    .groupBy("m.fuente")
    .getRawMany();
}

// Informe: horas máquina por operador
getHorasMaquinaByOperador(month: number) {
  return this.reportRepo
    .createQueryBuilder("r")
    .leftJoin("r.operador", "o")
    .select("o.nombre", "operador")
    .addSelect("SUM(r.horasOrd + r.horasExt)", "totalHoras")
    .where("MONTH(r.fecha) = :month", { month })
    .groupBy("o.nombre")
    .getRawMany();
}

// Informe: horas maquinaria alquilada
getRentalSummaryByMonth(month: number) {
  return this.rentalRepo
    .createQueryBuilder("rr")
    .select("rr.tipoMaquinaria", "tipo")
    .addSelect("SUM(rr.horas)", "totalHoras")
    .where("MONTH(rr.fecha) = :month", { month })
    .groupBy("rr.tipoMaquinaria")
    .getRawMany();
}

async findOne(id: number) {
    const maquinaria = await this.machineryRepo.findOne({
      where: { id },
      relations: ['reports'],
    });
    if (!maquinaria) {
      throw new NotFoundException(`Maquinaria con ID ${id} no encontrada`);
    }
    return maquinaria;
  }

  async update(id: number, dto: UpdateMachineryDto): Promise<Machinery> {
  await this.machineryRepo.update(id, dto);
  return this.machineryRepo.findOne({ where: { id } });
}

async remove(id: number): Promise<boolean> {
  const result = await this.machineryRepo.delete(id);
  return result.affected > 0; // true si borró algo
}

}



