import { ITimeStamped } from '../common/interfaces';

export interface IClient extends ITimeStamped {
  userId: string;
  preferences?: string[];
}
