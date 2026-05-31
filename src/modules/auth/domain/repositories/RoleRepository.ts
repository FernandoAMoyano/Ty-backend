import { RoleName } from '@prisma/client';
import { Role } from '../entities/Role';

/**
 * Interfaz del repositorio para operaciones de persistencia de roles
 * Define el contrato para acceso a datos de roles del sistema
 */
export interface RoleRepository {
  /**
   * Busca un rol por su ID único
   * @param id - ID único del rol
   * @returns Promise que resuelve con el rol encontrado o null si no existe
   */
  findById(id: string): Promise<Role | null>;
  /**
   * Busca un rol por su nombre
   * @param name - Nombre del rol según enum RoleName
   * @returns Promise que resuelve con el rol encontrado o null si no existe
   */
  findByName(name: RoleName): Promise<Role | null>;
  /**
   * Obtiene todos los roles disponibles en el sistema
   * @returns Promise que resuelve con la lista completa de roles
   */
  findAll(): Promise<Role[]>;
  /**
   * Guarda un nuevo rol en el repositorio
   * @param role - Entidad Role a persistir
   * @returns Promise que resuelve con el rol guardado incluyendo ID generado
   */
  save(role: Role): Promise<Role>;
  /**
   * Actualiza un rol existente en el repositorio
   * @param role - Entidad Role con datos actualizados
   * @returns Promise que resuelve con el rol actualizado
   */
  update(role: Role): Promise<Role>;
  /**
   * Elimina un rol del repositorio
   * @param id - ID único del rol a eliminar
   * @returns Promise que se resuelve cuando la eliminación es exitosa
   */
  delete(id: string): Promise<void>;
}
