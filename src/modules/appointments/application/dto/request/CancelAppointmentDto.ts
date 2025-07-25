export interface CancelAppointmentDto {
  /** Razón opcional para la cancelación de la cita */
  reason?: string;
  
  /** 
   * Tipo de cancelación
   * - 'client': Cancelado por el cliente
   * - 'stylist': Cancelado por el estilista  
   * - 'admin': Cancelado por administrador
   * - 'system': Cancelado por el sistema (ej: overbooking)
   */
  cancelledBy?: 'client' | 'stylist' | 'admin' | 'system';
  
  /** 
   * Indica si se debe enviar notificación al cliente
   * @default true
   */
  notifyClient?: boolean;
}
