export interface ICreateStylistDto {
  name: string;
  email: string;
  phone: string;
  password: string;
  serviceIds?: string[];
}
