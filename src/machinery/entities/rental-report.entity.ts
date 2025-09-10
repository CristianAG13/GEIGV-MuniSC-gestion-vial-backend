import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

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

  @Column({ type: 'date', nullable: true})
  fecha: Date;
}
