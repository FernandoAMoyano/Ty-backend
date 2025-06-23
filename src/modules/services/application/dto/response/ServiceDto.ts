import { CategoryDto } from './CategoryDto';
import { StylistSummaryDto } from './StylistSummaryDto';

export interface ServiceDto {
  id: string;
  name: string;
  description: string;
  duration: number;
  durationVariation: number;
  minDuration: number;
  maxDuration: number;
  price: number;
  formattedPrice: string;
  isActive: boolean;
  category: CategoryDto;
  availableStylists?: StylistSummaryDto[];
  createdAt: Date;
  updatedAt: Date;
}
