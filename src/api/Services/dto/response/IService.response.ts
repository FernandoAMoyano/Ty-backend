import { ICategory } from '../../../../core/types/Category/interfaces';
import { IService } from '../../../../core/types/Service/interface';
import { IStylist } from '../../../../core/types/Stylist/interfaces';

export interface IServiceResponse extends IService {
  category: ICategory;
  stylists?: Array<Omit<IStylist, 'services'>>;
}
