import { IsString, IsNumber, IsOptional, IsDateString, Matches, ValidateIf } from 'class-validator';

export class CreateMaterialReportDto {
  @IsString()
  material: string;

  @IsNumber()
  cantidad: number;

  @IsString()
  fuente: string; // Palo de Arco / KYLCSA

  @ValidateIf(o =>
  (o?.tipoMaquinaria || '').toLowerCase() === 'vagoneta' &&
  (o?.tipoActividad || o?.detalles?.tipoMaterial || '').toLowerCase() === 'material' &&
  Number(o?.combustible) > 0
  )
  @Matches(/^\d{6}$/)
  boleta?: string;

  @IsDateString()
  fecha: string;

  @IsOptional()
  @IsString()
  destino?: string;

  @IsNumber()
  reportId: number;
}
