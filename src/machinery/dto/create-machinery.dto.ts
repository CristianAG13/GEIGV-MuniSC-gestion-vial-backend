import { IsString, IsBoolean, IsOptional, IsArray } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateMachineryDto {
  @IsString()
  tipo: string;

  @IsString()
  placa: string;

  @IsBoolean()
  esPropietaria: boolean;


   @IsOptional()
  @IsArray()
  @IsString({ each: true })       // 👈 importante: valida cada elemento
  @Transform(({ value }) => {
    // Acepta "cisterna" o ["cisterna"] y lo normaliza
    if (Array.isArray(value)) {
      return value.map((v) => String(v).trim().toLowerCase()).filter(Boolean);
    }
    if (typeof value === 'string' && value.trim() !== '') {
      return [value.trim().toLowerCase()];
    }
    return undefined; // mantiene opcional
  })
  roles?: string[];
}


