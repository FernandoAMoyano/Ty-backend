/**
 * DTO para asignar un servicio a un estilista con precio personalizado opcional
 */
export interface AssignServiceDto {
  /** ID único del servicio a asignar al estilista */
  serviceId: string;
  
  /** 
   * Precio personalizado para este estilista (opcional)
   * Si no se especifica, se usa el precio base del servicio
   */
  customPrice?: number;
}
