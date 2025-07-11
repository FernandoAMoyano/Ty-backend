import { Service } from '../entities/Service';

/**
 * Interfaz del repositorio para la gestión de persistencia de servicios
 * Define todos los métodos necesarios para operaciones CRUD y consultas específicas de servicios
 */
export interface ServiceRepository {
  /**
   * Busca un servicio por su ID único
   * @param id - ID único del servicio a buscar
   * @returns Promise que resuelve con el servicio encontrado o null si no existe
   */
  findById(id: string): Promise<Service | null>;

  /**
   * Busca un servicio por su nombre
   * @param name - Nombre del servicio a buscar
   * @returns Promise que resuelve con el servicio encontrado o null si no existe
   */
  findByName(name: string): Promise<Service | null>;

  /**
   * Obtiene todos los servicios del sistema (activos e inactivos)
   * @returns Promise que resuelve con un array de todos los servicios
   */
  findAll(): Promise<Service[]>;

  /**
   * Obtiene solo los servicios que están activos
   * @returns Promise que resuelve con un array de servicios activos
   */
  findActive(): Promise<Service[]>;

  /**
   * Busca todos los servicios que pertenecen a una categoría específica
   * @param categoryId - ID único de la categoría
   * @returns Promise que resuelve con un array de servicios de la categoría
   */
  findByCategory(categoryId: string): Promise<Service[]>;

  /**
   * Busca solo los servicios activos que pertenecen a una categoría específica
   * @param categoryId - ID único de la categoría
   * @returns Promise que resuelve con un array de servicios activos de la categoría
   */
  findActiveByCategoryId(categoryId: string): Promise<Service[]>;

  /**
   * Guarda un nuevo servicio en el sistema
   * @param service - Entidad de servicio a guardar
   * @returns Promise que resuelve con el servicio guardado (con ID asignado)
   */
  save(service: Service): Promise<Service>;

  /**
   * Actualiza un servicio existente en el sistema
   * @param service - Entidad de servicio con los datos actualizados
   * @returns Promise que resuelve con el servicio actualizado
   */
  update(service: Service): Promise<Service>;

  /**
   * Elimina un servicio del sistema de forma permanente
   * @param id - ID único del servicio a eliminar
   * @returns Promise que resuelve cuando la eliminación se completa
   */
  delete(id: string): Promise<void>;

  /**
   * Verifica si existe un servicio con el ID especificado
   * @param id - ID único del servicio a verificar
   * @returns Promise que resuelve con true si existe, false en caso contrario
   */
  existsById(id: string): Promise<boolean>;

  /**
   * Verifica si existe un servicio con el nombre especificado
   * @param name - Nombre del servicio a verificar
   * @returns Promise que resuelve con true si existe, false en caso contrario
   */
  existsByName(name: string): Promise<boolean>;
}
