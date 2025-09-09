


// src/machinery/entities/machinery-role.entity.ts
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Machinery } from './machinery.entity';

@Entity('machinery_roles')
@Unique('uniq_machinery_role', ['machinery', 'rol'])
export class MachineryRole {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 32 })
  rol: string;

  
  @ManyToOne(() => Machinery, (m) => m.roles, { onDelete: 'CASCADE' })
  machinery: Machinery;
}

