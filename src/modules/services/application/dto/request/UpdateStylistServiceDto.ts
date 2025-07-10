/**
 * DTO para actualizar una asignación de servicio a estilista
 * Permite modificar precio personalizado y estado de oferta
 */
export interface UpdateStylistServiceDto {
  /** 
   * Nuevo precio personalizado para el estilista (opcional)
   * Si es null, se usa el precio base del servicio
   * No puede ser negativo
   */
  customPrice?: number;
  
  /** 
   * Indica si el estilista está ofreciendo activamente este servicio
   * true: el servicio aparece en las ofertas del estilista
   * false: el servicio está asignado pero no se ofrece
   */
  isOffering?: boolean;
}
