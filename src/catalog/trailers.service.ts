import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Trailer } from './entities/trailer.entity';
import { CreateTrailerDto } from './dto/create-trailer.dto';
import { UpdateTrailerDto } from './dto/update-trailer.dto';

type ListParams = {
  tipoMaquinaria?: 'vagoneta'|'cabezal';
  categoria?: 'carreta'|'material';
  materialTipo?: 'desecho' | 'plataforma';
  q?: string;
  skip?: number;
  take?: number;
};

@Injectable()
export class TrailersService {
  constructor(
    @InjectRepository(Trailer)
    private readonly repo: Repository<Trailer>,
  ) {}

  private validateBusiness(dto: Partial<CreateTrailerDto | UpdateTrailerDto>) {
    const t = dto.tipoMaquinaria;
    const c = dto.categoria;
    const m = dto.materialTipo;

    if (t === 'cabezal' && c === 'material' && !m) {
      throw new BadRequestException('materialTipo es requerido para cabezal/material');
    }
    if (t === 'vagoneta' && c === 'material') {
      throw new BadRequestException('vagoneta no admite categoria material');
    }
    if (c === 'carreta' && m) {
      throw new BadRequestException('materialTipo solo aplica cuando categoria=material');
    }
  }

  async list(params: ListParams) {
    const { tipoMaquinaria, categoria, materialTipo, q, skip = 0, take = 50 } = params;

    const where: any = {};
    if (tipoMaquinaria) where.tipoMaquinaria = tipoMaquinaria;
    if (categoria) where.categoria = categoria;
    if (materialTipo) where.materialTipo = materialTipo;
    if (q) where.placa = ILike(`%${q}%`);
    where.activa = 1;

    const [items, total] = await this.repo.findAndCount({
      where,
      order: { placa: 'ASC' },
      skip,
      take,
    });

    return { items, total };
  }

  async create(dto: CreateTrailerDto) {
    this.validateBusiness(dto);
    const entity = this.repo.create({
      placa: dto.placa.toUpperCase().trim(),
      tipoMaquinaria: dto.tipoMaquinaria,
      categoria: dto.categoria,
      materialTipo: dto.materialTipo ?? null,
      activa: 1,
    });
    return this.repo.save(entity);
  }

  async update(id: number, dto: UpdateTrailerDto) {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Carreta no encontrada');

    const merged = { ...row, ...dto } as any;
    this.validateBusiness(merged);
    if (merged.placa) merged.placa = String(merged.placa).toUpperCase().trim();

    await this.repo.update(id, merged);
    return this.repo.findOne({ where: { id } });
  }

  async remove(id: number) {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Carreta no encontrada');
    await this.repo.delete(id);
    return { success: true };
  }
}
