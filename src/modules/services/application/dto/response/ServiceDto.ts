import { CategoryDto } from './CategoryDto';
import { StylistSummaryDto } from './StylistSummaryDto';

/**
 * DTO de respuesta para información completa de un servicio
 * Incluye datos del servicio, categoría asociada y estilistas disponibles
 */
export interface ServiceDto {
  /** ID único del servicio */
  id: string;
  
  /** Nombre del servicio */
  name: string;
  
  /** Descripción detallada del servicio */
  description: string;
  
  /** Duración base del servicio en minutos */
  duration: number;
  
  /** Variación permitida en la duración (en minutos) */
  durationVariation: number;
  
  /** Duración mínima calculada (duration - durationVariation) */
  minDuration: number;
  
  /** Duración máxima calculada (duration + durationVariation) */
  maxDuration: number;
  
  /** Precio base del servicio */
  price: number;
  
  /** Precio formateado para mostrar (ej: "$25.00") */
  formattedPrice: string;
  
  /** Indica si el servicio está activo */
  isActive: boolean;
  
  /** Información completa de la categoría a la que pertenece */
  category: CategoryDto;
  
  /** Lista opcional de estilistas que pueden realizar este servicio */
  availableStylists?: StylistSummaryDto[];
  
  /** Fecha de creación del servicio */
  createdAt: Date;
  
  /** Fecha de última actualización */
  updatedAt: Date;
}
