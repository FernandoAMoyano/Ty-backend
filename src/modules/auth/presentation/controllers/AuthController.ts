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

export class AuthController {
  constructor(
    private loginUser: LoginUser,
    private registerUser: RegisterUser,
    private refreshTokenUseCase: RefreshToken,
    private getUserProfile: GetUserProfile,
    private updateUserProfile: UpdateUserProfile,
    private changeUserPassword: ChangeUserPassword,
  ) {}

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
