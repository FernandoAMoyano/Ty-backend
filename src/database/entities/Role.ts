import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { User } from './User';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, unique: true, nullable: false })
  name: string;

  @Column({ length: 255, nullable: true })
  description: string;

  @CreateDateColumn({ nullable: false })
  createdAt: Date;

  // Relaciones
  @OneToMany(() => User, (user) => user.role)
  users: User[];
}
