import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateOperatorDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  last: string;

  @IsString()
  @IsNotEmpty()
  identification: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;
  
  @IsNumber()
  @IsOptional()
  userId?: number;
}
