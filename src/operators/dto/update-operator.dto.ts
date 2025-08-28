import { IsOptional, IsString, IsNumber } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateOperatorDto } from './create-operator.dto';

export class UpdateOperatorDto extends PartialType(CreateOperatorDto) {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  last?: string;

  @IsString()
  @IsOptional()
  identification?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;
  
  @IsNumber()
  @IsOptional()
  userId?: number;
}
