import { JwtService, JwtPayload } from '../services/JwtService';
import { UnauthorizedError } from '../../../../shared/exceptions/UnauthorizedError';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { LoginResponseDto } from '../dto/Response/LoginResponseDto';
import { UserRepository } from '../../domain/repositories/User';
import { RoleRepository } from '../../domain/repositories/Rol';

export class RefreshToken {
  constructor(
    private userRepository: UserRepository,
    private roleRepository: RoleRepository,
    private jwtService: JwtService,
  ) {}

  async execute(refreshToken: string): Promise<LoginResponseDto> {
    try {
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
          role: {
            id: role.id,
            name: role.name,
            description: role.description,
          },
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      };
    } catch (error) {
      throw new UnauthorizedError('Invalid refresh token');
    }
  }
}
