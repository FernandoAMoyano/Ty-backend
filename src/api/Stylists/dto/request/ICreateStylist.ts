import { ICreateUserDto } from '../../../Users/dto/request/ICreateUser';

export interface ICreateStylistDto extends ICreateUserDto {
  serviceIds?: string[];
}
