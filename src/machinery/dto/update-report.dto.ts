// src/machinery/dto/update-report.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateReportDto } from './create-report.dto';
import { IsOptional, IsString, Matches, IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateReportDto extends PartialType(CreateReportDto) {
  @IsOptional()
  @IsString()
  @Matches(/^\s*\d+\s*\+\s*\d+\s*$/)
  estacion?: string;

  @IsOptional()
  @Transform(({ value }) => value === '' || value == null ? null : Number(value))
  @IsInt()
  @Min(0)
  horimetro?: number | null;

  @IsOptional()
  detalles?: Record<string, any>;
}
