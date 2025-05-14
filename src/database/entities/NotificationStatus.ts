import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Notification } from './Notification';

@Entity('notification_statuses')
export class NotificationStatus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, nullable: false })
  name: string;

  @Column({ length: 255, nullable: true })
  description: string;

  // Relaciones
  @OneToMany(() => Notification, (notification) => notification.status)
  notifications: Notification[];
}
