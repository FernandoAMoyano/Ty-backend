/**
 * DTO de respuesta para asignación de servicio a estilista
 * Incluye información del servicio, precios y estado de la asignación
 */
export interface StylistServiceDto {
  /** ID único del estilista */
  stylistId: string;
  
  /** ID único del servicio */
  serviceId: string;
  
  /** Nombre del servicio */
  serviceName: string;
  
  /** Descripción del servicio */
  serviceDescription: string;
  
  /** Duración base del servicio en minutos */
  baseDuration: number;
  
  /** Precio base del servicio */
  basePrice: number;
  
  /** Precio personalizado del estilista para este servicio (opcional) */
  customPrice?: number;
  
  /** Precio efectivo (customPrice si existe, sino basePrice) */
  effectivePrice: number;
  
  /** Precio efectivo formateado para mostrar */
  formattedEffectivePrice: string;
  
  /** Indica si el estilista está ofreciendo activamente este servicio */
  isOffering: boolean;
  
  /** Indica si el estilista tiene un precio personalizado para este servicio */
  hasCustomPrice: boolean;
  
  /** Fecha de creación de la asignación */
  createdAt: Date;
  
  /** Fecha de última actualización de la asignación */
  updatedAt: Date;
}
