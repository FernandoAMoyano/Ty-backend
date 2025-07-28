export interface ConfirmAppointmentDto {
  /** 
   * Notas adicionales sobre la confirmación (opcional)
   */
  notes?: string;
  
  /** 
   * Indica si se debe enviar notificación al cliente sobre la confirmación
   * @default true
   */
  notifyClient?: boolean;
  
  /** 
   * ID del usuario que confirma la cita (si es diferente al que la creó)
   */
  confirmedBy?: string;
}
