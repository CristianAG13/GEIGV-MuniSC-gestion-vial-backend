import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class CreateMaterialReportDto {
  @IsString()
  material: string;

  @IsNumber()
  cantidad: number;

  @IsString()
  fuente: string; // Palo de Arco / KYLCSA

  @IsString()
  boleta: string;

  @IsDateString()
  fecha: string;

  @IsOptional()
  @IsString()
  destino?: string;

  @IsNumber()
  reportId: number;
}
