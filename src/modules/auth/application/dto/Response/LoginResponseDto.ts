import { UserDto } from './UserDto';

export interface LoginResponseDto {
  token: string;
  refreshToken: string;
  user: UserDto;
}
