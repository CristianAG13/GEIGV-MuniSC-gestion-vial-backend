import { IsString, IsNumber, IsOptional, IsDateString, Matches, ValidateIf, IsIn } from 'class-validator';

export class CreateRentalReportDto {
  @IsString()
  tipoMaquinaria: string;

  @IsOptional()
  @IsNumber()
  operadorId?: number;

  @IsOptional()
  @IsString()
  placa?: string;

  @IsOptional()
  @IsString()
  actividad?: string;

  @IsOptional()
  @IsNumber()
  cantidad?: number;

  @IsOptional()
  @IsNumber()
  horas?: number;

  @IsOptional()
  @IsString()
  estacion?: string;

  @ValidateIf(o =>
  (o?.tipoMaquinaria || '').toLowerCase() === 'vagoneta' &&
  (o?.tipoActividad || o?.detalles?.tipoMaterial || '').toLowerCase() === 'material' &&
  Number(o?.combustible) > 0
  )
  @Matches(/^\d{6}$/)
  boleta?: string;

  @IsOptional()
  @IsDateString()
  fecha?: string;

 @IsString()
  @IsIn(['Kilcsa', 'Palo de Arco'])
  fuente: string;
}
