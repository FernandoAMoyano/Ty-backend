import { StylistServiceDto } from './StylistServiceDto';

/**
 * DTO de respuesta para estilista con todos sus servicios asignados
 * Incluye información del estilista y lista completa de servicios
 */
export interface StylistWithServicesDto {
  /** ID único del estilista */
  stylistId: string;
  
  /** Nombre completo del estilista */
  stylistName: string;
  
  /** Email del estilista */
  stylistEmail: string;
  
  /** Lista completa de servicios asignados al estilista */
  services: StylistServiceDto[];
  
  /** Número total de servicios que el estilista está ofreciendo activamente */
  totalServicesOffered: number;
}
