import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Holiday } from './Holiday';
import { Appointment } from './Appointment';

@Entity('schedules')
export class Schedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
    nullable: false,
  })
  dayOfWeek: string;

  @Column({ length: 5, nullable: false }) // HH:MM format
  startTime: string;

  @Column({ length: 5, nullable: false }) // HH:MM format
  endTime: string;

  @CreateDateColumn({ nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => Holiday, (holiday) => holiday.schedules, { nullable: true })
  @JoinColumn({ name: 'holidayId' })
  holiday: Holiday;

  @Column({ nullable: true })
  holidayId: string;

  @OneToMany(() => Appointment, (appointment) => appointment.schedule)
  appointments: Appointment[];
}
