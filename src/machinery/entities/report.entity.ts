import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, RelationId, DeleteDateColumn } from 'typeorm';
import { Operator } from '../../operators/entities/operator.entity';
import { Machinery } from './machinery.entity';
import { MaterialReport } from './material-report.entity';
import { User } from 'src/users/entities/user.entity';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn()
  id: number;

  
 // ❗ Debe ser string y tipo 'date' (NO timestamp)
@Column({ type: 'date', nullable: true })
fecha!: string | null;


  @Column({ nullable: true })
  estacion: string;

  @Column({ nullable: true })
  codigoCamino: string;

  @Column({ nullable: true })
  distrito: string;

  @Column({ type: 'float', nullable: true })
  kilometraje: number;

  @Column({ type: 'float', nullable: true })
  diesel: number;

  @Column({ type: 'float', nullable: true })
  horasOrd: number;

  @Column({ type: 'float', nullable: true })
  horasExt: number;

  //Nuevos campos
  @Column({ type: 'varchar', length: 16, nullable: true })
  placaCarreta?: string;

  @Column({ type: 'time', nullable: true })
  horaInicio?: string;

  @Column({ type: 'time', nullable: true })
  horaFin?: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  tipoActividad?: string; // si no existía

  @Column('int', { nullable: true })
  horimetro: number | null;



  @Column("json", { nullable: true })
  detalles: Record<string, any>;


  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt?: Date | null;

  @Column({ name: 'delete_reason', type: 'text', nullable: true })
  deleteReason?: string | null;


// opcional si quieres guardar quién borró
 @Column({ name: 'deleted_by_id', type: 'int', nullable: true })
  deletedById?: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
@JoinColumn({ name: 'deleted_by_id' })
deletedBy?: User | null; 

  // 👇 Relación correcta + nombre de columna controlado
  @ManyToOne(() => Operator, (operator) => operator.reports, { onDelete: 'NO ACTION', onUpdate: 'NO ACTION' })
  @JoinColumn({ name: 'operadorId' })
  operador: Operator;

  @ManyToOne(() => Machinery, (machinery) => machinery.reports, { onDelete: 'NO ACTION', onUpdate: 'NO ACTION' })
  @JoinColumn({ name: 'maquinariaId' })
  maquinaria: Machinery;

  @OneToMany(() => MaterialReport, (material) => material.report)
  materiales: MaterialReport[];

}




