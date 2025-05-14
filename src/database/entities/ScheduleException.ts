import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Holiday } from './Holiday';

@Entity('schedule_exceptions')
export class ScheduleException {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('date', { nullable: false })
  exceptionDate: Date;

  @Column({ length: 5, nullable: false }) // HH:MM format
  startTimeException: string;

  @Column({ length: 5, nullable: false }) // HH:MM format
  endTimeException: string;

  @Column({ length: 255, nullable: true })
  reason: string;

  @CreateDateColumn({ nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => Holiday, (holiday) => holiday.exceptions, { nullable: true })
  @JoinColumn({ name: 'holidayId' })
  holiday: Holiday;

  @Column({ nullable: true })
  holidayId: string;
}
