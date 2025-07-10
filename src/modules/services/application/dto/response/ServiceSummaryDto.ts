/**
 * DTO de respuesta para información resumida de servicio
 * Versión ligera de ServiceDto para listas y referencias
 */
export interface ServiceSummaryDto {
  /** ID único del servicio */
  id: string;
  
  /** Nombre del servicio */
  name: string;
  
  /** Duración del servicio en minutos */
  duration: number;
  
  /** Precio del servicio */
  price: number;
  
  /** Indica si el servicio está activo */
  isActive: boolean;
}
