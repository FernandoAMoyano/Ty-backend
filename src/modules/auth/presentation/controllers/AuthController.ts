import { Request, Response } from 'express';

import { LoginUser } from '../../application/uses-cases/LoginUser';
import { RegisterUser } from '../../application/uses-cases/RegisterUser';
import { RefreshToken } from '../../application/uses-cases/RefreshToken';
import { GetUserProfile } from '../../application/uses-cases/GetUserProfile';
import { UpdateUserProfile } from '../../application/uses-cases/UpdateUserProfile';
import { ChangeUserPassword } from '../../application/uses-cases/ChangeUserPassword';
import { AuthenticatedRequest } from '../middleware/AuthMiddleware';
import { RegisterDto } from '../../application/dto/Request/RegisterDto';
import { LoginDto } from '../../application/dto/Request/LoginDto';
import { UpdateProfileDto } from '../../application/dto/Request/UpdateProfileDto';
import { ChangePasswordDto } from '../../application/dto/Request/ChangePasswordDto';

/**
 * Controlador de autenticación que maneja peticiones HTTP
 * relacionadas con usuarios, Coordina las operaciones de
 * login, registro, renovación de tokens y gestión de perfiles
 */
export class AuthController {
  constructor(
    private loginUser: LoginUser,
    private registerUser: RegisterUser,
    private refreshTokenUseCase: RefreshToken,
    private getUserProfile: GetUserProfile,
    private updateUserProfile: UpdateUserProfile,
    private changeUserPassword: ChangeUserPassword,
  ) {}

  /**
   * Autentica un usuario en el sistema
   * @route POST /auth/login
   * @param req - Request de Express con LoginDto en el body
   * @param res - Response de Express
   * @returns Promise<Response | void>
   * @description Valida credenciales y retorna tokens de acceso y renovación
   * @responseStatus 200 - Login exitoso con tokens
   * @throws ValidationError si las credenciales son inválidas
   * @throws UnauthorizedError si el usuario no existe o la contraseña es incorrecta
   */
  async login(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const loginDto: LoginDto = req.body;
      const result = await this.loginUser.execute(loginDto);

      return res.status(200).json({
        success: true,
        data: result,
        message: 'Login successful',
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Registra un nuevo usuario en el sistema
   * @route POST /auth/register
   * @param req - Request de Express con RegisterDto en el body
   * @param res - Response de Express
   * @returns Promise<Response | void>
   * @description Crea una nueva cuenta de usuario con rol asignado
   * @responseStatus 201 - Usuario registrado exitosamente
   * @throws ValidationError si los datos no son válidos
   * @throws ConflictError si el email ya está registrado
   */
  async register(req: Request, res: Response): Promise<Response | void> {
    try {
      const registerDto: RegisterDto = req.body;
      const result = await this.registerUser.execute(registerDto);

      return res.status(201).json({
        success: true,
        data: result,
        message: 'User registered successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Renueva los tokens de acceso usando un refresh token
   * @route POST /auth/refresh-token
   * @param req - Request de Express con refreshToken en el body
   * @param res - Response de Express
   * @returns Promise<Response | void>
   * @description Genera nuevos tokens cuando el token de acceso expira
   * @responseStatus 200 - Tokens renovados exitosamente
   * @throws ValidationError si no se proporciona refresh token
   * @throws UnauthorizedError si el refresh token es inválido
   */
  async refreshToken(req: Request, res: Response): Promise<Response | void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required',
        });
      }

      const result = await this.refreshTokenUseCase.execute(refreshToken);

      return res.status(200).json({
        success: true,
        data: result,
        message: 'Token refreshed successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene el perfil del usuario autenticado
   * @route GET /auth/profile
   * @param req - Request de Express autenticado con user en req.user
   * @param res - Response de Express
   * @returns Promise<Response | void>
   * @description Retorna información completa del perfil del usuario
   * @responseStatus 200 - Perfil obtenido exitosamente
   * @throws UnauthorizedError si no hay autenticación
   * @throws NotFoundError si el usuario no existe
   */
  async getProfile(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      // Validación explícita del userId
      const userId = req.user?.userId || req.params.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
      }

      const result = await this.getUserProfile.execute(userId);

      return res.status(200).json({
        success: true,
        data: result,
        message: 'Profile retrieved successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza el perfil del usuario autenticado
   * @route PUT /auth/profile
   * @param req - Request de Express con UpdateProfileDto en el body
   * @param res - Response de Express
   * @returns Promise<Response | void>
   * @description Modifica datos del perfil como nombre, email, etc.
   * @responseStatus 200 - Perfil actualizado exitosamente
   * @throws UnauthorizedError si no hay autenticación
   * @throws ValidationError si los datos no son válidos
   * @throws ConflictError si el nuevo email ya está en uso
   */
  async updateProfile(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const userId = req.user?.userId || req.params.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
      }

      const updateDto: UpdateProfileDto = req.body;
      const result = await this.updateUserProfile.execute(userId, updateDto);

      return res.status(200).json({
        success: true,
        data: result,
        message: 'Profile updated successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cambia la contraseña del usuario autenticado
   * @route PUT /auth/change-password
   * @param req - Request de Express con ChangePasswordDto en el body
   * @param res - Response de Express
   * @returns Promise<Response | void>
   * @description Actualiza la contraseña verificando la contraseña actual
   * @responseStatus 200 - Contraseña cambiada exitosamente
   * @throws UnauthorizedError si no hay autenticación
   * @throws ValidationError si la contraseña actual es incorrecta
   */
  async changePassword(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const changePasswordDto: ChangePasswordDto = req.body;
      await this.changeUserPassword.execute(userId, changePasswordDto);

      return res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      throw error;
    }
  }
}
