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
  estacion?: string; // si ocupas "N+M", puedes copiar el @Matches del municipal

  // Boleta normal (sólo cuando no es Ríos/Tajo)
  @ValidateIf(o => !['ríos','rios','tajo'].includes(String(o?.fuente || '').toLowerCase()))
  @IsOptional()
  @Matches(/^\d{6}$/)
  boleta?: string;

  // NUEVO: boleta especial para KYLCSA
  @ValidateIf(o => String(o?.fuente || '').toUpperCase() === 'KYLCSA')
  @IsOptional()
  @IsString()
  boletaKylcsa?: string;

  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @IsString()
  @IsIn(['KYLCSA','Palo de Arco','Ríos','Tajo'], { message: 'fuente inválida' })
  fuente?: string;

  // “Extras” espejo de municipal pero los mandamos en `detalles`
  @IsOptional() detalles?: Record<string, any>;

  @IsOptional()
  esAlquiler?: boolean;
}