import { IsOptional, IsString, MinLength } from 'class-validator';

export class RejectRoleRequestDto {
  @IsString()
  @IsOptional()
  @MinLength(5, { message: 'El motivo del rechazo debe tener al menos 5 caracteres' })
  reason?: string;
}
