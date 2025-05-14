import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinColumn,
} from 'typeorm';
import { Category } from './Category';
import { Stylist } from './Stylist';
import { Appointment } from './Appointment';

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, nullable: false })
  name: string;

  @Column({ length: 255, nullable: false })
  description: string;

  @Column('int', { nullable: false })
  duration: number;

  @Column('int', { default: 0, nullable: false })
  durationVariation: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: false })
  price: number;

  @Column({ default: true, nullable: false })
  isActive: boolean;

  @CreateDateColumn({ nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => Category, (category) => category.services, { nullable: false })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ nullable: false })
  categoryId: string;

  @ManyToMany(() => Stylist, (stylist) => stylist.services)
  stylists: Stylist[];

  @ManyToMany(() => Appointment, (appointment) => appointment.services)
  appointments: Appointment[];
}
