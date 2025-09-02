import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Operator } from '../../operators/entities/operator.entity';
import { Machinery } from './machinery.entity';
import { MaterialReport } from './material-report.entity';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn()
  id: number;

  
  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  fecha: Date;


  @Column({ type: 'time', nullable: true })
  horaInicio: string;

  @Column({ type: 'time', nullable: true })
  horaFin: string;

  @Column({ nullable: true })
  actividad: string;

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

  @Column("json", { nullable: true })
  detalles: Record<string, any>;

  @ManyToOne(() => Operator, (operator) => operator.reports)
  operador: Operator;

  @ManyToOne(() => Machinery, (machinery) => machinery.reports)
  maquinaria: Machinery;

  @OneToMany(() => MaterialReport, (material) => material.report)
  materiales: MaterialReport[];

}


