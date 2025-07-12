import { RoleName } from '@prisma/client';
import { ConflictError } from '../../../../shared/exceptions/ConflictError';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';
import { isValidEmail, isValidPassword, isValidPhone } from '../../../../shared/utils/validation';
import { User } from '../../domain/entities/User';
import { RoleRepository } from '../../domain/repositories/Rol';
import { UserRepository } from '../../domain/repositories/User';
import { RegisterDto } from '../dto/Request/RegisterDto';
import { UserDto } from '../dto/Response/UserDto';
import { HashService } from '../services/HashService';

/**
 * Caso de uso para registrar nuevos usuarios en el sistema
 * Valida datos de entrada, verifica disponibilidad de email y crea nueva cuenta de usuario
 */
export class RegisterUser {
  constructor(
    private userRepository: UserRepository,
    private roleRepository: RoleRepository,
    private hashService: HashService,
  ) {}

  /**
   * Ejecuta el proceso de registro de un nuevo usuario
   * @param registerDto - Datos de registro del usuario
   * @returns Promise con los datos del usuario registrado
   * @throws ValidationError si los datos de entrada no son válidos
   * @throws ConflictError si el email ya está registrado
   * @throws NotFoundError si el rol especificado no existe
   * @description Valida datos, verifica unicidad del email, hashea contraseña y crea usuario con rol asignado
   */
  async execute(registerDto: RegisterDto): Promise<UserDto> {
    //validaciones
    this.validateRegisterDto(registerDto);

    const existingUser = await this.userRepository.existsByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictError('Email already exists');
    }

    const roleNameString = registerDto.roleName || 'CLIENT';
    const roleName = this.stringToRoleName(roleNameString);

    const role = await this.roleRepository.findByName(roleName);
    if (!role) {
      throw new NotFoundError('Role', roleNameString);
    }

    // Crear usuario
    const hashedPassword = await this.hashService.hash(registerDto.password);
    const user = User.create(
      role.id,
      registerDto.name.trim(),
      registerDto.email.toLowerCase(),
      registerDto.phone,
      hashedPassword,
      registerDto.profilePicture,
    );

    // Guardar usuario
    const savedUser = await this.userRepository.save(user);

    return this.mapUserToDto(savedUser, role);
  }

  /**
   * Convierte un string de rol a enum RoleName de Prisma
   * @param roleString - String del nombre del rol a convertir
   * @returns Enum RoleName correspondiente
   * @throws ValidationError si el rol no es válido
   * @private
   */
  private stringToRoleName(roleString: string): RoleName {
    const normalizedRole = roleString.toUpperCase();

    switch (normalizedRole) {
      case 'CLIENT':
        return RoleName.CLIENT;
      case 'STYLIST':
        return RoleName.STYLIST;
      case 'ADMIN':
        return RoleName.ADMIN;
      default:
        throw new ValidationError(
          `Invalid role: ${roleString}. Valid roles are: CLIENT, STYLIST, ADMIN`,
        );
    }
  }

  /**
   * Valida los datos de entrada para el registro de usuario
   * @param registerDto - Datos de registro a validar
   * @throws ValidationError si alguno de los campos no cumple con los requisitos
   * @private
   * @description Valida nombre, email, teléfono, contraseña y rol usando utilidades compartidas
   */
  private validateRegisterDto(registerDto: RegisterDto): void {
    if (!registerDto.name || registerDto.name.trim().length === 0) {
      throw new ValidationError('Name is required');
    }

    if (!registerDto.email || !isValidEmail(registerDto.email)) {
      throw new ValidationError('Valid email is required');
    }

    if (!registerDto.phone || !isValidPhone(registerDto.phone)) {
      throw new ValidationError('Valid phone is required');
    }

    if (!registerDto.password || !isValidPassword(registerDto.password)) {
      throw new ValidationError(
        'Password must be at least 8 characters long and contain uppercase, lowercase, and number',
      );
    }

    if (registerDto.roleName) {
      const validRoles = ['CLIENT', 'STYLIST', 'ADMIN'];
      if (!validRoles.includes(registerDto.roleName.toUpperCase())) {
        throw new ValidationError(`Invalid role. Valid roles are: ${validRoles.join(', ')}`);
      }
    }
  }

  /**
   * Convierte entidades User y Role a su representación DTO
   * @param user - Entidad de usuario creada
   * @param role - Entidad de rol asociada
   * @returns Objeto DTO con los datos del usuario para respuesta
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
