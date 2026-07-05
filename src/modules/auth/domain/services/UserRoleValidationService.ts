import { RoleName } from '@prisma/client';
import { IUserRepository } from '../repositories/IUserRepository';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { BusinessRuleError } from '../../../../shared/exceptions/BusinessRuleError';

/**
 * Servicio de dominio para validar que un usuario existe y tiene un rol especifico
 *
 * Centraliza el patron `findByIdWithRole()` + chequeo de `role.name`, que estaba
 * duplicado casi identicamente en 3 use cases (AssignServiceToStylist, CreateAppointment,
 * UpdateAppointment), cada uno con su propia variante de mensaje y tipo de excepcion.
 *
 * Contrato unico:
 * - Usuario no encontrado -> NotFoundError (404)
 * - Usuario encontrado pero con otro rol -> BusinessRuleError (422)
 */
export class UserRoleValidationService {
  constructor(private userRepository: IUserRepository) {}

  /**
   * Verifica que un usuario exista y tenga el rol especificado
   * @param userId - User.id a validar
   * @param roleName - Rol requerido (ADMIN, CLIENT o STYLIST)
   * @throws NotFoundError si el usuario no existe
   * @throws BusinessRuleError si el usuario existe pero no tiene el rol requerido
   */
  async ensureUserHasRole(userId: string, roleName: RoleName): Promise<void> {
    const userWithRole = await this.userRepository.findByIdWithRole(userId);

    if (!userWithRole) {
      throw new NotFoundError(this.capitalize(roleName), userId);
    }

    if (!userWithRole.role || userWithRole.role.name !== roleName) {
      throw new BusinessRuleError(`The specified user is not a ${roleName.toLowerCase()}`);
    }
  }

  /**
   * Capitaliza un RoleName para usarlo como label legible (ej. 'STYLIST' -> 'Stylist')
   * @param roleName - Rol a formatear
   * @returns Label capitalizado
   */
  private capitalize(roleName: RoleName): string {
    return roleName.charAt(0) + roleName.slice(1).toLowerCase();
  }
}
