import { IsEnum, IsOptional, IsString, IsObject, IsArray } from 'class-validator';
import { AuditAction, AuditEntity } from '../entities/audit-log.entity';

export class CreateAuditLogDto {
  @IsEnum(AuditAction, {
    message: 'action must be one of the following values: ' + Object.values(AuditAction).join(', ')
  })
  action: AuditAction;

  @IsEnum(AuditEntity, {
    message: 'entity must be one of the following values: ' + Object.values(AuditEntity).join(', ')
  })
  entity: AuditEntity;

  @IsOptional()
  @IsString()
  entityId?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  userEmail?: string;

  @IsOptional()
  @IsString()
  userName?: string;

  @IsOptional()
  @IsString()
  userLastname?: string;

  @IsOptional()
  @IsArray()
  userRoles?: string[];

  @IsString()
  description: string;

  @IsOptional()
  @IsObject()
  changesBefore?: any;

  @IsOptional()
  @IsObject()
  changesAfter?: any;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  ip?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsObject()
  metadata?: any;
}