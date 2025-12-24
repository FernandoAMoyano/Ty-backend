import { Client } from '../entities/Client';

/**
 * Interfaz del repositorio para la gestión de persistencia de clientes
 * Define todos los métodos necesarios para operaciones CRUD y consultas específicas de clientes
 */
export interface ClientRepository {
  /**
   * Busca un cliente por su ID único
   * @param id - ID único del cliente a buscar
   * @returns Promise que resuelve con el cliente encontrado o null si no existe
   */
  findById(id: string): Promise<Client | null>;

  /**
   * Busca un cliente por el ID del usuario asociado
   * @param userId - ID único del usuario que es cliente
   * @returns Promise que resuelve con el cliente encontrado o null si no existe
   */
  findByUserId(userId: string): Promise<Client | null>;

  /**
   * Obtiene todos los clientes del sistema
   * @returns Promise que resuelve con un array de todos los clientes
   */
  findAll(): Promise<Client[]>;

  /**
   * Guarda un nuevo cliente en el sistema
   * @param client - Entidad de cliente a guardar
   * @returns Promise que resuelve con el cliente guardado (con ID asignado)
   */
  save(client: Client): Promise<Client>;

  /**
   * Actualiza un cliente existente en el sistema
   * @param client - Entidad de cliente con los datos actualizados
   * @returns Promise que resuelve con el cliente actualizado
   */
  update(client: Client): Promise<Client>;

  /**
   * Elimina un cliente del sistema de forma permanente
   * @param id - ID único del cliente a eliminar
   * @returns Promise que resuelve cuando la eliminación se completa
   */
  delete(id: string): Promise<void>;

  /**
   * Verifica si existe un cliente con el ID especificado
   * @param id - ID único del cliente a verificar
   * @returns Promise que resuelve con true si existe, false en caso contrario
   */
  existsById(id: string): Promise<boolean>;

  /**
   * Verifica si existe un cliente asociado al usuario especificado
   * @param userId - ID único del usuario a verificar
   * @returns Promise que resuelve con true si existe, false en caso contrario
   */
  existsByUserId(userId: string): Promise<boolean>;
}
