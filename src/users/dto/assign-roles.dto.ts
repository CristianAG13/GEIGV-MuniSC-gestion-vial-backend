import { IsArray, IsNotEmpty, ArrayMinSize } from 'class-validator';

export class AssignRolesDto {
  @IsArray()
  @IsNotEmpty()
  @ArrayMinSize(1)
  roleIds: number[];
}