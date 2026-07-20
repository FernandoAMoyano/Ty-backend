import { Request, Response } from 'express';

import { LoginUser } from '../../application/use-cases/LoginUser';
import { RegisterUser } from '../../application/use-cases/RegisterUser';
import { RefreshToken } from '../../application/use-cases/RefreshToken';
import { GetUserProfile } from '../../application/use-cases/GetUserProfile';
import { UpdateUserProfile } from '../../application/use-cases/UpdateUserProfile';
import { ChangeUserPassword } from '../../application/use-cases/ChangeUserPassword';
import { DeactivateUser } from '../../application/use-cases/DeactivateUser';
import { LogoutUser } from '../../application/use-cases/LogoutUser';
import { LogoutAllSessions } from '../../application/use-cases/LogoutAllSessions';
import { AuthenticatedRequest } from '../middleware/AuthMiddleware';
import { RegisterDto } from '../../application/dto/request/RegisterDto';
import { LoginDto } from '../../application/dto/request/LoginDto';
import { UpdateProfileDto } from '../../application/dto/request/UpdateProfileDto';
import { ChangePasswordDto } from '../../application/dto/request/ChangePasswordDto';
import { UnauthorizedError } from '../../../../shared/exceptions/UnauthorizedError';

/**
 * Controlador de autenticación que maneja peticiones HTTP
 * relacionadas con usuarios. Coordina las operaciones de
 * login, registro, renovación de tokens y gestión de perfiles.
 * Los errores burbujean al errorHandler global via .catch(next) en AuthRoutes.
 */
export class AuthController {
  constructor(
    private loginUser: LoginUser,
    private registerUser: RegisterUser,
    private refreshTokenUseCase: RefreshToken,
    private getUserProfile: GetUserProfile,
    private updateUserProfile: UpdateUserProfile,
    private changeUserPassword: ChangeUserPassword,
    private deactivateUserUseCase: DeactivateUser,
    private logoutUseCase: LogoutUser,
    private logoutAllUseCase: LogoutAllSessions,
  ) {}

  /**
   * Autentica un usuario en el sistema
   * @route POST /auth/login
   * @param req - Request de Express con LoginDto en el body
   * @param res - Response de Express
   * @returns Promise<Response>
   * @description Valida credenciales y retorna tokens de acceso y renovación
   * @responseStatus 200 - Login exitoso con tokens
   * @throws ValidationError si el formato del email o password es inválido
   * @throws UnauthorizedError si las credenciales son incorrectas o el usuario está inactivo
   */
  async login(req: Request, res: Response): Promise<Response> {
    const loginDto: LoginDto = req.body;
    const result = await this.loginUser.execute(loginDto);

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Login successful',
    });
  }

  /**
   * Registra un nuevo usuario en el sistema
   * @route POST /auth/register
   * @param req - Request de Express con RegisterDto en el body
   * @param res - Response de Express
   * @returns Promise<Response>
   * @description Crea una nueva cuenta de usuario con rol asignado
   * @responseStatus 201 - Usuario registrado exitosamente
   * @throws ValidationError si los datos de entrada no son válidos
   * @throws ConflictError si el email ya está registrado
   * @throws NotFoundError si el rol especificado no existe
   */
  async register(req: Request, res: Response): Promise<Response> {
    const registerDto: RegisterDto = req.body;
    const result = await this.registerUser.execute(registerDto);

    return res.status(201).json({
      success: true,
      data: result,
      message: 'User registered successfully',
    });
  }

  /**
   * Renueva los tokens de acceso usando un refresh token
   * @route POST /auth/refresh-token
   * @param req - Request de Express con refreshToken en el body
   * @param res - Response de Express
   * @returns Promise<Response>
   * @description Genera nuevos tokens cuando el token de acceso expira
   * @responseStatus 200 - Tokens renovados exitosamente
   * @throws ValidationError si no se proporciona refresh token
   * @throws UnauthorizedError si el refresh token es inválido o expirado
   */
  async refreshToken(req: Request, res: Response): Promise<Response> {
    const { refreshToken } = req.body;
    const result = await this.refreshTokenUseCase.execute(refreshToken);

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Token refreshed successfully',
    });
  }

  /**
   * Obtiene el perfil del usuario autenticado
   * @route GET /auth/profile
   * @param req - Request de Express autenticado con userId en req.user
   * @param res - Response de Express
   * @returns Promise<Response>
   * @description Retorna información completa del perfil del usuario
   * @responseStatus 200 - Perfil obtenido exitosamente
   * @throws UnauthorizedError si el request no está autenticado
   * @throws NotFoundError si el usuario no existe
   */
  async getProfile(req: AuthenticatedRequest, res: Response): Promise<Response> {
    if (!req.user?.userId) {
      throw new UnauthorizedError('Authentication required');
    }

    const result = await this.getUserProfile.execute(req.user.userId);

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Profile retrieved successfully',
    });
  }

  /**
   * Actualiza el perfil del usuario autenticado
   * @route PUT /auth/profile
   * @param req - Request de Express con UpdateProfileDto en el body
   * @param res - Response de Express
   * @returns Promise<Response>
   * @description Modifica datos del perfil como nombre, teléfono o foto de perfil
   * @responseStatus 200 - Perfil actualizado exitosamente
   * @throws UnauthorizedError si el request no está autenticado
   * @throws ValidationError si los datos de actualización no son válidos
   * @throws NotFoundError si el usuario no existe
   */
  async updateProfile(req: AuthenticatedRequest, res: Response): Promise<Response> {
    if (!req.user?.userId) {
      throw new UnauthorizedError('Authentication required');
    }

    const updateDto: UpdateProfileDto = req.body;
    const result = await this.updateUserProfile.execute(req.user.userId, updateDto);

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Profile updated successfully',
    });
  }

  /**
   * Cambia la contraseña del usuario autenticado
   * @route PUT /auth/change-password
   * @param req - Request de Express con ChangePasswordDto en el body
   * @param res - Response de Express
   * @returns Promise<Response>
   * @description Actualiza la contraseña verificando la contraseña actual antes del cambio
   * @responseStatus 200 - Contraseña cambiada exitosamente
   * @throws UnauthorizedError si el request no está autenticado o la contraseña actual es incorrecta
   * @throws ValidationError si la nueva contraseña no cumple los requisitos de seguridad
   * @throws NotFoundError si el usuario no existe
   */
  async changePassword(req: AuthenticatedRequest, res: Response): Promise<Response> {
    if (!req.user?.userId) {
      throw new UnauthorizedError('Authentication required');
    }

    const changePasswordDto: ChangePasswordDto = req.body;
    await this.changeUserPassword.execute(req.user.userId, changePasswordDto);

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  }

  /**
   * Desactiva un usuario del sistema
   * Si el usuario es STYLIST, ejecuta cascada: cancela citas activas y desactiva servicios
   * @route PATCH /auth/users/:id/deactivate
   * @param req - Request de Express autenticado con userId del admin
   * @param res - Response de Express
   * @returns Promise<Response>
   * @description Solo accesible por ADMIN. Desactiva usuario y ejecuta cascada si es STYLIST
   * @responseStatus 200 - Usuario desactivado exitosamente con resumen de cascada
   * @throws UnauthorizedError si el request no está autenticado
   * @throws NotFoundError si el usuario no existe
   * @throws BusinessRuleError si el usuario ya está inactivo
   */
  async deactivateUser(req: AuthenticatedRequest, res: Response): Promise<Response> {
    if (!req.user?.userId) {
      throw new UnauthorizedError('Authentication required');
    }

    const { id } = req.params;
    const result = await this.deactivateUserUseCase.execute(id);

    return res.status(200).json({
      success: true,
      data: result,
      message: 'User deactivated successfully',
    });
  }

  /**
   * Cierra la sesión actual revocando el refresh token recibido
   * @route POST /auth/logout
   * @param req - Request autenticado; refreshToken en el body
   * @param res - Response de Express
   * @returns Promise<Response>
   * @description Revoca la sesión del refresh token. Idempotente.
   * @responseStatus 200 - Sesión cerrada
   * @throws UnauthorizedError si el request no está autenticado
   */
  async logout(req: AuthenticatedRequest, res: Response): Promise<Response> {
    if (!req.user?.userId) {
      throw new UnauthorizedError('Authentication required');
    }

    const { refreshToken } = req.body;
    await this.logoutUseCase.execute(req.user.userId, refreshToken);

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  }

  /**
   * Cierra todas las sesiones del usuario (logout de todos los dispositivos)
   * @route POST /auth/logout-all
   * @param req - Request autenticado
   * @param res - Response de Express
   * @returns Promise<Response>
   * @description Revoca todas las sesiones activas del usuario
   * @responseStatus 200 - Sesiones revocadas con su cantidad
   * @throws UnauthorizedError si el request no está autenticado
   */
  async logoutAll(req: AuthenticatedRequest, res: Response): Promise<Response> {
    if (!req.user?.userId) {
      throw new UnauthorizedError('Authentication required');
    }

    const revokedCount = await this.logoutAllUseCase.execute(req.user.userId);

    return res.status(200).json({
      success: true,
      data: { revokedCount },
      message: 'All sessions revoked successfully',
    });
  }
}
