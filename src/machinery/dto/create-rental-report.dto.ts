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
  // Si quieres forzar N+M: activa el Matches
  @Matches(/^\d+\+\d+$/, { message: 'estacion debe ser N+M, p. ej. 12+500', groups: ['strict'] })
  estacion?: string;

  // Boleta normal (sólo cuando NO es Ríos/Tajo/KYLCSA)
  @ValidateIf(o => !['ríos','rios','tajo','kylcsa'].includes(String(o?.fuente || '').toLowerCase()))
  @IsOptional()
  @Matches(/^\d{6}$/, { message: 'boleta debe tener 6 dígitos' })
  boleta?: string;

  // Boleta especial para KYLCSA
  @ValidateIf(o => String(o?.fuente || '').toUpperCase() === 'KYLCSA')
  @IsOptional()
  @IsString()
  boletaKylcsa?: string;

  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @Matches(/^\d{3}$/, { message: 'codigoCamino debe tener 3 dígitos' })
  codigoCamino?: string;

  @IsOptional()
  @IsString()
  distrito?: string;

  @IsOptional()
  @IsString()
  @IsIn(['KYLCSA','Palo de Arco','Ríos','Tajo'], { message: 'fuente inválida' })
  fuente?: string;

  @IsOptional()
  detalles?: Record<string, any>;

  @IsOptional()
  esAlquiler?: boolean;
}
