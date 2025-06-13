import { generateUuid } from '../../../../shared/utils/uuid';
import { isValidPhone } from '../../../../shared/utils/validation';

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

  activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

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

  updatePassword(hashedPassword: string): void {
    this.password = hashedPassword;
    this.updatedAt = new Date();
  }

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
