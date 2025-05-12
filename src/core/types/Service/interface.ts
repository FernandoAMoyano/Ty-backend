import { ITimeStamped } from '../common/interfaces';

export interface IService extends ITimeStamped {
  categoryId: string;
  name: string;
  description: string;
  duration: number;
  durationVariation: number;
  price: number;
  isActive: boolean;
}

export interface IStylistService {
  stylistId: string;
  serviceId: string;
}
