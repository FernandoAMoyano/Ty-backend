import { IService } from '../../../../core/types/Service/interface';
import { IStylist } from '../../../../core/types/Stylist/interfaces';
import { IUser } from '../../../../core/types/User/interfaces';

export interface IStylistResponse extends IStylist {
  user: Omit<IUser, 'password'>;
  services?: IService[];
}
