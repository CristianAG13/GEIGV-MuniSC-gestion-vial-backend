import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Report } from './report.entity';

@Entity('material_reports')
export class MaterialReport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  material: string;

  @Column({ type: 'float' })
  cantidad: number;

  @Column()
  fuente: string; // Palo de Arco o KYLCSA

  @Column()
  boleta: string;



  @Column({ type: 'date' })
  fecha: Date;

  @Column({ nullable: true })
  destino: string;

  @ManyToOne(() => Report, (report) => report.materiales)
  report: Report;
}
