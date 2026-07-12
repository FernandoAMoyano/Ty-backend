import { JwtService, JwtPayload } from '../services/JwtService';
import { UnauthorizedError } from '../../../../shared/exceptions/UnauthorizedError';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { LoginResponseDto } from '../dto/response/LoginResponseDto';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IRoleRepository } from '../../domain/repositories/IRoleRepository';

/**
 * Caso de uso para renovar tokens de acceso usando un refresh token
 * Valida el refresh token y genera nuevos tokens de acceso y renovación
 */
export class RefreshToken {
  constructor(
    private userRepository: IUserRepository,
    private roleRepository: IRoleRepository,
    private jwtService: JwtService,
  ) {}

  /**
   * Ejecuta el proceso de renovación de tokens
   * @param refreshToken - Token de renovación válido del usuario
   * @returns Promise con nuevos tokens y datos actualizados del usuario
   * @throws UnauthorizedError si el refresh token es inválido, expirado o el usuario está inactivo
   * @throws NotFoundError si el usuario o rol asociado no existen
   * @description Verifica el refresh token, valida el estado del usuario y genera nuevos tokens.
   * No hay catch-all: JwtTokenService ya lanza UnauthorizedError (no un Error genérico) cuando el
   * token es inválido, así que no hace falta convertir nada acá. Cualquier error inesperado (p.ej.
   * de base de datos) se propaga tal cual y termina en 500 vía el ErrorHandler global, en vez de
   * enmascararse como 401.
   */
  async execute(refreshToken: string): Promise<LoginResponseDto> {
    const payload = this.jwtService.verifyRefreshToken(refreshToken);

    const user = await this.userRepository.findById(payload.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const role = await this.roleRepository.findById(user.roleId);
    if (!role) {
      throw new NotFoundError('Role', user.roleId);
    }

    const newJwtPayload: JwtPayload = {
      userId: user.id,
      roleId: user.roleId,
      email: user.email,
    };

    const newToken = this.jwtService.generateAccessToken(newJwtPayload);
    const newRefreshToken = this.jwtService.generateRefreshToken(newJwtPayload);

    return {
      token: newToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isActive: user.isActive,
        profilePicture: user.profilePicture,
        preferences: user.preferences,
        role: {
          id: role.id,
          name: role.name,
          description: role.description,
        },
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }
}
