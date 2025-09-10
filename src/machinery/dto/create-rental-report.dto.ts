import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class CreateRentalReportDto {
  @IsString()
  tipoMaquinaria: string;

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

  @IsOptional()
  @IsString()
  boleta?: string;

  @IsOptional()
  @IsDateString()
  fecha?: string;
}
