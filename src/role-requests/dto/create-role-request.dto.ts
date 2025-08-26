import { IsNotEmpty, IsString, IsNumber, MinLength } from 'class-validator';

export class CreateRoleRequestDto {
  @IsString()
  @IsNotEmpty()
  requestedRole: string; // Nombre del rol solicitado (ej: "empleado", "admin")

  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'La justificación debe tener al menos 10 caracteres' })
  justification: string;
}
