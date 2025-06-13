import { PrismaClient } from '@prisma/client';
import { User } from '../../domain/entities/User';
import { UserRepository } from '../../domain/repositories/User';

export class PrismaUserRepository implements UserRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    const userData = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!userData) return null;

    return new User(
      userData.id,
      userData.roleId,
      userData.name,
      userData.email,
      userData.phone,
      userData.password,
      userData.isActive,
      userData.profilePicture || undefined,
      userData.createdAt,
      userData.updatedAt,
    );
  }

  async findByEmail(email: string): Promise<User | null> {
    const userData = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!userData) return null;

    return new User(
      userData.id,
      userData.roleId,
      userData.name,
      userData.email,
      userData.phone,
      userData.password,
      userData.isActive,
      userData.profilePicture || undefined,
      userData.createdAt,
      userData.updatedAt,
    );
  }

  async findByEmailWithRole(email: string): Promise<any | null> {
    const userData = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        role: true, // Incluir la relación con el rol
      },
    });

    if (!userData) return null;

    // Crear el objeto User con el rol incluido
    const user = new User(
      userData.id,
      userData.roleId,
      userData.name,
      userData.email,
      userData.phone,
      userData.password,
      userData.isActive,
      userData.profilePicture || undefined,
      userData.createdAt,
      userData.updatedAt,
    );

    // Agregar el rol como propiedad adicional
    return {
      ...user,
      role: userData.role,
    };
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { email: email.toLowerCase() },
    });
    return count > 0;
  }

  async save(user: User): Promise<User> {
    const userData = await this.prisma.user.create({
      data: {
        id: user.id,
        roleId: user.roleId,
        name: user.name,
        email: user.email.toLowerCase(),
        phone: user.phone,
        password: user.password,
        isActive: user.isActive,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });

    return new User(
      userData.id,
      userData.roleId,
      userData.name,
      userData.email,
      userData.phone,
      userData.password,
      userData.isActive,
      userData.profilePicture || undefined,
      userData.createdAt,
      userData.updatedAt,
    );
  }

  async update(user: User): Promise<User> {
    const userData = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        name: user.name,
        phone: user.phone,
        password: user.password,
        isActive: user.isActive,
        profilePicture: user.profilePicture,
        updatedAt: user.updatedAt,
      },
    });

    return new User(
      userData.id,
      userData.roleId,
      userData.name,
      userData.email,
      userData.phone,
      userData.password,
      userData.isActive,
      userData.profilePicture || undefined,
      userData.createdAt,
      userData.updatedAt,
    );
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }

  async findAll(): Promise<User[]> {
    const usersData = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return usersData.map(
      (userData: any) =>
        new User(
          userData.id,
          userData.roleId,
          userData.name,
          userData.email,
          userData.phone,
          userData.password,
          userData.isActive,
          userData.profilePicture || undefined,
          userData.createdAt,
          userData.updatedAt,
        ),
    );
  }

  async findByRole(roleId: string): Promise<User[]> {
    const usersData = await this.prisma.user.findMany({
      where: { roleId },
      orderBy: { createdAt: 'desc' },
    });

    return usersData.map(
      (userData: any) =>
        new User(
          userData.id,
          userData.roleId,
          userData.name,
          userData.email,
          userData.phone,
          userData.password,
          userData.isActive,
          userData.profilePicture || undefined,
          userData.createdAt,
          userData.updatedAt,
        ),
    );
  }
}
