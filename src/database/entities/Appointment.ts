import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { User } from './User';
import { Client } from './Client';
import { Stylist } from './Stylist';
import { Service } from './Service';
import { Schedule } from './Schedule';
import { AppointmentStatus } from './AppointmentStatus';
import { Payment } from './Payment';

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.appointments, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: false })
  userId: string;

  @ManyToOne(() => Client, (client) => client.appointments, { nullable: false })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @Column({ nullable: false })
  clientId: string;

  @ManyToOne(() => Stylist, (stylist) => stylist.appointments, { nullable: true })
  @JoinColumn({ name: 'stylistId' })
  stylist: Stylist;

  @Column({ nullable: true })
  stylistId: string;

  @ManyToMany(() => Service, (service) => service.appointments, { nullable: false })
  @JoinTable({
    name: 'appointment_services',
    joinColumn: { name: 'appointmentId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'serviceId', referencedColumnName: 'id' },
  })
  services: Service[];

  @ManyToOne(() => Schedule, (schedule) => schedule.appointments, { nullable: false })
  @JoinColumn({ name: 'scheduleId' })
  schedule: Schedule;

  @Column({ nullable: false })
  scheduleId: string;

  @ManyToOne(() => AppointmentStatus, (status) => status.appointments, { nullable: false })
  @JoinColumn({ name: 'statusId' })
  status: AppointmentStatus;

  @Column({ nullable: false })
  statusId: string;

  @Column('timestamp', { nullable: false })
  dateTime: Date;

  @Column('int', { nullable: false })
  duration: number;

  @Column('timestamp', { nullable: true })
  confirmedAt: Date;

  @CreateDateColumn({ nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt: Date;

  // Relaciones
  @OneToMany(() => Payment, (payment) => payment.appointment)
  payments: Payment[];
}
