import { UserRepository } from '../../domain/repositories/User';
import { HashService } from '../services/HashService';
import { JwtPayload, JwtService } from '../services/JwtService';
import { LoginDto } from '../dto/Request/LoginDto';
import { LoginResponseDto } from '../dto/Response/LoginResponseDto';
import { UserDto } from '../dto/Response/UserDto';
import { isValidEmail } from '../../../../shared/utils/validation';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';
import { UnauthorizedError } from '../../../../shared/exceptions/UnauthorizedError';

/**
 * Caso de uso para autenticar usuarios en el sistema
 * Valida credenciales, verifica el estado del usuario y genera tokens JWT
 */
export class LoginUser {
  constructor(
    private userRepository: UserRepository,
    private hashService: HashService,
    private jwtService: JwtService,
  ) {}

  /**
   * Ejecuta el proceso de autenticación de usuario
   * @param loginDto - Datos de login (email y contraseña)
   * @returns Promise con los datos de respuesta del login incluyendo tokens y datos del usuario
   * @throws ValidationError si el email o contraseña no son válidos
   * @throws UnauthorizedError si las credenciales son incorrectas o el usuario está inactivo
   * @description Valida formato de email, verifica credenciales, genera tokens JWT y retorna datos del usuario
   */
  async execute(loginDto: LoginDto): Promise<LoginResponseDto> {
    if (!loginDto.email || !isValidEmail(loginDto.email)) {
      throw new ValidationError('Invalid email format');
    }

    if (!loginDto.password) {
      throw new ValidationError('Password is required');
    }

    const userWithRole = await this.userRepository.findByEmailWithRole(loginDto.email);
    if (!userWithRole) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (!userWithRole.isActive) {
      throw new UnauthorizedError('User account is inactive');
    }

    const isValidPassword = await this.hashService.compare(
      loginDto.password,
      userWithRole.password,
    );
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const role = userWithRole.role;
    if (!role) {
      throw new UnauthorizedError('Invalid credentials'); // No revelar detalles internos
    }

    // Generar tokens
    const jwtPayload: JwtPayload = {
      userId: userWithRole.id,
      roleId: userWithRole.roleId,
      email: userWithRole.email,
    };

    const token = this.jwtService.generateAccessToken(jwtPayload);
    const refreshToken = this.jwtService.generateRefreshToken(jwtPayload);

    return {
      token,
      refreshToken,
      user: this.mapUserToDto(userWithRole, role),
    };
  }

  /**
   * Convierte una entidad User con Role a su representación DTO
   * @param user - Entidad de usuario con datos completos
   * @param role - Entidad de rol asociada al usuario
   * @returns Objeto DTO con los datos del usuario formateados para respuesta
   * @private
   */
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
