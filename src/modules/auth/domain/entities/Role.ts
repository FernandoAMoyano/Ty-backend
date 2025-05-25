import { generateUuid } from '../../../../shared/utils/uuid';

export enum SystemRoles {
  ADMIN = 'ADMIN',
  STYLIST = 'STYLIST',
  CLIENT = 'CLIENT',
  RECEPTIONIST = 'RECEPTIONIST',
}

export class Role {
  constructor(
    public id: string,
    public name: SystemRoles,
    public description?: string,
    public createdAt: Date = new Date(),
  ) {}

  static create(name: SystemRoles, description?: string): Role {
    return new Role(generateUuid(), name, description);
  }

  isAdmin(): boolean {
    return this.name === SystemRoles.ADMIN;
  }

  isStylist(): boolean {
    return this.name === SystemRoles.STYLIST;
  }

  isClient(): boolean {
    return this.name === SystemRoles.CLIENT;
  }

  isReceptionist(): boolean {
    return this.name === SystemRoles.RECEPTIONIST;
  }
}
