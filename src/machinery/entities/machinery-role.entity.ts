import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique, Index } from 'typeorm';
import { Machinery } from './machinery.entity';

@Entity('machinery_roles')
@Index('uniq_machinery_role', ['machinery', 'rol'], { unique: true })
export class MachineryRole {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  rol: string; // 'material' | 'carreta' | 'cisterna' | ...

  @ManyToOne(() => Machinery, (m) => m.roles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'machineryId' }) // nombre de columna FK en DB
  machinery: Machinery;                // nombre de la PROPIEDAD en el entity
}


