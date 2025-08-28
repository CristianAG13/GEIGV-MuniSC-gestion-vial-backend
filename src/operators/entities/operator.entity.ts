import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  OneToOne, 
  JoinColumn,
  CreateDateColumn, 
  UpdateDateColumn 
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('operators')
export class Operator {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255 })
  last: string;

  @Column({ length: 20, unique: true })
  identification: string;

  @Column({ length: 20 })
  phoneNumber: string;
  
  @Column({ nullable: true })
  userId: number;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;

  // Relación con User (opcional)
  @OneToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;
}
