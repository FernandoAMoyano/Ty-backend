import { HashService } from '../services/HashService';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { UnauthorizedError } from '../../../../shared/exceptions/UnauthorizedError';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';
import { isValidPassword } from '../../../../shared/utils/validation';
import { UserRepository } from '../../domain/repositories/User';
import { ChangePasswordDto } from '../dto/Request/ChangePasswordDto';

export class ChangeUserPassword {
  constructor(
    private userRepository: UserRepository,
    private hashService: HashService,
  ) {}

  async execute(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }

    // Verificar password actual
    const isCurrentPasswordValid = await this.hashService.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Validar nueva password
    if (!isValidPassword(changePasswordDto.newPassword)) {
      throw new ValidationError(
        'New password must be at least 8 characters long and contain uppercase, lowercase, and number',
      );
    }

    // Actualizar password
    const hashedNewPassword = await this.hashService.hash(changePasswordDto.newPassword);
    user.updatePassword(hashedNewPassword);

    await this.userRepository.update(user);
  }
}
