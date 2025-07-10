import { CategoryDto } from './CategoryDto';
import { ServiceSummaryDto } from './ServiceSummaryDto';

/**
 * DTO de respuesta para categoría con su lista completa de servicios
 * Extiende CategoryDto agregando información de servicios asociados
 */
export interface CategoryWithServicesDto extends CategoryDto {
  /** Lista de servicios que pertenecen a esta categoría */
  services: ServiceSummaryDto[];
}
