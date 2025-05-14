import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinColumn,
  JoinTable,
} from 'typeorm';
import { User } from './User';
import { Service } from './Service';
import { Appointment } from './Appointment';

@Entity('stylists')
export class Stylist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.stylists, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: false })
  userId: string;

  @CreateDateColumn({ nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt: Date;

  // Relaciones
  @ManyToMany(() => Service, (service) => service.stylists)
  @JoinTable({
    name: 'stylist_services',
    joinColumn: { name: 'stylistId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'serviceId', referencedColumnName: 'id' },
  })
  services: Service[];

  @OneToMany(() => Appointment, (appointment) => appointment.stylist)
  appointments: Appointment[];
}
