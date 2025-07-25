export interface AvailableSlotDto {
  time: string; // Formato: "HH:MM"
  available: boolean;
  duration: number; // en minutos
  conflictReason?: string;

  // Información estilista opcional
  stylist?: {
    id: string;
    name: string;
    available: boolean;
  };
}

export interface DayAvailabilityDto {
  date: string; // Formato: "YYYY-MM-DD"
  dayOfWeek: string;
  isWorkingDay: boolean;
  totalSlots: number;
  availableSlots: number;
  slots: AvailableSlotDto[];

  // Información de horario opcional
  workingHours?: {
    start: string; // Formato: "HH:MM"
    end: string; // Formato: "HH:MM"
  };
}
