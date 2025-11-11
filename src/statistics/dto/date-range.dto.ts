import { IsOptional, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

export class DateRangeDto {
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => value ? new Date(value).toISOString() : value)
  startDate?: string;

  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => value ? new Date(value).toISOString() : value)
  endDate?: string;

  @IsOptional()
  period?: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
}