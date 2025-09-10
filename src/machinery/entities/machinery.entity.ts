// import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
// import { Report } from './report.entity';
// import { MachineryRole } from './machinery-role.entity';

// @Entity('machineries')
// export class Machinery {
//   @PrimaryGeneratedColumn()
//   id: number;

//   @Column()
//   tipo: string; // vagoneta, excavadora, etc.

//   @Column()
//   placa: string;


//   @Column({ default: true })
//   esPropietaria: boolean;


//   @OneToMany(() => Report, report => report.maquinaria)
// reports: Report[];

// @OneToMany(() => MachineryRole, (r) => r.machinery, { cascade: true })
// roles?: MachineryRole[];
// }



// src/machinery/entities/machinery.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Report } from './report.entity';
import { MachineryRole } from './machinery-role.entity';

@Entity('machineries')
export class Machinery {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tipo: string;

  @Column()
  placa: string;

  @Column({ default: true })
  esPropietaria: boolean;

  @OneToMany(() => Report, (report) => report.maquinaria)
  reports: Report[];

  // ⬇️ AQUÍ ESTABA EL PROBLEMA: usa 'machinery', no 'machineryId'
  @OneToMany(() => MachineryRole, (r) => r.machinery, { cascade: true })
  roles?: MachineryRole[];
}
