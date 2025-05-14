import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Schedule } from './Schedule';
import { ScheduleException } from './ScheduleException';

@Entity('holidays')
export class Holiday {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, nullable: false })
  name: string;

  @Column('date', { nullable: false })
  date: Date;

  @Column({ length: 255, nullable: true })
  description: string;

  @CreateDateColumn({ nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt: Date;

  // Relaciones
  @OneToMany(() => Schedule, (schedule) => schedule.holiday)
  schedules: Schedule[];

  @OneToMany(() => ScheduleException, (exception) => exception.holiday)
  exceptions: ScheduleException[];
}
