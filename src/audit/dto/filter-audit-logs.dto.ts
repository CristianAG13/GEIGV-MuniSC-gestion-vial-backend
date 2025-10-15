import { IsOptional, IsEnum, IsString, IsDateString, IsInt, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { AuditAction, AuditEntity } from '../entities/audit-log.entity';

export class FilterAuditLogsDto {
  @IsOptional()
  @Transform(({ value }) => value === '' ? undefined : value)
  action?: string; // Cambiar a string para ser más flexible

  @IsOptional()
  @Transform(({ value }) => value === '' ? undefined : value)
  entity?: string; // Cambiar a string para ser más flexible

  @IsOptional()
  @Transform(({ value }) => value === '' ? undefined : value)
  @IsString()
  entityId?: string;

  @IsOptional()
  @Transform(({ value }) => value === '' ? undefined : value)
  @IsString()
  userId?: string;

  @IsOptional()
  @Transform(({ value }) => value === '' ? undefined : value)
  @IsString()  
  userEmail?: string;

  @IsOptional()
  @Transform(({ value }) => value === '' ? undefined : value)
  startDate?: string; // Simplificar validación de fecha

  @IsOptional()
  @Transform(({ value }) => value === '' ? undefined : value)
  endDate?: string; // Simplificar validación de fecha

  @IsOptional()
  @Transform(({ value }) => value === '' ? undefined : value)
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string = 'timestamp';

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}