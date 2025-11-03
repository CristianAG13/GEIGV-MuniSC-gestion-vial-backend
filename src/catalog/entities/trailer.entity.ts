import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

export type TipoMaquinaria = 'vagoneta' | 'cabezal';
export type CategoriaCarreta = 'carreta' | 'material';
export type MaterialTipo = 'desecho' | 'plataforma';

@Entity('carretas')
@Unique(['placa'])
export class Trailer {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ length: 32 })
  placa: string;

  @Index()
  @Column({ type: 'enum', enum: ['vagoneta', 'cabezal'] })
  tipoMaquinaria: TipoMaquinaria;

  @Index()
  @Column({ type: 'enum', enum: ['carreta', 'material'] })
  categoria: CategoriaCarreta;

  // Solo obligatorio cuando (tipoMaquinaria='cabezal' && categoria='material')
  @Index()
  @Column({
    type: 'enum',
    enum: ['desecho', 'plataforma'],
    nullable: true,
  })
  materialTipo: MaterialTipo | null;

  @Column({ type: 'tinyint', default: 1 })
  activa: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
