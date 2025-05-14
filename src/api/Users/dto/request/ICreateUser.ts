export interface ICreateUserDto {
  name: string;
  email: string;
  phone: string;
  password: string;
  roleId: string;
  profilePicture?: string;
}
