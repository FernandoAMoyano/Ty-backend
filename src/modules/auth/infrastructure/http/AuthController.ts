import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../application/services/AuthService';
import { AppError } from '../../../../shared/exceptions/AppError';
import { LoginDto } from '../../application/dto/Request/LoginDto';
import { RegisterDto } from '../../application/dto/Request/RegisterDto';
import { UpdateProfileDto } from '../../application/dto/Request/UpdateProfileDto';
import { ChangePasswordDto } from '../../application/dto/Request/ChangePasswordDto';

export class AuthController {
  constructor(private authService: AuthService) {}

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const loginDto: LoginDto = req.body;
      const result = await this.authService.loginService(loginDto);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const registerDto: RegisterDto = req.body;
      const user = await this.authService.registerService(registerDto);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      const result = await this.authService.refreshTokenService(refreshToken);

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('User ID not found', 401);
      }

      const user = await this.authService.getUserProfileService(userId);

      res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('User ID not found', 401);
      }

      const updateDto: UpdateProfileDto = req.body;
      const user = await this.authService.updateProfileService(userId, updateDto);

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('User ID not found', 401);
      }

      const changePasswordDto: ChangePasswordDto = req.body;
      await this.authService.changePasswordService(userId, changePasswordDto);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}
