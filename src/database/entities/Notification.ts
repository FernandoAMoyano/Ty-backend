import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';
import { NotificationStatus } from './NotificationStatus';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: [
      'APPOINTMENT_CONFIRMATION',
      'APPOINTMENT_REMINDER',
      'APPOINTMENT_CANCELLATION',
      'PROMOTIONAL',
      'SYSTEM',
    ],
    nullable: false,
  })
  type: string;

  @Column({ length: 255, nullable: false })
  message: string;

  @Column('timestamp', { nullable: true })
  sentAt: Date;

  @CreateDateColumn({ nullable: false })
  createdAt: Date;

  // Relaciones
  @ManyToOne(() => User, (user) => user.notifications, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: false })
  userId: string;

  @ManyToOne(() => NotificationStatus, (status) => status.notifications, { nullable: false })
  @JoinColumn({ name: 'statusId' })
  status: NotificationStatus;

  @Column({ nullable: false })
  statusId: string;
}
