import { User } from '../entities/User';

/**
 * Interfaz del repositorio para operaciones de persistencia de usuarios
 * Define el contrato para acceso a datos de usuarios sin exponer detalles de implementación
 */
export interface UserRepository {
  /**
   * Busca un usuario por su ID único
   * @param id - ID único del usuario
   * @returns Promise que resuelve con el usuario encontrado o null si no existe
   */
  findById(id: string): Promise<User | null>;
  /**
   * Busca un usuario por su ID incluyendo información de su rol
   * @param id - ID único del usuario
   * @returns Promise que resuelve con el usuario y rol encontrados o null si no existe
   * @description Útil para validaciones de rol
   */
  findByIdWithRole(id: string): Promise<any | null>;
  /**
   * Busca un usuario por su dirección de email
   * @param email - Dirección de correo electrónico del usuario
   * @returns Promise que resuelve con el usuario encontrado o null si no existe
   */
  findByEmail(email: string): Promise<User | null>;
  /**
   * Busca un usuario por email incluyendo información de su rol
   * @param email - Dirección de correo electrónico del usuario
   * @returns Promise que resuelve con el usuario y rol encontrados o null si no existe
   * @description Útil para operaciones de autenticación que requieren datos del rol
   */
  findByEmailWithRole(email: string): Promise<any | null>;
  /**
   * Verifica si existe un usuario con el email especificado
   * @param email - Dirección de correo electrónico a verificar
   * @returns Promise que resuelve con true si existe, false si no
   * @description Útil para validaciones de unicidad durante el registro
   */
  existsByEmail(email: string): Promise<boolean>;
  /**
   * Guarda un nuevo usuario en el repositorio
   * @param user - Entidad User a persistir
   * @returns Promise que resuelve con el usuario guardado incluyendo ID generado
   */
  save(user: User): Promise<User>;
  /**
   * Actualiza un usuario existente en el repositorio
   * @param user - Entidad User con datos actualizados
   * @returns Promise que resuelve con el usuario actualizado
   */
  update(user: User): Promise<User>;
  /**
   * Elimina un usuario del repositorio
   * @param id - ID único del usuario a eliminar
   * @returns Promise que se resuelve cuando la eliminación es exitosa
   */
  delete(id: string): Promise<void>;
  /**
   * Obtiene todos los usuarios del repositorio
   * @returns Promise que resuelve con la lista completa de usuarios
   */
  findAll(): Promise<User[]>;
  /**
   * Busca usuarios por rol asignado
   * @param roleId - ID del rol a filtrar
   * @returns Promise que resuelve con la lista de usuarios del rol especificado
   */
  findByRole(roleId: string): Promise<User[]>;
}
