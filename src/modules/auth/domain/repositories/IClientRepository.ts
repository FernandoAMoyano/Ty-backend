import { Client } from '../entities/Client';

/**
 * Interfaz del repositorio para la gestión de persistencia de clientes
 * Define todos los métodos necesarios para operaciones CRUD y consultas específicas de clientes
 */
export interface IClientRepository {
  findById(id: string): Promise<Client | null>;
  findByUserId(userId: string): Promise<Client | null>;
  findAll(): Promise<Client[]>;
  save(client: Client): Promise<Client>;
  update(client: Client): Promise<Client>;
  delete(id: string): Promise<void>;
  existsById(id: string): Promise<boolean>;
  existsByUserId(userId: string): Promise<boolean>;
}
