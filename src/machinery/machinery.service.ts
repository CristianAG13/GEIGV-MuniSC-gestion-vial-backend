import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
import { MachineryRole } from './entities/machinery-role.entity';
import { Operator } from 'src/operators/entities/operator.entity';

@Injectable()
export class MachineryService {

  constructor(
    @InjectRepository(Machinery) private machineryRepo: Repository<Machinery>,
    @InjectRepository(Report) private reportRepo: Repository<Report>,
    @InjectRepository(RentalReport) private rentalRepo: Repository<RentalReport>,
    @InjectRepository(MaterialReport) private materialRepo: Repository<MaterialReport>,
    @InjectRepository(MachineryRole) private readonly roleRepo: Repository<MachineryRole>,
    @InjectRepository(Operator) private readonly opRepo: Repository<Operator>,
  ) {}

async createMachinery(dto: CreateMachineryDto) {
  if (!dto?.tipo) throw new BadRequestException('El campo "tipo" es obligatorio.');
  if (!dto?.placa) throw new BadRequestException('El campo "placa" es obligatorio.');

  const machinery = this.machineryRepo.create({
    tipo: String(dto.tipo).toLowerCase(),
    placa: String(dto.placa).toUpperCase().trim(),
    esPropietaria: !!dto.esPropietaria,
    // SIN campo rol aquí (legacy)
  });
  await this.machineryRepo.save(machinery);

  // Solo usamos roles[]
  const rolesArr = Array.isArray(dto.roles) ? dto.roles : [];
  const normalized = [...new Set(
    rolesArr.map(r => String(r ?? '').trim().toLowerCase()).filter(Boolean)
  )];

  if (normalized.length) {
    await this.roleRepo.save(
      normalized.map(rol => this.roleRepo.create({ rol, machinery }))
    );
  }

  return this.machineryRepo.findOne({
    where: { id: machinery.id },
    relations: { roles: true },
  });
}


  async findAllMachinery() {
  // Puedes devolver tal cual con roles (entidades)...
  const list = await this.machineryRepo.find({ relations: { roles: true } });
  // ...o mapearlos a string[] si el front espera eso:
  return list.map(m => ({
    id: m.id,
    tipo: m.tipo,
    placa: m.placa,
    esPropietaria: m.esPropietaria,
    roles: (m.roles || []).map(r => r.rol),
  }));
}


// machinery.service.ts
async createReport(dto: CreateReportDto) {
  const {
    operadorId,
    maquinariaId,
    combustible,
    diesel,
    ...rest
  } = dto as any;

  // helper: "" -> null
  const nn = (v: any) =>
    typeof v === "string" ? (v.trim() === "" ? null : v.trim()) : v ?? null;

  // valida y carga relaciones
  let operador = null;
  if (operadorId) {
    operador = await this.opRepo.findOne({ where: { id: Number(operadorId) } });
    if (!operador) throw new BadRequestException(`Operador ${operadorId} no existe`);
  }

  let maquinaria = null;
  if (maquinariaId) {
    maquinaria = await this.machineryRepo.findOne({ where: { id: Number(maquinariaId) } });
    if (!maquinaria) throw new BadRequestException(`Maquinaria ${maquinariaId} no existe`);
  }

  const entity = this.reportRepo.create({
    ...rest,
    // normaliza campos de texto que a veces vienen "":
    estacion: nn(rest.estacion),
    codigoCamino: nn(rest.codigoCamino),
    distrito: nn(rest.distrito),
    tipoActividad: nn(rest.tipoActividad),
    placaCarreta: nn(rest.placaCarreta),
    horaInicio: nn(rest.horaInicio),
    horaFin: nn(rest.horaFin),

    // diesel centralizado
    diesel: diesel ?? combustible ?? null,

    operador,
    maquinaria,
  });

  return this.reportRepo.save(entity);
}

findAllReports() {
  return this.reportRepo.find({
    relations: { operador: true, maquinaria: true, materiales: true },
    order: { fecha: 'DESC', id: 'DESC' },
  });
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
  return this.reportRepo
    .createQueryBuilder('r')
    .leftJoinAndSelect('r.operador', 'o')
    .leftJoinAndSelect('r.maquinaria', 'm')
    .leftJoinAndSelect('m.roles', 'mr')
    .where('m.placa IN (:...placas)', { placas: ['SM 5711', '5711'] })
    .andWhere('mr.rol = :rol', { rol: 'cisterna' }) // ✅ solo roles[]
    .getMany();
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
  const m = await this.machineryRepo.findOne({ where: { id }, relations: { roles: true } });
  if (!m) return null;
  return { ...m, roles: (m.roles || []).map(r => r.rol) };
}

async updateMachinery(id: number, dto: UpdateMachineryDto) {
  const item = await this.machineryRepo.findOne({ where: { id }, relations: { roles: true } });
  if (!item) throw new NotFoundException('Maquinaria no encontrada');

  if (dto.tipo !== undefined) item.tipo = String(dto.tipo).toLowerCase();
  if (dto.placa !== undefined) item.placa = String(dto.placa).toUpperCase().trim();
  if (dto.esPropietaria !== undefined) item.esPropietaria = !!dto.esPropietaria;

  // ❌ Quitamos todo lo relacionado a dto.rol (legacy)
  await this.machineryRepo.save(item);

  // Si envían roles[], reemplazamos todos
  if (Array.isArray(dto.roles)) {
    await this.roleRepo.delete({ machinery: { id } as any });

    const normalized = [...new Set(
      dto.roles.map(r => String(r ?? '').trim().toLowerCase()).filter(Boolean)
    )];

    if (normalized.length) {
      await this.roleRepo.save(
        normalized.map(rol => this.roleRepo.create({ rol, machinery: { id } as any }))
      );
    }
  }

  return this.machineryRepo.findOne({ where: { id }, relations: { roles: true } });
}

async remove(id: number) {
    await this.machineryRepo.delete(id); // ON DELETE CASCADE borra roles
    return true;
   }

}







