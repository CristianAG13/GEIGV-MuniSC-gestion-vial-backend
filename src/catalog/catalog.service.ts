import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Source } from './entities/source.entity';
import { CreateSourceDto } from './dto/create-source.dto';
import { UpdateSourceDto } from './dto/update-source.dto';

@Injectable()
export class CatalogService {
  constructor(@InjectRepository(Source) private repo: Repository<Source>) {}

  list(params: { tipo?: 'rio'|'tajo'; q?: string; skip?: number; take?: number; includeInactive?: boolean }) {
    const { tipo, q, skip = 0, take = 20, includeInactive = false } = params || {};
    const where: any = {};
    if (tipo) where.tipo = tipo;
    if (!includeInactive) where.activo = true;
    if (q) where.nombre = ILike(`%${q}%`);
    return this.repo.findAndCount({
      where, skip, take,
      order: { nombre: 'ASC', id: 'DESC' },
    });
  }

  async create(dto: CreateSourceDto) {
    const exists = await this.repo.findOne({ where: { tipo: dto.tipo, nombre: dto.nombre.trim() } });
    if (exists) throw new BadRequestException('Ya existe un registro con ese nombre.');
    const row = this.repo.create({ ...dto, nombre: dto.nombre.trim() });
    return this.repo.save(row);
  }

  async update(id: number, dto: UpdateSourceDto) {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('No existe el registro');
    if (dto.nombre) row.nombre = dto.nombre.trim();
    if (dto.active !== undefined) row.activo = !!dto.active;
    return this.repo.save(row);
  }

  async remove(id: number) {
  // Hard delete directo
  const result = await this.repo.delete(id);
  if (!result.affected) {
    throw new NotFoundException('No existe el registro');
  }
  return { ok: true };
}
}