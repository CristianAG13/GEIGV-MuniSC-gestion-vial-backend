import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  JoinColumn,
  CreateDateColumn, 
  UpdateDateColumn 
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../roles/entities/role.entity';

export enum RoleRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

@Entity('role_requests')
export class RoleRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  roleId: number;

  @Column({ type: 'text' })
  justification: string;

  @Column({
    type: 'enum',
    enum: RoleRequestStatus,
    default: RoleRequestStatus.PENDING
  })
  status: RoleRequestStatus;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ nullable: true })
  reviewedBy: number;

  @Column({ type: 'datetime', nullable: true })
  reviewedAt: Date;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => User, user => user.id)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Role, role => role.id)
  @JoinColumn({ name: 'roleId' })
  requestedRole: Role;

  @ManyToOne(() => User, user => user.id, { nullable: true })
  @JoinColumn({ name: 'reviewedBy' })
  reviewer: User;
}
