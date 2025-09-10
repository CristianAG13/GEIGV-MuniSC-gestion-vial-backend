import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, RelationId } from 'typeorm';
import { Operator } from '../../operators/entities/operator.entity';
import { Machinery } from './machinery.entity';
import { MaterialReport } from './material-report.entity';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn()
  id: number;

  
  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  fecha: Date;

  @Column({ nullable: true })
  estacion: string;

  @Column({ nullable: true })
  codigoCamino: string;

  @Column({ nullable: true })
  distrito: string;

  @Column({ type: 'float', nullable: true })
  horimetro: number;

  @Column({ type: 'float', nullable: true })
  kilometraje: number;

  @Column({ type: 'float', nullable: true })
  diesel: number;

  @Column({ type: 'float', nullable: true })
  horasOrd: number;

  @Column({ type: 'float', nullable: true })
  horasExt: number;

  @Column({ type: 'float', nullable: true })
  viaticos: number;

  //Nuevos campos
  @Column({ type: 'varchar', length: 16, nullable: true })
  placaCarreta?: string;

  @Column({ type: 'time', nullable: true })
  horaInicio?: string;

  @Column({ type: 'time', nullable: true })
  horaFin?: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  tipoActividad?: string; // si no existía

  @Column("json", { nullable: true })
  detalles: Record<string, any>;

  // @ManyToOne(() => Operator, (operator) => operator.reports)
  // operadorId: Operator;

  // @ManyToOne(() => Machinery, (machinery) => machinery.reports)
  // maquinariaId: Machinery;

  // @OneToMany(() => MaterialReport, (material) => material.report)
  // materiales: MaterialReport[];

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




