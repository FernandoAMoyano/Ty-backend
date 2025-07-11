import { Stylist } from '../entities/Stylist';

/**
 * Interfaz del repositorio para la gestión de persistencia de estilistas
 * Define todos los métodos necesarios para operaciones CRUD y consultas específicas de estilistas
 */
export interface StylistRepository {
  /**
   * Busca un estilista por su ID único
   * @param id - ID único del estilista a buscar
   * @returns Promise que resuelve con el estilista encontrado o null si no existe
   */
  findById(id: string): Promise<Stylist | null>;

  /**
   * Busca un estilista por el ID del usuario asociado
   * @param userId - ID único del usuario que es estilista
   * @returns Promise que resuelve con el estilista encontrado o null si no existe
   */
  findByUserId(userId: string): Promise<Stylist | null>;

  /**
   * Obtiene todos los estilistas del sistema
   * @returns Promise que resuelve con un array de todos los estilistas
   */
  findAll(): Promise<Stylist[]>;

  /**
   * Guarda un nuevo estilista en el sistema
   * @param stylist - Entidad de estilista a guardar
   * @returns Promise que resuelve con el estilista guardado (con ID asignado)
   */
  save(stylist: Stylist): Promise<Stylist>;

  /**
   * Actualiza un estilista existente en el sistema
   * @param stylist - Entidad de estilista con los datos actualizados
   * @returns Promise que resuelve con el estilista actualizado
   */
  update(stylist: Stylist): Promise<Stylist>;

  /**
   * Elimina un estilista del sistema de forma permanente
   * @param id - ID único del estilista a eliminar
   * @returns Promise que resuelve cuando la eliminación se completa
   */
  delete(id: string): Promise<void>;

  /**
   * Verifica si existe un estilista con el ID especificado
   * @param id - ID único del estilista a verificar
   * @returns Promise que resuelve con true si existe, false en caso contrario
   */
  existsById(id: string): Promise<boolean>;
}
