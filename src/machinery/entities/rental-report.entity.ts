import { IsString } from 'class-validator';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, DeleteDateColumn } from 'typeorm';
import { Operator } from '../../operators/entities/operator.entity';
import { User } from 'src/users/entities/user.entity';

@Entity('rental_reports')
export class RentalReport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tipoMaquinaria: string;

  @Column({ nullable: true })
  placa: string;

  @Column({ nullable: true })
  actividad: string;

  @Column({ type: 'float', nullable: true })
  cantidad: number;

  @Column({ type: 'float', nullable: true })
  horas: number;

  @Column({ nullable: true })
  estacion: string;

  @Column({ nullable: true })
  boleta: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  boletaKylcsa: string; // NUEVO

  @Column({ type: 'date', nullable: true })
  fecha: Date;

  @Column({ type: 'varchar', length: 32, nullable: true })
  fuente: string; // 'KYLCSA' | 'Palo de Arco' | 'Ríos' | 'Tajo'

  @Column({ type: 'boolean', nullable: true })
  esAlquiler: boolean;

  @Column({ nullable: true })
  operadorId: number;

  @Column('json', { nullable: true })
  detalles: Record<string, any>; // NUEVO: espejo de municipal

  // soft delete + auditoría
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt?: Date | null;

  @Column({ name: 'delete_reason', type: 'text', nullable: true })
  deleteReason?: string | null;

  @Column({ name: 'deleted_by_id', type: 'int', nullable: true })
  deletedById?: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'deleted_by_id' })
  deletedBy?: User | null;

  @ManyToOne(() => Operator, { nullable: true })
  @JoinColumn({ name: 'operadorId' })
  operador: Operator;
}
