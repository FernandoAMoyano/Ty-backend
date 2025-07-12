import { HashService } from '../services/HashService';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { UnauthorizedError } from '../../../../shared/exceptions/UnauthorizedError';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';
import { isValidPassword } from '../../../../shared/utils/validation';
import { UserRepository } from '../../domain/repositories/User';
import { ChangePasswordDto } from '../dto/Request/ChangePasswordDto';

/**
 * Caso de uso para cambiar la contraseña de un usuario autenticado
 * Valida la contraseña actual, verifica la nueva y actualiza el hash almacenado
 */
export class ChangeUserPassword {
  constructor(
    private userRepository: UserRepository,
    private hashService: HashService,
  ) {}

  /**
   * Ejecuta el cambio de contraseña del usuario
   * @param userId - ID único del usuario
   * @param changePasswordDto - Datos del cambio (contraseña actual y nueva)
   * @returns Promise que se resuelve cuando la contraseña ha sido cambiada exitosamente
   * @throws NotFoundError si el usuario no existe
   * @throws UnauthorizedError si la contraseña actual es incorrecta
   * @throws ValidationError si la nueva contraseña no cumple los requisitos de seguridad
   * @description Verifica identidad con contraseña actual, valida nueva contraseña y actualiza hash
   */
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
