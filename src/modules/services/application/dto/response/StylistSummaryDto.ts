/**
 * DTO de respuesta para información resumida de estilista
 * Versión ligera para listas y referencias dentro de servicios
 */
export interface StylistSummaryDto {
  /** ID único del estilista */
  id: string;
  
  /** Nombre completo del estilista */
  name: string;
  
  /** Email del estilista */
  email: string;
  
  /** Indica si el estilista está ofreciendo este servicio activamente */
  isOffering: boolean;
  
  /** Precio personalizado del estilista para el servicio (si aplica) */
  customPrice?: number;
  
  /** Precio efectivo que cobra el estilista */
  effectivePrice: number;
}
