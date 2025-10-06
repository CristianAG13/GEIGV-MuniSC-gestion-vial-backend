import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Transform } from 'class-transformer';
import { User } from '../../users/entities/user.entity';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  RESTORE = 'RESTORE',
  AUTH = 'AUTH',
  SYSTEM = 'SYSTEM',
  ROLE_CHANGE = 'ROLE_CHANGE',
}

export enum AuditEntity {
  USUARIOS = 'usuarios',
  TRANSPORTE = 'transporte',
  OPERADORES = 'operadores',
  REPORTES = 'reportes',
  ROLES = 'roles',
  SOLICITUDES = 'solicitudes',
  SYSTEM = 'system',
  AUTHENTICATION = 'authentication',
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  action: AuditAction;

  @Column({
    type: 'enum',
    enum: AuditEntity,
  })
  entity: AuditEntity;

  @Column({ nullable: true })
  entityId: string;

  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true })
  userEmail: string;

  @Column({ length: 255, nullable: true })
  userName: string;

  @Column({ length: 255, nullable: true })
  userLastname: string;

  @Column('simple-array', { nullable: true })
  userRoles: string[];

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'json', nullable: true })
  changesBefore: any;

  @Column({ type: 'json', nullable: true })
  changesAfter: any;

  @CreateDateColumn()
  @Transform(({ value }) => value instanceof Date ? value.toISOString() : value)
  timestamp: Date;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  ip: string;

  @Column({ nullable: true })
  url: string;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User;
}