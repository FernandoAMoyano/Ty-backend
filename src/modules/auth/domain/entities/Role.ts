import { RoleName } from '@prisma/client';
import { generateUuid } from '../../../../shared/utils/uuid';

/* export enum SystemRoles {
  ADMIN = 'ADMIN',
  STYLIST = 'STYLIST',
  CLIENT = 'CLIENT',
  RECEPTIONIST = 'RECEPTIONIST',
} */

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

  isAdmin(): boolean {
    return this.name === RoleName.ADMIN;
  }

  isStylist(): boolean {
    return this.name === RoleName.STYLIST;
  }

  isClient(): boolean {
    return this.name === RoleName.CLIENT;
  }

  /*  isReceptionist(): boolean {
    return this.name === RoleName.RECEPTIONIST;
  } */
}
