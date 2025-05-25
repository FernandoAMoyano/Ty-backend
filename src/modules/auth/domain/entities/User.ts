import { generateUuid } from '../../../../shared/utils/uuid';

export class User {
  constructor(
    public id: string,
    public roleId: string,
    public name: string,
    public email: string,
    public phone: string,
    public password: string, // Ya hasheado
    public isActive: boolean = true,
    public profilePicture?: string,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
  ) {}

  static create(
    roleId: string,
    name: string,
    email: string,
    phone: string,
    hashedPassword: string,
    profilePicture?: string,
  ): User {
    return new User(
      generateUuid(),
      roleId,
      name,
      email,
      phone,
      hashedPassword,
      true,
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
    if (name) this.name = name;
    if (phone) this.phone = phone;
    if (profilePicture !== undefined) this.profilePicture = profilePicture;
    this.updatedAt = new Date();
  }

  updatePassword(hashedPassword: string): void {
    this.password = hashedPassword;
    this.updatedAt = new Date();
  }
}
