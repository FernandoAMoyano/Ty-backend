export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  phone: string;
  password: string;
  roleId: string;
  profilePicture?: string;
}

export interface UpdateProfileDto {
  name?: string;
  phone?: string;
  profilePicture?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

//Dtos de salida

export interface UserDto {
  id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  profilePicture?: string;
  role: RoleDto;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoleDto {
  id: string;
  name: string;
  description?: string;
}

export interface LoginResponseDto {
  token: string;
  refreshToken: string;
  user: UserDto;
}

export interface RefreshTokenDto {
  refreshToken: string;
}
