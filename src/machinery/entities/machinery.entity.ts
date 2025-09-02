import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Report } from './report.entity';

@Entity('machineries')
export class Machinery {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tipo: string; // vagoneta, excavadora, etc.

  @Column()
  placa: string;

  @Column({ nullable: true })
  rol: string; // normal | cisterna | remolque
  

  @Column({ default: true })
  esPropietaria: boolean;


  @OneToMany(() => Report, report => report.maquinaria)
reports: Report[];
}
