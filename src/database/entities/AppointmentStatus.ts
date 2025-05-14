import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Appointment } from './Appointment';

@Entity('appointment_statuses')
export class AppointmentStatus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, nullable: false })
  name: string;

  @Column({ length: 255, nullable: true })
  description: string;

  // Relaciones
  @OneToMany(() => Appointment, (appointment) => appointment.status)
  appointments: Appointment[];
}
