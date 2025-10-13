import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('catalog_source') // nombre de tabla
export class Source {
  @PrimaryGeneratedColumn()
  id!: number;

  // enum 'rio' | 'tajo'
  @Column({ type: 'enum', enum: ['rio', 'tajo'] })
  tipo!: 'rio' | 'tajo';

  // único por nombre
  @Index({ unique: true })
  @Column({ length: 160 })
  nombre!: string;

  @Column({ default: true })
  activo!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
