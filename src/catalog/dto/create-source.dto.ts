// import { IsIn, IsString, MinLength } from 'class-validator';
// export class CreateSourceDto {
//   @IsIn(['rio','tajo'])
//   tipo!: 'rio' | 'tajo';

//   @IsString()
//   @MinLength(2)
//   nombre!: string;
// }

import { IsIn, IsString, MinLength } from 'class-validator';

export class CreateSourceDto {
  @IsIn(['rio', 'tajo'])
  tipo!: 'rio' | 'tajo';

  @IsString()
  @MinLength(2)
  nombre!: string;
}
