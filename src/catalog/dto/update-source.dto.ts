// import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';
// export class UpdateSourceDto {
//   @IsOptional()
//   @IsString()
//   @MinLength(2)
//   nombre?: string;

//   @IsOptional()
//   @IsBoolean()
//   activo?: boolean;
// }

import { IsBoolean, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateSourceDto {
  @IsOptional()
  @IsIn(['rio', 'tajo'])
  tipo?: 'rio' | 'tajo';

  @IsOptional()
  @IsString()
  @MinLength(2)
  nombre?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
