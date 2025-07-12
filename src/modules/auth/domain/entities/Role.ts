import { RoleName } from '@prisma/client';
import { generateUuid } from '../../../../shared/utils/uuid';

/**
 * Entidad de dominio Role que representa un rol de usuario en el sistema
 * Define permisos y funcionalidades disponibles para diferentes tipos de usuarios
 */
export class Role {
  /**
   * Constructor para crear una instancia de Role
   * @param id - ID único del rol
   * @param name - Nombre del rol según enum RoleName
   * @param description - Descripción del rol y permisos (opcional)
   * @param createdAt - Fecha de creación (default: now)
   */
  constructor(
    public id: string,
    public name: RoleName,
    public description?: string,
    public createdAt: Date = new Date(),
  ) {}

  /**
   * Factory method para crear un nuevo rol
   * @param name - Nombre del rol según enum RoleName
   * @param description - Descripción del rol (opcional)
   * @returns Nueva instancia de Role con ID generado
   */
  static create(name: RoleName, description?: string): Role {
    return new Role(generateUuid(), name, description);
  }

  /**
   * Factory method para crear Role desde datos de persistencia
   * @param id - ID del rol existente
   * @param name - Nombre del rol
   * @param description - Descripción del rol (opcional)
   * @param createdAt - Fecha de creación (opcional)
   * @returns Instancia de Role con datos de base de datos
   */
  static fromPersistence(id: string, name: RoleName, description?: string, createdAt?: Date): Role {
    return new Role(id, name, description, createdAt);
  }

  /**
   * Verifica si el rol es de tipo ADMIN
   * @returns true si el rol es ADMIN, false en caso contrario
   */
  isAdmin(): boolean {
    return this.name === RoleName.ADMIN;
  }

  /**
   * Verifica si el rol es de tipo STYLIST
   * @returns true si el rol es STYLIST, false en caso contrario
   */
  isStylist(): boolean {
    return this.name === RoleName.STYLIST;
  }

  /**
   * Verifica si el rol es de tipo CLIENT
   * @returns true si el rol es CLIENT, false en caso contrario
   */
  isClient(): boolean {
    return this.name === RoleName.CLIENT;
  }

  /**
   * Convierte la entidad a formato de persistencia
   * @returns Objeto plano con los datos del rol para almacenamiento
   * @description Serializa la entidad para guardar en base de datos
   */
  toPersistence() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      createdAt: this.createdAt,
    };
  }
}
