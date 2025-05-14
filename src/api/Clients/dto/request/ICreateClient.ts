import { ICreateUserDto } from '../../../Users/dto/request/ICreateUser';

export interface ICreateClientDto extends ICreateUserDto {
  preferences?: string[];
}
