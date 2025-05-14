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
import { Role } from './Role';
import { Client } from './Client';
import { Stylist } from './Stylist';
import { Appointment } from './Appointment';
import { Notification } from './Notification';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, nullable: false })
  name: string;

  @Column({ length: 100, unique: true, nullable: false })
  email: string;

  @Column({ length: 20, nullable: false })
  phone: string;

  @Column({ nullable: false })
  password: string; // Será almacenado como hash

  @Column({ default: true, nullable: false })
  isActive: boolean;

  @Column({ length: 255, nullable: true })
  profilePicture: string;

  @CreateDateColumn({ nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => Role, (role) => role.users, { nullable: false })
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @Column({ nullable: false })
  roleId: string;

  @OneToMany(() => Client, (client) => client.user)
  clients: Client[];

  @OneToMany(() => Stylist, (stylist) => stylist.user)
  stylists: Stylist[];

  @OneToMany(() => Appointment, (appointment) => appointment.user)
  appointments: Appointment[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];
}
