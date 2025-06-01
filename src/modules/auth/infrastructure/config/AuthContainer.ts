import { PrismaClient } from '@prisma/client';

//Casos de uso
import { LoginUser } from '../../application/uses-cases/LoginUser';
import { RegisterUser } from '../../application/uses-cases/RegisterUser';
import { RefreshToken } from '../../application/uses-cases/RefreshToken';
import { GetUserProfile } from '../../application/uses-cases/GetUserProfile';
import { UpdateUserProfile } from '../../application/uses-cases/UpdateUserProfile';
import { ChangeUserPassword } from '../../application/uses-cases/ChangeUserPassword';

// Services y resto de dependencias...
import { AuthService } from '../../application/services/AuthService';
import { HashService } from '../../application/services/HashService';
import { JwtService } from '../../application/services/JwtService';
import { PrismaUserRepository } from '../persistence/PrismaUserRepository';
import { BcryptHashService } from '../services/BcryptHashService';
import { JwtTokenService } from '../services/JwtTokenService';
import { AuthController } from '../http/AuthController';
import { AuthMiddleware } from '../http/AuthMiddleware';
import { AuthRoutes } from '../http/AuthRoutes';
import { UserRepository } from '../../domain/repositories/User';
import { RoleRepository } from '../../domain/repositories/Rol';
import { PrismaRoleRepository } from '../persistence/PrismaRolRepository';

export class AuthContainer {
  private static instance: AuthContainer;
  private _authService: AuthService;
  private _authController: AuthController;
  private _authMiddleware: AuthMiddleware;
  private _authRoutes: AuthRoutes;

  constructor(private prisma: PrismaClient) {
    this.setupDependencies();
  }

  static getInstance(prisma: PrismaClient): AuthContainer {
    if (!AuthContainer.instance) {
      AuthContainer.instance = new AuthContainer(prisma);
    }
    return AuthContainer.instance;
  }

  private setupDependencies(): void {
    // Repositories
    const userRepository: UserRepository = new PrismaUserRepository(this.prisma);
    const roleRepository: RoleRepository = new PrismaRoleRepository(this.prisma);

    // Services
    const hashService: HashService = new BcryptHashService();
    const jwtService: JwtService = new JwtTokenService();

    // Use Cases
    const loginUser = new LoginUser(userRepository, hashService, jwtService);
    const registerUser = new RegisterUser(userRepository, roleRepository, hashService);
    const refreshToken = new RefreshToken(userRepository, roleRepository, jwtService);
    const getUserProfile = new GetUserProfile(userRepository, roleRepository);
    const updateUserProfile = new UpdateUserProfile(userRepository, roleRepository);
    const changeUserPassword = new ChangeUserPassword(userRepository, hashService);

    // Application Service (orquesta los use cases)
    this._authService = new AuthService(
      loginUser,
      registerUser,
      refreshToken,
      getUserProfile,
      updateUserProfile,
      changeUserPassword,
    );

    // HTTP Layer
    this._authController = new AuthController(this._authService);
    this._authMiddleware = new AuthMiddleware(jwtService);
    this._authRoutes = new AuthRoutes(this._authController, this._authMiddleware);
  }

  // Getters...
  get authService(): AuthService {
    return this._authService;
  }
  get authController(): AuthController {
    return this._authController;
  }
  get authMiddleware(): AuthMiddleware {
    return this._authMiddleware;
  }
  get authRoutes(): AuthRoutes {
    return this._authRoutes;
  }
}
