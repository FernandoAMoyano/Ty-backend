import { AppointmentStatus } from '../entities/AppointmentStatus';

/**
 * Interfaz del repositorio para la gestión de persistencia de estados de citas
 */
export interface IAppointmentStatusRepository {
  findById(id: string): Promise<AppointmentStatus | null>;
  findByName(name: string): Promise<AppointmentStatus | null>;
  findAll(): Promise<AppointmentStatus[]>;
  save(status: AppointmentStatus): Promise<AppointmentStatus>;
  update(status: AppointmentStatus): Promise<AppointmentStatus>;
  delete(id: string): Promise<void>;
  existsById(id: string): Promise<boolean>;
  existsByName(name: string): Promise<boolean>;
  findTerminalStatuses(): Promise<AppointmentStatus[]>;
  findActiveStatuses(): Promise<AppointmentStatus[]>;
}
