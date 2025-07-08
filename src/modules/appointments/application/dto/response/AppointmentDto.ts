export interface AppointmentDto {
  id: string;
  dateTime: string; // cadena ISO
  duration: number;
  confirmedAt?: string; // ISO string
  createdAt: string;
  updatedAt: string;

  // Relaciones
  userId: string;
  clientId: string;
  stylistId?: string;
  scheduleId: string;
  statusId: string;
  serviceIds: string[];

  // Relaciones pobladas (opcionales)
  client?: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
      phone: string;
    };
  };

  stylist?: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
      phone: string;
    };
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
