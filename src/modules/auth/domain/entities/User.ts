import { generateUuid } from '../../../../shared/utils/uuid';
import { isValidPhone } from '../../../../shared/utils/validation';

/**
 * Entidad de dominio User que representa un usuario del sistema
 * Encapsula la lógica de negocio y reglas de validación para usuarios
 */
export class User {
  public readonly id: string;
  public readonly roleId: string;
  public name: string;
  public readonly email: string;
  public phone: string;
  public password: string;
  public isActive: boolean;
  public profilePicture?: string;
  public readonly createdAt: Date;
  public updatedAt: Date;

  /**
   * Constructor privado para crear instancias de User con validaciones
   * @param id - ID único del usuario
   * @param roleId - ID del rol asignado al usuario
   * @param name - Nombre completo del usuario
   * @param email - Dirección de correo electrónico
   * @param phone - Número de teléfono del usuario
   * @param password - Contraseña hasheada del usuario
   * @param isActive - Estado de activación de la cuenta
   * @param profilePicture - URL de foto de perfil (opcional)
   * @param createdAt - Fecha de creación (opcional, default: now)
   * @param updatedAt - Fecha de actualización (opcional, default: now)
   * @throws Error si los datos no cumplen las validaciones de negocio
   */
  constructor(
    id: string,
    roleId: string,
    name: string,
    email: string,
    phone: string,
    password: string,
    isActive: boolean,
    profilePicture?: string,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    // Validaciones
    if (!name || name.trim() === '') {
      throw new Error('User name cannot be empty');
    }

    if (!phone || phone.trim() === '') {
      throw new Error('Phone cannot be empty');
    }

    if (!isValidPhone(phone)) {
      throw new Error('Invalid phone format');
    }

    this.id = id;
    this.roleId = roleId;
    this.name = name.trim();
    this.email = email;
    this.phone = phone;
    this.password = password;
    this.isActive = isActive;
    this.profilePicture = profilePicture;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }

  /**
   * Factory method para crear un nuevo usuario
   * @param roleId - ID del rol a asignar
   * @param name - Nombre completo del usuario
   * @param email - Dirección de correo electrónico
   * @param phone - Número de teléfono
   * @param password - Contraseña hasheada
   * @param profilePicture - URL de foto de perfil (opcional)
   * @returns Nueva instancia de User con ID generado y estado activo
   * @throws Error si los datos no son válidos
   */
  static create(
    roleId: string,
    name: string,
    email: string,
    phone: string,
    password: string,
    profilePicture?: string,
  ): User {
    return new User(
      generateUuid(),
      roleId,
      name,
      email,
      phone,
      password,
      true, // Active by default
      profilePicture,
    );
  }

  /**
   * Activa la cuenta del usuario
   * @description Cambia el estado a activo y actualiza la fecha de modificación
   */
  activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  /**
   * Desactiva la cuenta del usuario
   * @description Cambia el estado a inactivo y actualiza la fecha de modificación
   */
  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  /**
   * Actualiza datos del perfil del usuario
   * @param name - Nuevo nombre (opcional)
   * @param phone - Nuevo teléfono (opcional)
   * @param profilePicture - Nueva foto de perfil (opcional)
   * @throws Error si los nuevos datos no son válidos
   * @description Valida y actualiza campos del perfil, excluye credenciales
   */
  updateProfile(name?: string, phone?: string, profilePicture?: string): void {
    if (name !== undefined) {
      if (!name || name.trim() === '') {
        throw new Error('User name cannot be empty');
      }
      this.name = name.trim();
    }

    if (phone !== undefined) {
      if (!phone || phone.trim() === '') {
        throw new Error('Phone cannot be empty');
      }
      if (!isValidPhone(phone)) {
        throw new Error('Invalid phone format');
      }
      this.phone = phone;
    }

    if (profilePicture !== undefined) {
      this.profilePicture = profilePicture;
    }

    this.updatedAt = new Date();
  }

  /**
   * Actualiza la contraseña del usuario
   * @param hashedPassword - Nueva contraseña ya hasheada
   * @description Actualiza la contraseña y la fecha de modificación
   */
  updatePassword(hashedPassword: string): void {
    this.password = hashedPassword;
    this.updatedAt = new Date();
  }

  /**
   * Convierte la entidad a formato de persistencia
   * @returns Objeto plano con los datos del usuario para almacenamiento
   * @description Serializa la entidad para guardar en base de datos
   */
  toPersistence() {
    return {
      id: this.id,
      roleId: this.roleId,
      name: this.name,
      email: this.email,
      phone: this.phone,
      password: this.password,
      isActive: this.isActive,
      profilePicture: this.profilePicture,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
