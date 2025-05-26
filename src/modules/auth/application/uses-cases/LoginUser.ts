import { UserRepository } from '../../domain/repositories/User';
import { HashService } from '../services/HashService';
import { JwtPayload, JwtService } from '../services/JwtService';
import { LoginDto, LoginResponseDto, UserDto } from '../dto/AuthDto';
import { isValidEmail } from '../../../../shared/utils/validation';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';
import { UnauthorizedError } from '../../../../shared/exceptions/UnauthorizedError';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';

export class LoginUser {
  constructor(
    private userRepository: UserRepository,
    private hashService: HashService,
    private jwtService: JwtService,
  ) {}

  async execute(loginDto: LoginDto): Promise<LoginResponseDto> {
    if (!loginDto.email || !isValidEmail(loginDto.email)) {
      throw new ValidationError('Invalid email format');
    }

    if (!loginDto.password) {
      throw new ValidationError('Password is required');
    }

    const user = await this.userRepository.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('User account is inactive');
    }

    const isValidPassword = await this.hashService.compare(loginDto.password, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const role = await this.userRepository.findById(user.roleId);
    if (!role) {
      throw new NotFoundError('Role', user.roleId);
    }

    // Generar tokens
    const jwtPayload: JwtPayload = {
      userId: user.id,
      roleId: user.roleId,
      email: user.email,
    };

    const token = this.jwtService.generateAccessToken(jwtPayload);
    const refreshToken = this.jwtService.generateRefreshToken(jwtPayload);

    return {
      token,
      refreshToken,
      user: this.mapUserToDto(user, role),
    };
  }

  private mapUserToDto(user: any, role: any): UserDto {
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
