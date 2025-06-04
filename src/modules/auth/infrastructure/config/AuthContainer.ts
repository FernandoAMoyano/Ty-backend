import { PrismaClient } from '@prisma/client';

// Services y dependencias
import { HashService } from '../../application/services/HashService';
import { JwtService } from '../../application/services/JwtService';
import { PrismaUserRepository } from '../persistence/PrismaUserRepository';
import { PrismaRoleRepository } from '../persistence/PrismaRolRepository';
import { BcryptHashService } from '../services/BcryptHashService';
import { JwtTokenService } from '../services/JwtTokenService';
import { AuthController } from '../http/AuthController';
import { AuthMiddleware } from '../http/AuthMiddleware';
import { AuthRoutes } from '../http/AuthRoutes';
import { UserRepository } from '../../domain/repositories/User';
import { RoleRepository } from '../../domain/repositories/Rol';

import { LoginUser } from '../../application/uses-cases/LoginUser';
import { RegisterUser } from '../../application/uses-cases/RegisterUser';
import { RefreshToken } from '../../application/uses-cases/RefreshToken';
import { GetUserProfile } from '../../application/uses-cases/GetUserProfile';
import { UpdateUserProfile } from '../../application/uses-cases/UpdateUserProfile';
import { ChangeUserPassword } from '../../application/uses-cases/ChangeUserPassword';

export class AuthContainer {
  private static instance: AuthContainer;
  private _authController: AuthController;
  private _authMiddleware: AuthMiddleware;
  private _authRoutes: AuthRoutes;

  // Use Cases (ahora públicos para acceso directo)
  private _loginUser: LoginUser;
  private _registerUser: RegisterUser;
  private _refreshToken: RefreshToken;
  private _getUserProfile: GetUserProfile;
  private _updateUserProfile: UpdateUserProfile;
  private _changeUserPassword: ChangeUserPassword;

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
  get authController(): AuthController {
    return this._authController;
  }

  get authMiddleware(): AuthMiddleware {
    return this._authMiddleware;
  }

  get authRoutes(): AuthRoutes {
    return this._authRoutes;
  }

  // Getters para casos de uso (opcional, para testing o uso directo)
  get loginUser(): LoginUser {
    return this._loginUser;
  }

  get registerUser(): RegisterUser {
    return this._registerUser;
  }

  get refreshToken(): RefreshToken {
    return this._refreshToken;
  }

  get getUserProfile(): GetUserProfile {
    return this._getUserProfile;
  }

  get updateUserProfile(): UpdateUserProfile {
    return this._updateUserProfile;
  }

  get changeUserPassword(): ChangeUserPassword {
    return this._changeUserPassword;
  }
}
