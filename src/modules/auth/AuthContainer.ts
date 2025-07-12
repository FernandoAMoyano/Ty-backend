import { PrismaClient } from '@prisma/client';
import { AuthController } from './presentation/controllers/AuthController';
import { AuthMiddleware } from './presentation/middleware/AuthMiddleware';
import { AuthRoutes } from './presentation/routes/AuthRoutes';
import { LoginUser } from './application/uses-cases/LoginUser';
import { RegisterUser } from './application/uses-cases/RegisterUser';
import { RefreshToken } from './application/uses-cases/RefreshToken';
import { GetUserProfile } from './application/uses-cases/GetUserProfile';
import { UpdateUserProfile } from './application/uses-cases/UpdateUserProfile';
import { ChangeUserPassword } from './application/uses-cases/ChangeUserPassword';
import { PrismaUserRepository } from './infrastructure/persistence/PrismaUserRepository';
import { PrismaRoleRepository } from './infrastructure/persistence/PrismaRolRepository';
import { RoleRepository } from './domain/repositories/Rol';
import { UserRepository } from './domain/repositories/User';
import { BcryptHashService } from './infrastructure/services/BcryptHashService';
import { JwtTokenService } from './infrastructure/services/JwtTokenService';
import { JwtService } from './application/services/JwtService';
import { HashService } from './application/services/HashService';

/**
 * Contenedor de dependencias para el módulo de autenticación
 * Implementa el patrón Singleton y configura todas las dependencias del módulo auth
 * usando inyección de dependencias manual
 */
export class AuthContainer {
  /** Instancia singleton del contenedor */
  private static instance: AuthContainer;
  private _authController: AuthController;
  private _authMiddleware: AuthMiddleware;
  private _authRoutes: AuthRoutes;

  private _loginUser: LoginUser;
  private _registerUser: RegisterUser;
  private _refreshToken: RefreshToken;
  private _getUserProfile: GetUserProfile;
  private _updateUserProfile: UpdateUserProfile;
  private _changeUserPassword: ChangeUserPassword;

  /**
   * Constructor privado que inicializa todas las dependencias del módulo
   * @param prisma - Cliente Prisma para acceso a base de datos
   * @description Configura la cadena completa de dependencias siguiendo arquitectura hexagonal
   */
  constructor(private prisma: PrismaClient) {
    this.setupDependencies();
  }

  /**
   * Obtiene la instancia singleton del contenedor
   * @param prisma - Cliente Prisma para inicialización
   * @returns Instancia única del AuthContainer
   * @description Implementa patrón Singleton para asegurar una sola instancia
   */
  static getInstance(prisma: PrismaClient): AuthContainer {
    if (!AuthContainer.instance) {
      AuthContainer.instance = new AuthContainer(prisma);
    }
    return AuthContainer.instance;
  }

  /**
   * Configura todas las dependencias del módulo de autenticación
   * @private
   * @description Inyecta dependencias siguiendo el orden: repositories -> services -> use cases -> controllers
   */
  private setupDependencies(): void {
    // Repositories
    const userRepository: UserRepository = new PrismaUserRepository(this.prisma);
    const roleRepository: RoleRepository = new PrismaRoleRepository(this.prisma);

    // Services
    const hashService: HashService = new BcryptHashService();
    const jwtService: JwtService = new JwtTokenService();

    // Use Cases
    this._loginUser = new LoginUser(userRepository, hashService, jwtService);
    this._registerUser = new RegisterUser(userRepository, roleRepository, hashService);
    this._refreshToken = new RefreshToken(userRepository, roleRepository, jwtService);
    this._getUserProfile = new GetUserProfile(userRepository, roleRepository);
    this._updateUserProfile = new UpdateUserProfile(userRepository, roleRepository);
    this._changeUserPassword = new ChangeUserPassword(userRepository, hashService);

    // HTTP Layer - Inyectamos los casos de uso directamente
    this._authController = new AuthController(
      this._loginUser,
      this._registerUser,
      this._refreshToken,
      this._getUserProfile,
      this._updateUserProfile,
      this._changeUserPassword,
    );

    this._authMiddleware = new AuthMiddleware(jwtService);
    this._authRoutes = new AuthRoutes(this._authController, this._authMiddleware);
  }

  // Getters para acceso externo
  /**
   * Obtiene el controlador de autenticación configurado
   * @returns Instancia de AuthController con todas sus dependencias inyectadas
   */
  get authController(): AuthController {
    return this._authController;
  }

  /**
   * Obtiene el middleware de autenticación configurado
   * @returns Instancia de AuthMiddleware con JwtService inyectado
   */
  get authMiddleware(): AuthMiddleware {
    return this._authMiddleware;
  }

  /**
   * Obtiene las rutas de autenticación configuradas
   * @returns Instancia de AuthRoutes con controller y middleware inyectados
   */
  get authRoutes(): AuthRoutes {
    return this._authRoutes;
  }

  // Getters para casos de uso (opcional, para testing o uso directo)
  /**
   * Obtiene el caso de uso de login configurado
   * @returns Instancia de LoginUser para uso directo o testing
   */
  get loginUser(): LoginUser {
    return this._loginUser;
  }

  /**
   * Obtiene el caso de uso de registro configurado
   * @returns Instancia de RegisterUser para uso directo o testing
   */
  get registerUser(): RegisterUser {
    return this._registerUser;
  }

  /**
   * Obtiene el caso de uso de renovación de tokens configurado
   * @returns Instancia de RefreshToken para uso directo o testing
   */
  get refreshToken(): RefreshToken {
    return this._refreshToken;
  }

  /**
   * Obtiene el caso de uso de consulta de perfil configurado
   * @returns Instancia de GetUserProfile para uso directo o testing
   */
  get getUserProfile(): GetUserProfile {
    return this._getUserProfile;
  }

  /**
   * Obtiene el caso de uso de actualización de perfil configurado
   * @returns Instancia de UpdateUserProfile para uso directo o testing
   */
  get updateUserProfile(): UpdateUserProfile {
    return this._updateUserProfile;
  }

  /**
   * Obtiene el caso de uso de cambio de contraseña configurado
   * @returns Instancia de ChangeUserPassword para uso directo o testing
   */
  get changeUserPassword(): ChangeUserPassword {
    return this._changeUserPassword;
  }
}
