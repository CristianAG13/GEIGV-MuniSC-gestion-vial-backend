import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateMachineryDto {
  @IsString()
  tipo: string;

  @IsString()
  placa: string;

  @IsOptional()
  @IsString()
  rol?: string;

  @IsBoolean()
  esPropietaria: boolean;
}
