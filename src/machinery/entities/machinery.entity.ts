import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Report } from './report.entity';
import { MachineryRole } from './machinery-role.entity';

@Entity('machineries')
export class Machinery {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tipo: string; // vagoneta, excavadora, etc.

  @Column()
  placa: string;


  @Column({ default: true })
  esPropietaria: boolean;


  @OneToMany(() => Report, report => report.maquinariaId)
reports: Report[];

@OneToMany(() => MachineryRole, (r) => r.machinery, { cascade: true })
roles?: MachineryRole[];
}
