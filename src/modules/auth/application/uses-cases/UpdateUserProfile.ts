import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';
import { isValidPhone } from '../../../../shared/utils/validation';
import { RoleRepository } from '../../domain/repositories/Rol';
import { UserRepository } from '../../domain/repositories/User';
import { UpdateProfileDto } from '../dto/Request/UpdateProfileDto';
import { UserDto } from '../dto/Response/UserDto';

export class UpdateUserProfile {
  constructor(
    private userRepository: UserRepository,
    private roleRepository: RoleRepository,
  ) {}

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
