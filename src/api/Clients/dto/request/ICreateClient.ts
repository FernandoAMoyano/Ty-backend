export interface ICreateClientDto {
  name: string;
  email: string;
  phone: string;
  password: string;
  preferences?: string[];
}
