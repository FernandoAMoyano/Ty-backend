export interface IUpdateUserDto {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  isActive?: boolean;
  profilePicture?: string | null;
}
