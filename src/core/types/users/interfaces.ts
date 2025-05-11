import { IBase, ITimeStamped } from '../common/interfaces';

export interface IRole extends IBase {
  name: string;
  description?: string;
  createdAt: Date;
}

export interface IUser extends ITimeStamped {
  roleId: string;
  name: string;
  email: string;
  phone: string;
  password: string; // Siempre almacenar hash, nunca en texto plano
  isActive: boolean;
  profilePicture?: string;
}
