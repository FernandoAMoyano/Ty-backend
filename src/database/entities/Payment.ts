import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Appointment } from './Appointment';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: false })
  amount: number;

  @Column({
    type: 'enum',
    enum: ['PENDING', 'COMPLETED', 'REFUNDED', 'FAILED'],
    nullable: false,
  })
  status: string;

  @Column({
    type: 'enum',
    enum: ['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'TRANSFER', 'ONLINE'],
    nullable: true,
  })
  method: string;

  @Column('timestamp', { nullable: true })
  paymentDate: Date;

  @CreateDateColumn({ nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => Appointment, (appointment) => appointment.payments, { nullable: false })
  @JoinColumn({ name: 'appointmentId' })
  appointment: Appointment;

  @Column({ nullable: false })
  appointmentId: string;
}
