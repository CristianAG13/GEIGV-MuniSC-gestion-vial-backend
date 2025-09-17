import { IsString, IsNumber, IsOptional, IsDateString, Matches, Min, IsInt } from 'class-validator';
import { Transform } from 'class-transformer';



export class CreateReportDto {
  @IsDateString()
  fecha: string;

  @IsOptional()
  @IsString()
  actividad?: string;

  // @IsOptional()
  // @IsString()
  // estacion?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\s*\d+\s*\+\s*\d+\s*$/) // "100+350", con espacios opcionales
  estacion?: string;

  @IsOptional()
  @IsString()
  codigoCamino?: string;

  @IsOptional()
  @IsString()
  distrito?: string;

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



  //Nuevos campos
   @IsOptional()
  @IsString()
  placaCarreta?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) // 00:00 - 23:59 (tú envías :00)
  horaInicio?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  horaFin?: string;

  @IsOptional()
  @IsString()
  tipoActividad?: string; // si no estaba
   
  @IsOptional()
  @Transform(({ value }) => value === '' || value == null ? null : Number(value))
  @IsInt()
  @Min(0)
  horimetro?: number | null;
  

  @IsOptional()
  detalles?: Record<string, any>; 
  
  @IsNumber()
  operadorId: number;

  @IsNumber()
  maquinariaId: number;
}


