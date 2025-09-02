import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class CreateReportDto {
  @IsDateString()
  fecha: string;

  @IsOptional()
  @IsString()
  horaInicio?: string;

  @IsOptional()
  @IsString()
  horaFin?: string;


  @IsOptional()
  @IsString()
  actividad?: string;

  @IsOptional()
  @IsString()
  estacion?: string;

  @IsOptional()
  @IsString()
  codigoCamino?: string;

  @IsOptional()
  @IsString()
  distrito?: string;

  @IsOptional()
  @IsNumber()
  horimetro?: number;

  @IsOptional()
  @IsNumber()
  kilometraje?: number;

  @IsOptional()
  @IsNumber()
  diesel?: number;

  @IsOptional()
  @IsNumber()
  horasOrd?: number;

  @IsOptional()
  @IsNumber()
  horasExt?: number;

  @IsOptional()
  @IsNumber()
  viaticos?: number;

   

  @IsOptional()
  detalles?: Record<string, any>; 
  
  @IsNumber()
  operadorId: number;

  @IsNumber()
  maquinariaId: number;
}


