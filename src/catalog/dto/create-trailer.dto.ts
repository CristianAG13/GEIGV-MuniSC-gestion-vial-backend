import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CategoriaCarreta, MaterialTipo, TipoMaquinaria } from '../entities/trailer.entity';

export class CreateTrailerDto {
  @IsString()
  placa: string;

  @IsEnum(['vagoneta', 'cabezal'])
  tipoMaquinaria: TipoMaquinaria;

  @IsEnum(['carreta', 'material'])
  categoria: CategoriaCarreta;

  @IsOptional()
  @IsEnum(['desecho', 'plataforma'])
  materialTipo?: MaterialTipo;
}
