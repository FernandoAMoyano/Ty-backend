export interface IUserResponse {
  id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  profilePicture?: string;
  role: {
    id: string;
    name: string;
  };
}
