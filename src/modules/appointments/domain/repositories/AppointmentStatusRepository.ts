import { AppointmentStatus } from '../entities/AppointmentStatus';

export interface AppointmentStatusRepository {
  // Operaciones básicas de crud
  findById(id: string): Promise<AppointmentStatus | null>;
  findByName(name: string): Promise<AppointmentStatus | null>;
  findAll(): Promise<AppointmentStatus[]>;
  save(status: AppointmentStatus): Promise<AppointmentStatus>;
  update(status: AppointmentStatus): Promise<AppointmentStatus>;
  delete(id: string): Promise<void>;

  // Controles de existencia
  existsById(id: string): Promise<boolean>;
  existsByName(name: string): Promise<boolean>;

  // Consultas de negocios
  findTerminalStatuses(): Promise<AppointmentStatus[]>;
  findActiveStatuses(): Promise<AppointmentStatus[]>;
}
