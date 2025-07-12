import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';
import { isValidPhone } from '../../../../shared/utils/validation';
import { RoleRepository } from '../../domain/repositories/Rol';
import { UserRepository } from '../../domain/repositories/User';
import { UpdateProfileDto } from '../dto/Request/UpdateProfileDto';
import { UserDto } from '../dto/Response/UserDto';

/**
 * Caso de uso para actualizar el perfil de un usuario existente
 * Valida y actualiza datos del perfil como nombre, teléfono y foto de perfil
 */
export class UpdateUserProfile {
  constructor(
    private userRepository: UserRepository,
    private roleRepository: RoleRepository,
  ) {}

  /**
   * Ejecuta la actualización del perfil de usuario
   * @param userId - ID único del usuario a actualizar
   * @param updateDto - Datos parciales a actualizar en el perfil
   * @returns Promise con los datos actualizados del usuario
   * @throws NotFoundError si el usuario no existe
   * @throws ValidationError si los nuevos datos no son válidos
   * @description Valida datos de entrada, actualiza la entidad usuario y retorna datos actualizados
   */
  async execute(userId: string, updateDto: UpdateProfileDto): Promise<UserDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }

    // Validaciones
    if (updateDto.name && updateDto.name.trim().length === 0) {
      throw new ValidationError('Name cannot be empty');
    }

    if (updateDto.phone && !isValidPhone(updateDto.phone)) {
      throw new ValidationError('Invalid phone format');
    }

    // Actualizar usuario
    user.updateProfile(updateDto.name?.trim(), updateDto.phone, updateDto.profilePicture);

    const updatedUser = await this.userRepository.update(user);

    const role = await this.roleRepository.findById(user.roleId);

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      isActive: updatedUser.isActive,
      profilePicture: updatedUser.profilePicture,
      role: {
        id: role!.id,
        name: role!.name,
        description: role!.description,
      },
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };
  }
}
