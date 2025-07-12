import { PrismaClient } from '@prisma/client';
import { Role } from '../../domain/entities/Role';
import { RoleRepository } from '../../domain/repositories/Rol';
import { RoleName } from '@prisma/client';

/**
 * Implementación de RoleRepository usando Prisma ORM
 * Proporciona persistencia de datos de roles en base de datos relacional
 */
export class PrismaRoleRepository implements RoleRepository {
  /**
   * Constructor que inyecta el cliente Prisma
   * @param prisma - Cliente Prisma para acceso a base de datos
   */
  constructor(private prisma: PrismaClient) {}

  /**
   * Busca un rol por su ID único en la base de datos
   * @param id - ID único del rol
   * @returns Promise que resuelve con el rol encontrado o null si no existe
   * @description Mapea datos de Prisma a entidad de dominio Role
   */
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

  /**
   * Busca un rol por su nombre en la base de datos
   * @param name - Nombre del rol según enum RoleName
   * @returns Promise que resuelve con el rol encontrado o null si no existe
   * @description Usa el índice único de name para búsqueda eficiente
   */
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

  /**
   * Obtiene todos los roles de la base de datos
   * @returns Promise con lista de roles ordenados por fecha de creación
   * @description Ordena por createdAt ascendente (orden de creación)
   */
  async findAll(): Promise<Role[]> {
    const rolesData = await this.prisma.role.findMany({
      orderBy: { createdAt: 'asc' },
    });

    return rolesData.map(
      (roleData) =>
        new Role(
          roleData.id,
          roleData.name as RoleName,
          roleData.description || undefined,
          roleData.createdAt,
        ),
    );
  }

  /**
   * Guarda un nuevo rol en la base de datos
   * @param role - Entidad Role a persistir
   * @returns Promise con el rol guardado
   * @description Mapea entidad de dominio a modelo Prisma y viceversa
   */
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

  /**
   * Actualiza un rol existente en la base de datos
   * @param role - Entidad Role con datos actualizados
   * @returns Promise con el rol actualizado
   * @description Solo actualiza description ya que name es inmutable
   */
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

  /**
   * Elimina un rol de la base de datos
   * @param id - ID del rol a eliminar
   * @returns Promise que se resuelve cuando la eliminación es exitosa
   * @warning Verificar que no existan usuarios con este rol antes de eliminar
   */
  async delete(id: string): Promise<void> {
    await this.prisma.role.delete({
      where: { id },
    });
  }
}
