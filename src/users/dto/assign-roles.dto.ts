import { IsArray, ArrayMinSize } from 'class-validator';

export class AssignRolesDto {
  // @IsArray()
  // @IsNotEmpty()
  // @ArrayMinSize(1)
  @IsArray()
  @ArrayMinSize(0) // Permitir arrays vacíos
  roleIds: number[];
  
}