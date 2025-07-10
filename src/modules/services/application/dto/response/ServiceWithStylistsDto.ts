import { StylistServiceDto } from './StylistServiceDto';

/**
 * DTO de respuesta para servicio con todos los estilistas que lo pueden realizar
 * Incluye información del servicio y lista completa de estilistas asignados
 */
export interface ServiceWithStylistsDto {
  /** ID único del servicio */
  serviceId: string;
  
  /** Nombre del servicio */
  serviceName: string;
  
  /** Descripción del servicio */
  serviceDescription: string;
  
  /** Duración base del servicio en minutos */
  baseDuration: number;
  
  /** Precio base del servicio */
  basePrice: number;
  
  /** Lista completa de estilistas que pueden realizar este servicio */
  stylists: StylistServiceDto[];
  
  /** Número de estilistas que están ofreciendo activamente este servicio */
  totalStylistsOffering: number;
}
