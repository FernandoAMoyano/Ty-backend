import { ITimeStamped } from '../common/interfaces';

export interface ICategory extends ITimeStamped {
  name: string;
  description?: string;
}
