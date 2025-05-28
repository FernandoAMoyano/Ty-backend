import { ChangePasswordDto } from '../dto/Request/ChangePasswordDto';
import { LoginDto } from '../dto/Request/LoginDto';
import { RegisterDto } from '../dto/Request/RegisterDto';
import { UpdateProfileDto } from '../dto/Request/UpdateProfileDto';
import { LoginResponseDto } from '../dto/Response/LoginResponseDto';
import { UserDto } from '../dto/Response/UserDto';
import { ChangeUserPassword } from '../uses-cases/ChangeUserPassword';
import { GetUserProfile } from '../uses-cases/GetUserProfile';
import { LoginUser } from '../uses-cases/LoginUser';
import { RefreshToken } from '../uses-cases/RefreshToken';
import { RegisterUser } from '../uses-cases/RegisterUser';
import { UpdateUserProfile } from '../uses-cases/UpdateUserProfile';

export class AuthService {
  constructor(
    private loginUser: LoginUser,
    private registerUser: RegisterUser,
    private refreshToken: RefreshToken,
    private getUserProfile: GetUserProfile,
    private updateUserProfile: UpdateUserProfile,
    private changeUserPassword: ChangeUserPassword,
  ) {}

  async loginService(loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.loginUser.execute(loginDto);
  }

  async registerService(registerDto: RegisterDto): Promise<UserDto> {
    return this.registerUser.execute(registerDto);
  }

  async refreshTokenService(refreshToken: string): Promise<LoginResponseDto> {
    return this.refreshToken.execute(refreshToken);
  }

  async getUserProfileService(userId: string): Promise<UserDto> {
    return this.getUserProfile.execute(userId);
  }

  async updateProfileService(userId: string, updateDto: UpdateProfileDto): Promise<UserDto> {
    return this.updateUserProfile.execute(userId, updateDto);
  }

  async changePasswordService(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    return this.changeUserPassword.execute(userId, changePasswordDto);
  }
}
