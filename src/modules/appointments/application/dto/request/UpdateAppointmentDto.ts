export interface UpdateAppointmentDto {
  /**
   * Nueva fecha y hora de la cita en formato ISO 8601
   * @example "2025-01-28T10:00:00.000Z"
   */
  dateTime?: string;
  
  /**
   * Nueva duración de la cita en minutos
   * Debe ser múltiplo de 15 y entre 15-480 minutos
   * @example 60
   */
  duration?: number;
  
  /**
   * ID del nuevo estilista asignado
   * Si no se proporciona, mantiene el estilista actual
   */
  stylistId?: string;
  
  /**
   * Lista de IDs de servicios actualizados
   * Si se proporciona, reemplaza completamente la lista actual
   */
  serviceIds?: string[];
  
  /**
   * Notas adicionales sobre la actualización
   * Máximo 500 caracteres
   */
  notes?: string;
  
  /**
   * Indica si se debe notificar al cliente sobre los cambios
   * @default true
   */
  notifyClient?: boolean;
  
  /**
   * Razón del cambio (opcional)
   * Útil para auditoría y comunicación con el cliente
   */
  reason?: string;
}
