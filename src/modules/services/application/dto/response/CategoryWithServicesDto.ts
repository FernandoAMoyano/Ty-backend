import { CategoryDto } from './CategoryDto';
import { ServiceSummaryDto } from './ServiceSummaryDto';

export interface CategoryWithServicesDto extends CategoryDto {
  services: ServiceSummaryDto[];
}
