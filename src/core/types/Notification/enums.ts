export enum NotificationType {
  APPOINTMENT_CONFIRMATION = 'APPOINTMENT_CONFIRMATION', //confirmación de cita
  APPOINTMENT_REMINDER = 'APPOINTMENT_REMINDER', //recordatorio de cita
  APPOINTMENT_CANCELLATION = 'APPOINTMENT_CANCELLATION', //cancelación de cita
  PROMOTIONAL = 'PROMOTIONAL', //promocional
  SYSTEM = 'SYSTEM', //sistema
}

export enum NotificationStatusName {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
}
