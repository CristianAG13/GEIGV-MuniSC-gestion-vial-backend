import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateMachineryDto {
  @IsString()
  tipo: string;

  @IsString()
  placa: string;

  @IsBoolean()
  esPropietaria: boolean;

  @IsOptional()
  @IsString()
  roles?: string[];
}
