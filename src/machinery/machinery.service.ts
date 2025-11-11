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
import { UpdateReportDto } from './dto/update-report.dto';

/** ---------- Estación ---------- */
function normEstacion(s?: string | null) {
  if (!s) return null;
  const m = String(s).match(/^\s*(\d+)\s*\+\s*(\d+)\s*$/);
  if (!m) return String(s).replace(/\s+/g, ''); // deja sin espacios (tu comportamiento actual)
  return `${Number(m[1])}+${Number(m[2])}`;
}
function splitEstacion(s?: string | null) {
  const m = String(s || '').match(/^\s*(\d+)\s*\+\s*(\d+)\s*$/);
  if (!m) return null;
  return { desde: Number(m[1]), hasta: Number(m[2]) };
}

/** ---------- Fuente ---------- */
function normalizeFuente(raw: any): string | null {
  const s = String(raw ?? '').trim();
  if (!s) return null;
  if (/^r[ií]os?$/i.test(s)) return 'Ríos';
  if (/^tajo$/i.test(s)) return 'Tajo';
  if (/^kylcsa$/i.test(s)) return 'KYLCSA';
  return s; // p. ej. "Palo de Arco"
}
function isRioOTajo(f?: string | null): boolean {
  const x = normalizeFuente(f);
  return x === 'Ríos' || x === 'Tajo';
}
function isKylcsa(f?: string | null): boolean {
  return normalizeFuente(f) === 'KYLCSA';
}

/** ---------- Utilidades ---------- */
const TIPOS_CON_BOLETA = new Set(['vagoneta', 'cabezal']);
const onlyDigitsN = (v: any, n: number) => {
  const s = String(v ?? '').replace(/\D/g, '').slice(0, n);
  return s.length ? s : null;
};

/** ---------- Reglas de boleta por TIPO y FUENTE ---------- */
function applyBoletaRules(
  rec: { tipoMaquinaria?: string | null; fuente: string | null; boleta: string | null; boletaKylcsa: string | null }
) {
  const tipo = String(rec.tipoMaquinaria || '').toLowerCase();
  const f = normalizeFuente(rec.fuente);

  // si el TIPO no permite boleta, limpiar todo
  if (!TIPOS_CON_BOLETA.has(tipo)) {
    rec.boleta = null;
    rec.boletaKylcsa = null;
    return;
  }

  // por FUENTE
  if (!f) {
    // sin fuente: permitir boleta municipal opcional, limpiar KYLCSA
    rec.boletaKylcsa = null;
    return;
  }
  if (f === 'Ríos' || f === 'Tajo') {
    rec.boleta = null;
    rec.boletaKylcsa = null;
    return;
  }
  if (f === 'KYLCSA') {
    rec.boleta = null;
    // boletaKylcsa permitida
    return;
  }
  // fuente municipal normal: permitir boleta municipal, limpiar KYLCSA
  rec.boletaKylcsa = null;
}

/** ---------- Sanitizadores de boletas (6 dígitos) ---------- */
function sanitizeBoletaMunicipal(v: any): string | null {
  const d = onlyDigitsN(v, 6);
  return d && d.length === 6 ? d : d === null ? null : d; // si no son 6, igual lo guardas nulo arriba por reglas
}
function sanitizeBoletaK(v: any): string | null {
  const d = onlyDigitsN(v, 6);
  return d && d.length === 6 ? d : d === null ? null : d;
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
  ) { }

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
    console.log(`✅ Maquinaria creada: ${machinery.tipo} (Placa: ${machinery.placa})`);

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

    const savedMachinery = await this.machineryRepo.findOne({
      where: { id: machinery.id },
      relations: { roles: true },
    });
    console.log(`✅ Maquinaria creada: ${savedMachinery?.tipo || 'N/A'} (Placa: ${savedMachinery?.placa || 'N/A'})`);
    return savedMachinery;
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
    console.log(`✅ Maquinaria actualizada: ${item.tipo} (Placa: ${item.placa})`);

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
    const item = await this.machineryRepo.findOne({ where: { id } });
    await this.machineryRepo.delete(id);
    console.log(`🗑️ Maquinaria eliminada: ${item?.tipo || 'N/A'} (Placa: ${item?.placa || 'N/A'})`);
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
      placaCarreta: this.nn((dto as any).placaCarreta ?? d.placaCarreta),
      horaInicio: this.to24h(this.nn((dto as any).horaInicio ?? d.horaInicio)),
      horaFin: this.to24h(this.nn((dto as any).horaFin ?? d.horaFin)),
      detalles,
      operador,
      maquinaria,
    };

    const entity = this.reportRepo.create(entityLike);
    const savedReport = await this.reportRepo.save(entity);
    console.log(`✅ Reporte municipal creado: ${savedReport.tipoActividad || 'N/A'} (${savedReport.fecha || 'Sin fecha'})`);
    return savedReport;
  }

  findAllReports(operatorId?: number) {
    const whereClause = operatorId ? { operador: { id: operatorId } } : {};

    return this.reportRepo.find({
      where: whereClause,
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

  async updateReport(id: number, dto: UpdateReportDto) {
    const report = await this.reportRepo.findOne({ where: { id } });
    if (!report) throw new NotFoundException('Reporte no existe');

    // Normalizadores locales
    const nn = (v: any) => (typeof v === 'string' ? (v.trim() === '' ? null : v.trim()) : v ?? null);
    const to24h = (s?: string | null) => this.to24h(nn(s) as any);

    // --- merge 'detalles' sin perder claves anteriores ---
    const detalles =
      dto.detalles != null
        ? { ...(report.detalles || {}), ...(dto.detalles || {}) }
        : report.detalles;

    // --- actualización campo a campo (solo si vienen en dto) ---
    if (dto.tipoActividad !== undefined || (dto as any).actividad !== undefined) {
      report.tipoActividad = nn((dto as any).tipoActividad ?? (dto as any).actividad);
    }
    if (dto.horasOrd !== undefined) {
      report.horasOrd = dto.horasOrd === null ? null : Number(dto.horasOrd);
    }
    if (dto.horasExt !== undefined) {
      report.horasExt = dto.horasExt === null ? null : Number(dto.horasExt);
    }
    if (dto.horaInicio !== undefined) {
      report.horaInicio = to24h(dto.horaInicio);
    }
    if (dto.horaFin !== undefined) {
      report.horaFin = to24h(dto.horaFin);
    }
    if ((dto as any).horimetro !== undefined) {
      (report as any).horimetro = (dto as any).horimetro === null ? null : Number((dto as any).horimetro);
    }
    if ((dto as any).kilometraje !== undefined) {
      (report as any).kilometraje = (dto as any).kilometraje === null ? null : Number((dto as any).kilometraje);
    }
    if ((dto as any).diesel !== undefined || (dto as any).combustible !== undefined) {
      (report as any).diesel = (dto as any).diesel ?? (dto as any).combustible ?? null;
    }
    if ((dto as any).fecha !== undefined) {
      report.fecha = (dto as any).fecha ? toISODate((dto as any).fecha) : null; // guarda como 'YYYY-MM-DD'
    }
    if ((dto as any).codigoCamino !== undefined) {
      report.codigoCamino = nn((dto as any).codigoCamino);
    }
    if ((dto as any).distrito !== undefined) {
      report.distrito = nn((dto as any).distrito);
    }
    if ((dto as any).estacion !== undefined) {
      // si ya usas normEstacion arriba, puedes aplicarlo aquí:
      report.estacion = nn((dto as any).estacion);
    }
    if ((dto as any).placaCarreta !== undefined) {
      (report as any).placaCarreta = nn((dto as any).placaCarreta);
    }

    // aplica detalles merged
    report.detalles = detalles;

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
    row.deletedById = userId ?? null;
    await this.reportRepo.save(row);
    await this.reportRepo.softDelete(id);
    console.log(`🗑️ Reporte municipal eliminado: ${row.tipoActividad || 'N/A'} (${row.fecha || 'Sin fecha'})`);

    return { ok: true, id, reason: row.deleteReason };
  }

  // Filtros auxiliares para municipales
  findReportsByOperatorAndDate(operadorId: number, start: string, end: string) {
    const startStr = toISODate(start);
    const endStr = toISODate(end);

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
      const e = end ? toISODate(end) : '9999-12-31';
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
    console.log(`♻️ Reporte municipal restaurado: ${restoredReport?.tipoActividad || 'N/A'} (${restoredReport?.fecha || 'Sin fecha'})`);

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

    const fuente = normalizeFuente(dto.fuente);
    const estacion = normEstacion(dto.estacion);
    const pair = splitEstacion(estacion);
    if (pair && pair.hasta < pair.desde) {
      throw new BadRequestException('La estación “hasta” no puede ser menor que “desde”.');
    }

      // ✅ normaliza/acepta detalles si viene (boletas del día, etc.)
  const detalles =
    dto.detalles && typeof dto.detalles === 'object'
      ? dto.detalles
      : null;

    const entity = this.rentalRepo.create({
      fecha: dto.fecha ? (toISODate(dto.fecha) as any) : null,
      codigoCamino: dto.codigoCamino ?? null,
      distrito: dto.distrito ?? null,

      tipoMaquinaria: dto.tipoMaquinaria ?? null,
      placa: dto.placa ?? null,
      actividad: dto.actividad ?? null,
      cantidad: dto.cantidad == null ? null : Number(dto.cantidad),
      horas: dto.horas == null ? null : Number(dto.horas),
      estacion,

      // primero sanitiza, luego las reglas decidirán qué queda nulo
      boleta: sanitizeBoletaMunicipal(dto.boleta),
      boletaKylcsa: sanitizeBoletaK((dto as any).boletaKylcsa ?? (dto as any).boletaK ?? null),

      fuente,
      operadorId: dto.operadorId ?? null,
      esAlquiler: true,
      detalles,
    });

    applyBoletaRules(entity);
    const saved = await this.rentalRepo.save(entity);
    return saved;
  }


  findAllRentalReports(operatorId?: number) {
    const whereClause = operatorId ? { operador: { id: operatorId } } : {};

    return this.rentalRepo.find({
      where: whereClause,
      relations: ['operador'],
      order: { fecha: 'DESC', id: 'DESC' },
    });
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



    // operador
    if (dto.operadorId !== undefined) {
      if (dto.operadorId === null) r.operadorId = null;
      else {
        const operator = await this.opRepo.findOne({ where: { id: Number(dto.operadorId) } });
        if (!operator) throw new BadRequestException(`Operador ${dto.operadorId} no existe`);
        r.operadorId = Number(dto.operadorId);
      }
    }

    // simples
    if (dto.actividad !== undefined) r.actividad = dto.actividad ?? null;
    if (dto.cantidad !== undefined) r.cantidad = dto.cantidad == null ? null : Number(dto.cantidad);
    if (dto.horas !== undefined) r.horas = dto.horas == null ? null : Number(dto.horas);
    if (dto.tipoMaquinaria !== undefined) r.tipoMaquinaria = dto.tipoMaquinaria ?? r.tipoMaquinaria;
    if (dto.placa !== undefined) r.placa = dto.placa ?? r.placa;
    if (dto.codigoCamino !== undefined) r.codigoCamino = dto.codigoCamino ?? null;
    if (dto.distrito !== undefined) r.distrito = dto.distrito ?? null;
    if (dto.fecha !== undefined) r.fecha = dto.fecha ? (toISODate(dto.fecha) as any) : null;

    // estación
    if (dto.estacion !== undefined) {
      const est = normEstacion(dto.estacion);
      const pair = splitEstacion(est);
      if (pair && pair.hasta < pair.desde) {
        throw new BadRequestException('La estación “hasta” no puede ser menor que “desde”.');
      }
      r.estacion = est;
    }

    // fuente / boletas
    let touched = false;
    if (dto.fuente !== undefined) {
      r.fuente = normalizeFuente(dto.fuente);
      touched = true;
    }
    if (dto.boleta !== undefined) {
      r.boleta = sanitizeBoletaMunicipal(dto.boleta);
      touched = true;
    }
    if (dto.boletaKylcsa !== undefined || dto.boletaK !== undefined) {
      (r as any).boletaKylcsa = sanitizeBoletaK(dto.boletaKylcsa ?? dto.boletaK);
      touched = true;
    }

    if (touched || dto.tipoMaquinaria !== undefined) {
      applyBoletaRules(r as any);
    }

    // ✅ merge de detalles si viene en dto
  if (dto.detalles !== undefined) {
    if (dto.detalles === null) {
      r.detalles = null;
    } else if (typeof dto.detalles === 'object') {
      const incoming = dto.detalles as Record<string, any>;
      const prev = (r.detalles || {}) as Record<string, any>;

      // si llega boletas, se reemplaza el array completo
      const { boletas, ...rest } = incoming;
      r.detalles = { ...prev, ...rest };
      if (boletas !== undefined) {
        (r.detalles as any).boletas = Array.isArray(boletas) ? boletas : null;
      }
    }
  }

    const saved = await this.rentalRepo.save(r);
    return saved;
  }

  async removeRental(id: number, reason: string | null, userId: number | null) {
    const row = await this.rentalRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Reporte de alquiler no existe');

    row.deleteReason = reason ?? null;
    row.deletedById = userId ?? null;
    await this.rentalRepo.save(row);
    await this.rentalRepo.softDelete(id);
    console.log(`🗑️ Reporte de alquiler eliminado: ${row.actividad || 'N/A'} (${row.fecha || 'Sin fecha'})`);

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
    console.log(`♻️ Reporte de alquiler restaurado: ${restoredReport?.actividad || 'N/A'} (${restoredReport?.fecha || 'Sin fecha'})`);

    return {
      ...restoredReport,
      restoreInfo,
      message: `Reporte de alquiler ID ${id} restaurado exitosamente`,
    };
  }

  // ========== Reportes de materiales ==========
  async createMaterialReport(dto: CreateMaterialReportDto) {
    const savedMaterial = await this.materialRepo.save(dto);
    console.log(`✅ Reporte de material creado: ${savedMaterial.material || 'N/A'} (Cantidad: ${savedMaterial.cantidad || 'N/A'})`);
    return savedMaterial;
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
