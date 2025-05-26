import { RoleDto } from '../Response/RolDto';

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
