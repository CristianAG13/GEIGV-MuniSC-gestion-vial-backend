import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, DeepPartial, Not, IsNull } from 'typeorm';

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

// ⬇️ IMPORTA LOS HELPERS DE FECHAS (asegúrate de la ruta)
import { toISODate, daysAgoISO } from '../utils/date-only';

/** Normaliza estación “N+M” */
function normEstacion(s?: string | null) {
  if (!s) return null;
  const m = String(s).match(/^\s*(\d+)\s*\+\s*(\d+)\s*$/);
  if (!m) return String(s).replace(/\s+/g, '');
  return `${Number(m[1])}+${Number(m[2])}`;
}
function splitEstacion(s?: string | null) {
  const m = String(s || '').match(/^\s*(\d+)\s*\+\s*(\d+)\s*$/);
  if (!m) return null;
  return { desde: Number(m[1]), hasta: Number(m[2]) };
}

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

  // ========== Helpers privados ==========
  private nn(v: any) {
    return typeof v === 'string' ? (v.trim() === '' ? null : v.trim()) : v ?? null;
  }
  private to24h(s?: string | null) {
    if (!s) return s ?? null;
    const m = String(s).trim().match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
    if (!m) return s; // ya viene “HH:mm”
    let hh = Number(m[1]) % 12;
    const mm = m[2];
    if (m[3].toUpperCase() === 'PM') hh += 12;
    return `${String(hh).padStart(2, '0')}:${mm}`;
  }

  // ========== Maquinarias ==========

  async getLastCounters(maquinariaId: number, codigoCamino?: string) {
    // último reporte global (para horímetro/kilometraje)
    const lastAny = await this.reportRepo.findOne({
      where: { maquinaria: { id: maquinariaId } as any },
      order: { fecha: 'DESC', id: 'DESC' },
    });

    // último de ese camino (para estación) dentro de los últimos 30 días
    let lastByCaminoRecent: Report | null = null;
    if (codigoCamino) {
      const todayStr = toISODate(new Date());
      const d30Str = daysAgoISO(30);

      lastByCaminoRecent = await this.reportRepo.findOne({
        where: {
          maquinaria: { id: maquinariaId } as any,
          codigoCamino: String(codigoCamino),
          // 👇 STRINGS 'YYYY-MM-DD'
          fecha: Between(d30Str, todayStr),
        },
        order: { fecha: 'DESC', id: 'DESC' },
      });
    }

    const toHasta = (est?: string | null) => {
      const m = String(est || '').match(/^\s*(\d+)\s*\+\s*(\d+)\s*$/);
      return m ? Number(m[2]) : null;
    };

    return {
      horimetro: lastAny?.horimetro ?? null,
      kilometraje: lastAny?.kilometraje ?? null,
      estacionHasta: toHasta(lastByCaminoRecent?.estacion) ?? null,
      estacionUpdatedAt: lastByCaminoRecent?.fecha ?? null,
    };
  }

  async createMachinery(dto: CreateMachineryDto) {
    if (!dto?.tipo) throw new BadRequestException('El campo "tipo" es obligatorio.');
    if (!dto?.placa) throw new BadRequestException('El campo "placa" es obligatorio.');

    const machinery = this.machineryRepo.create({
      tipo: String(dto.tipo).toLowerCase(),
      placa: String(dto.placa).toUpperCase().trim(),
      esPropietaria: !!dto.esPropietaria,
    });
    await this.machineryRepo.save(machinery);

    // roles[]
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
    const list = await this.machineryRepo.find({ relations: { roles: true } });
    return list.map(m => ({
      id: m.id,
      tipo: m.tipo,
      placa: m.placa,
      esPropietaria: m.esPropietaria,
      roles: (m.roles || []).map(r => r.rol),
    }));
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

    await this.machineryRepo.save(item);

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
    await this.machineryRepo.delete(id);
    return true;
  }

  // ========== Reportes municipales ==========
  async createReport(dto: CreateReportDto) {
    const { operadorId, maquinariaId, combustible, diesel } = dto as any;

    // Relaciones
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

    const d = dto.detalles ?? {};
    const detalles: Record<string, any> = {
      ...d,
      variante: this.nn(d.variante),
      tipoMaquinaria: this.nn(d.tipoMaquinaria),
      placa: this.nn(d.placa),
      tipoMaterial: this.nn(d.tipoMaterial),
      cantidadMaterial: d.cantidadMaterial != null ? Number(d.cantidadMaterial) : null,
      fuente: this.nn(d.fuente),
      boleta: this.nn(d.boleta),
      cantidadLiquido: d.cantidadLiquido != null ? Number(d.cantidadLiquido) : null,
      placaCarreta: this.nn(d.placaCarreta),
      destino: this.nn(d.destino),
      tipoCarga: this.nn(d.tipoCarga),
      placaMaquinariaLlevada: this.nn(d.placaMaquinariaLlevada),
      horaInicio: this.to24h(this.nn(d.horaInicio)),
      horaFin: this.to24h(this.nn(d.horaFin)),
    };

    const estacion = normEstacion((dto as any).estacion);
    const pair = splitEstacion(estacion);
    if (pair && pair.hasta < pair.desde) {
      throw new BadRequestException('La estación “hasta” no puede ser menor que “desde”.');
    }

    const entityLike: DeepPartial<Report> = {
      // 👇 guarda SIEMPRE como string 'YYYY-MM-DD'
      fecha: dto.fecha ? toISODate(dto.fecha) : null,
      tipoActividad: this.nn((dto as any).tipoActividad ?? (dto as any).actividad),
      estacion,
      codigoCamino: this.nn((dto as any).codigoCamino),
      distrito: this.nn((dto as any).distrito),
      horimetro: (dto as any).horimetro ?? null,
      kilometraje: (dto as any).kilometraje ?? null,
      diesel: diesel ?? combustible ?? null,
      horasOrd: (dto as any).horasOrd ?? null,
      horasExt: (dto as any).horasExt ?? null,
      viaticos: (dto as any).viaticos ?? null,
      placaCarreta: this.nn((dto as any).placaCarreta ?? d.placaCarreta),
      horaInicio: this.to24h(this.nn((dto as any).horaInicio ?? d.horaInicio)),
      horaFin: this.to24h(this.nn((dto as any).horaFin ?? d.horaFin)),
      detalles,
      operador,
      maquinaria,
    };

    const entity = this.reportRepo.create(entityLike);
    return this.reportRepo.save(entity);
  }

  findAllReports() {
    return this.reportRepo.find({
      relations: { operador: true, maquinaria: true, materiales: true },
      order: { fecha: 'DESC', id: 'DESC' },
    });
  }

  async findReportById(id: number) {
    const r = await this.reportRepo.findOne({
      where: { id },
      relations: { operador: true, maquinaria: true, materiales: true },
    });
    if (!r) throw new NotFoundException('Reporte no existe');
    return r;
  }

  async updateReport(id: number, dto: any) {
    const report = await this.reportRepo.findOne({ where: { id } });
    if (!report) throw new NotFoundException('Reporte no existe');

    if (dto.actividad !== undefined || dto.tipoActividad !== undefined) {
      report.tipoActividad = this.nn(dto.actividad ?? dto.tipoActividad);
    }
    if (dto.horasOrd !== undefined) {
      report.horasOrd = dto.horasOrd === null ? null : Number(dto.horasOrd);
    }
    if (dto.horasExt !== undefined) {
      report.horasExt = dto.horasExt === null ? null : Number(dto.horasExt);
    }
    if (dto.viaticos !== undefined) {
      report.viaticos = dto.viaticos === null ? null : Number(dto.viaticos);
    }
    if (dto.horaInicio !== undefined) {
      report.horaInicio = this.to24h(this.nn(dto.horaInicio));
    }
    if (dto.horaFin !== undefined) {
      report.horaFin = this.to24h(this.nn(dto.horaFin));
    }
    if (dto.detalles && typeof dto.detalles === 'object') {
      report.detalles = { ...(report.detalles || {}), ...dto.detalles };
    }

    const saved = await this.reportRepo.save(report);
    return this.reportRepo.findOne({
      where: { id: saved.id },
      relations: { operador: true, maquinaria: true, materiales: true },
    });
  }

  async getDeletedMunicipal() {
    return this.reportRepo.find({
      where: { deletedAt: Not(IsNull()) },
      withDeleted: true,
      relations: { operador: true, maquinaria: true, deletedBy: true },
      order: { deletedAt: 'DESC' }
    });
  }

  async removeMunicipal(id: number, reason: string | null, userId: number | null) {
    const row = await this.reportRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Reporte municipal no existe');

    row.deleteReason = reason ?? null;
    row.deletedById  = userId ?? null;
    await this.reportRepo.save(row);
    await this.reportRepo.softDelete(id);

    return { ok: true, id, reason: row.deleteReason };
  }

  // Filtros auxiliares para municipales
  findReportsByOperatorAndDate(operadorId: number, start: string, end: string) {
    const startStr = toISODate(start);
    const endStr   = toISODate(end);

    return this.reportRepo.find({
      where: {
        operador: { id: operadorId },
        fecha: Between(startStr, endStr), // strings
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
      .andWhere('mr.rol = :rol', { rol: 'cisterna' })
      .getMany();
  }

  findReports({ tipo, start, end }: { tipo?: string; start?: string; end?: string }) {
    const where: any = {};
    if (tipo) where.maquinaria = { tipo };

    if (start || end) {
      const s = start ? toISODate(start) : '1970-01-01';
      const e = end   ? toISODate(end)   : '9999-12-31';
      where.fecha = Between(s, e); // strings
    }

    return this.reportRepo.find({
      where,
      relations: { operador: true, maquinaria: true, materiales: true },
      order: { fecha: 'DESC', id: 'DESC' },
    });
  }

  async restoreMunicipal(id: number) {
    const row = await this.reportRepo.findOne({
      where: { id },
      withDeleted: true,
      relations: { operador: true, maquinaria: true, materiales: true },
    });
    if (!row) throw new NotFoundException('Reporte municipal no existe');

    const restoreInfo = {
      wasDeletedAt: row.deletedAt,
      deleteReason: row.deleteReason,
      deletedById: row.deletedById,
      restoredAt: new Date(),
    };

    await this.reportRepo.update(id, { deleteReason: null, deletedById: null });
    await this.reportRepo.restore(id);

    const restoredReport = await this.reportRepo.findOne({
      where: { id },
      relations: { operador: true, maquinaria: true, materiales: true },
    });

    return {
      ...restoredReport,
      restoreInfo,
      message: `Reporte municipal ID ${id} restaurado exitosamente`,
    };
  }

  // ========== Reportes de alquiler ==========
  async createRentalReport(dto: CreateRentalReportDto) {
    if (dto.operadorId) {
      const operator = await this.opRepo.findOne({ where: { id: Number(dto.operadorId) } });
      if (!operator) throw new BadRequestException(`Operador ${dto.operadorId} no existe`);
    }

    const fuente = String(dto.fuente || '').trim();
    const isRioOrTajo = ['ríos','rios','tajo'].includes(fuente.toLowerCase());
    const isKylcsa = fuente.toUpperCase() === 'KYLCSA';

    const d = dto.detalles ?? {};
    const detalles: Record<string, any> = {
      ...d,
      tipoMaterial: d.tipoMaterial ?? null,
      cantidadMaterial: d.cantidadMaterial != null ? Number(d.cantidadMaterial) : null,
      fuente: fuente || null,
      placaCarreta: d.placaCarreta ?? null,
      destino: d.destino ?? null,
      tipoCarga: d.tipoCarga ?? null,
      placaMaquinariaLlevada: d.placaMaquinariaLlevada ?? null,
      horaInicio: d.horaInicio ?? null,
      horaFin: d.horaFin ?? null,
      codigoCamino: d.codigoCamino ?? null,
      distrito: d.distrito ?? null,
    };

    const entity = this.rentalRepo.create({
      tipoMaquinaria: dto.tipoMaquinaria,
      placa: dto.placa ?? null,
      actividad: dto.actividad ?? null,
      cantidad: dto.cantidad ?? null,
      horas: dto.horas ?? null,
      estacion: dto.estacion ?? null,
      boleta: isRioOrTajo ? null : (isKylcsa ? null : (dto.boleta ?? null)),
      boletaKylcsa: isKylcsa ? (dto.boletaKylcsa ?? null) : null,
      fuente: fuente || null,
      // ⬇️ si en RentalReport.fecha también es 'date', conviene usar toISODate:
       fecha: dto.fecha ? toISODate(dto.fecha) : null,
      //fecha: dto.fecha ? (new Date(dto.fecha) as any) : null,
      operadorId: dto.operadorId ?? null,
      esAlquiler: true,
      detalles,
    });

    return this.rentalRepo.save(entity);
  }

  findAllRentalReports() {
    return this.rentalRepo.find({ relations: ['operador'] });
  }

  async findRentalReportById(id: number) {
    const r = await this.rentalRepo.findOne({
      where: { id },
      relations: { operador: true },
    });
    if (!r) throw new NotFoundException('Reporte de alquiler no existe');
    return r;
  }

  async updateRentalReport(id: number, dto: any) {
    const r = await this.rentalRepo.findOne({ where: { id } });
    if (!r) throw new NotFoundException('Reporte de alquiler no existe');

    if (dto.actividad !== undefined) r.actividad = dto.actividad ?? null;
    if (dto.cantidad !== undefined) r.cantidad = dto.cantidad === null ? null : Number(dto.cantidad);
    if (dto.horas !== undefined)    r.horas    = dto.horas    === null ? null : Number(dto.horas);
    if (dto.estacion !== undefined) r.estacion = dto.estacion ?? null;
    if (dto.boleta !== undefined)   r.boleta   = dto.boleta ?? null;
    if (dto.fuente !== undefined)   r.fuente   = dto.fuente ?? null;
    if (dto.tipoMaquinaria !== undefined) r.tipoMaquinaria = dto.tipoMaquinaria ?? r.tipoMaquinaria;
    if (dto.placa !== undefined)    r.placa    = dto.placa ?? r.placa;
    // ⬇️ igual que arriba: si es 'date' string, usa toISODate
    // if (dto.fecha !== undefined) r.fecha = dto.fecha ? toISODate(dto.fecha) : r.fecha;
    if (dto.fecha !== undefined)    r.fecha    = dto.fecha ? new Date(dto.fecha) as any : r.fecha;
    if (dto.operadorId !== undefined) r.operadorId = dto.operadorId ?? r.operadorId;

    return this.rentalRepo.save(r);
  }

  async removeRental(id: number, reason: string | null, userId: number | null) {
    const row = await this.rentalRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Reporte de alquiler no existe');

    row.deleteReason = reason ?? null;
    row.deletedById  = userId ?? null;
    await this.rentalRepo.save(row);
    await this.rentalRepo.softDelete(id);

    return { ok: true, id, reason: row.deleteReason };
  }

  findRentalReportsByOperator(operadorId: number) {
    return this.rentalRepo.find({
      where: { operadorId },
      relations: ['operador'],
    });
  }

  getDeletedRental() {
    return this.rentalRepo.find({
      withDeleted: true,
      where: { deletedAt: Not(IsNull()) },
      order: { deletedAt: 'DESC', id: 'DESC' },
      relations: { operador: true, deletedBy: true },
    });
  }

  async restoreRental(id: number) {
    const row = await this.rentalRepo.findOne({
      where: { id },
      withDeleted: true,
      relations: ['operador'],
    });
    if (!row) throw new NotFoundException('Reporte de alquiler no existe');

    const restoreInfo = {
      wasDeletedAt: row.deletedAt,
      deleteReason: row.deleteReason,
      deletedById: row.deletedById,
      restoredAt: new Date(),
    };

    await this.rentalRepo.update(id, { deleteReason: null, deletedById: null });
    await this.rentalRepo.restore(id);

    const restoredReport = await this.rentalRepo.findOne({
      where: { id },
      relations: ['operador'],
    });

    return {
      ...restoredReport,
      restoreInfo,
      message: `Reporte de alquiler ID ${id} restaurado exitosamente`,
    };
  }

  // ========== Reportes de materiales ==========
  createMaterialReport(dto: CreateMaterialReportDto) {
    return this.materialRepo.save(dto);
  }

  findAllMaterialReports() {
    return this.materialRepo.find({ relations: ['report'] });
  }

  findMaterialsBySource(source: string) {
    return this.materialRepo.find({ where: { fuente: source }, relations: ['report'] });
  }

  // ========== Resúmenes ==========
  getMaterialSummaryByMonth(month: number) {
    return this.materialRepo
      .createQueryBuilder('m')
      .select('m.fuente', 'fuente')
      .addSelect('SUM(m.cantidad)', 'totalCantidad')
      .where('MONTH(m.fecha) = :month', { month })
      .groupBy('m.fuente')
      .getRawMany();
  }

  getHorasMaquinaByOperador(month: number) {
    return this.reportRepo
      .createQueryBuilder('r')
      .leftJoin('r.operador', 'o')
      .select('o.nombre', 'operador')
      .addSelect('SUM(r.horasOrd + r.horasExt)', 'totalHoras')
      .where('MONTH(r.fecha) = :month', { month })
      .groupBy('o.nombre')
      .getRawMany();
  }

  getRentalSummaryByMonth(month: number) {
    return this.rentalRepo
      .createQueryBuilder('rr')
      .leftJoin('rr.operador', 'o')
      .select('rr.tipoMaquinaria', 'tipo')
      .addSelect('SUM(rr.horas)', 'totalHoras')
      .addSelect('o.name', 'operadorNombre')
      .where('MONTH(rr.fecha) = :month', { month })
      .groupBy('rr.tipoMaquinaria, o.name')
      .getRawMany();
  }
}
