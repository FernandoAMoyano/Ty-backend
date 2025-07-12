import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { RoleRepository } from '../../domain/repositories/Rol';
import { UserRepository } from '../../domain/repositories/User';
import { UserDto } from '../dto/Response/UserDto';

/**
 * Caso de uso para obtener el perfil completo de un usuario
 * Recupera y estructura los datos del usuario incluyendo información del rol
 */
export class GetUserProfile {
  constructor(
    private userRepository: UserRepository,
    private roleRepository: RoleRepository,
  ) {}

  /**
   * Ejecuta la obtención del perfil de usuario
   * @param userId - ID único del usuario a consultar
   * @returns Promise con los datos completos del perfil del usuario
   * @throws NotFoundError si el usuario o su rol no existen
   * @description Busca el usuario por ID, obtiene su rol asociado y retorna datos estructurados
   */
  async execute(userId: string): Promise<UserDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }

    const role = await this.roleRepository.findById(user.roleId);
    if (!role) {
      throw new NotFoundError('Role', user.roleId);
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isActive: user.isActive,
      profilePicture: user.profilePicture,
      role: {
        id: role.id,
        name: role.name,
        description: role.description,
      },
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
