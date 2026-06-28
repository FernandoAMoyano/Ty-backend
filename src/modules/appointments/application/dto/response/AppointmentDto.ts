export interface AppointmentDto {
  id: string;
  dateTime: string; // cadena ISO
  duration: number;
  confirmedAt?: string; // ISO string
  cancellationReason?: string;
  cancelledBy?: string;
  confirmationNotes?: string;
  createdAt: string;
  updatedAt: string;

  // Relaciones
  userId: string;
  clientId: string;
  stylistId?: string;
  scheduleId: string;
  statusId: string;
  serviceIds: string[];

  // Relaciones pobladas (opcionales — clientId/stylistId apuntan a User.id)
  client?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };

  stylist?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };

  status?: {
    id: string;
    name: string;
    description?: string;
  };

  services?: Array<{
    id: string;
    name: string;
    duration: number;
    price: number;
    category: {
      id: string;
      name: string;
    };
  }>;
}
