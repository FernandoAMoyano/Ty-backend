import { RoleName } from '@prisma/client';
import { generateUuid } from '../../../../shared/utils/uuid';

export class Role {
  constructor(
    public id: string,
    public name: RoleName,
    public description?: string,
    public createdAt: Date = new Date(),
  ) {}

  static create(name: RoleName, description?: string): Role {
    return new Role(generateUuid(), name, description);
  }

  static fromPersistence(id: string, name: RoleName, description?: string, createdAt?: Date): Role {
    return new Role(id, name, description, createdAt);
  }

  isAdmin(): boolean {
    return this.name === RoleName.ADMIN;
  }

  isStylist(): boolean {
    return this.name === RoleName.STYLIST;
  }

  isClient(): boolean {
    return this.name === RoleName.CLIENT;
  }

  toPersistence() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      createdAt: this.createdAt,
    };
  }
}
