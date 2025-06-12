import { PrismaClient } from '@prisma/client';
import { Role } from '../../domain/entities/Role';
import { RoleRepository } from '../../domain/repositories/Rol';

// Enum local temporal
enum RoleName {
  ADMIN,
  CLIENT,
  STYLIST,
  RECEPTIONIST = 'RECEPTIONIST',
}

export class PrismaRoleRepository implements RoleRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Role | null> {
    const roleData = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!roleData) return null;

    return new Role(
      roleData.id,
      roleData.name as RoleName,
      roleData.description || undefined,
      roleData.createdAt,
    );
  }

  async findByName(name: RoleName): Promise<Role | null> {
    const roleData = await this.prisma.role.findUnique({
      where: { name },
    });

    if (!roleData) return null;

    return new Role(
      roleData.id,
      roleData.name as RoleName,
      roleData.description || undefined,
      roleData.createdAt,
    );
  }

  async findAll(): Promise<Role[]> {
    const rolesData = await this.prisma.role.findMany({
      orderBy: { createdAt: 'asc' },
    });

    return rolesData.map(
      (roleData: Role) =>
        new Role(
          roleData.id,
          roleData.name as RoleName,
          roleData.description || undefined,
          roleData.createdAt,
        ),
    );
  }

  async save(role: Role): Promise<Role> {
    const roleData = await this.prisma.role.create({
      data: {
        id: role.id,
        name: role.name,
        description: role.description,
        createdAt: role.createdAt,
      },
    });

    return new Role(
      roleData.id,
      roleData.name as RoleName,
      roleData.description || undefined,
      roleData.createdAt,
    );
  }

  async update(role: Role): Promise<Role> {
    const roleData = await this.prisma.role.update({
      where: { id: role.id },
      data: {
        description: role.description,
      },
    });

    return new Role(
      roleData.id,
      roleData.name as RoleName,
      roleData.description || undefined,
      roleData.createdAt,
    );
  }

  async delete(id: string): Promise<void> {
    await this.prisma.role.delete({
      where: { id },
    });
  }
}
