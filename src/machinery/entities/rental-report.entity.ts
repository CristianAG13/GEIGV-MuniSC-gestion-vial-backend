import { IsString } from 'class-validator';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Operator } from '../../operators/entities/operator.entity';

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
  
   //👇 ESTA ES LA COLUMNA QUE FALTABA
  @Column({ type: 'varchar', length: 32, nullable: true }) // pon nullable:false cuando ya tengas datos
  fuente: string; // 'Kilcsa' | 'Palo de Arco'
<<<<<<< HEAD
  
  @Column({ nullable: true })
  operadorId: number;
  
  @ManyToOne(() => Operator, { nullable: true })
  @JoinColumn({ name: 'operadorId' })
  operador: Operator;
=======


  
>>>>>>> 3f61e1d4dc82bef5c160fb3275a4998eaab3b56f
}
