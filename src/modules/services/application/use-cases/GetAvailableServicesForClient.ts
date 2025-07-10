import { ServiceDto } from '../dto/response/ServiceDto';
import { StylistServiceDto } from '../dto/response/StylistServiceDto';
import { ServiceManagementService } from '../services/ServiceManagementService';
import { StylistServiceService } from '../services/StylistServiceService';

/**
 * Caso de uso que combina servicios activos con estilistas disponibles
 * Solo muestra servicios que tienen al menos un estilista activo ofreciéndolos
 */

/**
 * Obtiene todos los servicios disponibles para clientes con sus estilistas
 * Filtra solo servicios que tienen al menos un estilista ofreciéndolos activamente
 * @returns Promise con lista de servicios disponibles y sus estilistas
 */
export class GetAvailableServicesForClient {
  constructor(
    private serviceManagementService: ServiceManagementService,
    private stylistServiceService: StylistServiceService,
  ) {}

  async execute(): Promise<ServiceWithAvailableStylists[]> {
    // Obtener servicios activos
    const activeServices = await this.serviceManagementService.getActiveServices();

    // Para cada servicio, obtener estilistas que lo ofrecen
    const servicesWithStylists = await Promise.all(
      activeServices.map(async (service) => {
        const availableStylists = await this.stylistServiceService.getStylistsOfferingService(
          service.id,
        );

        return {
          service,
          availableStylists,
          hasAvailableStylists: availableStylists.length > 0,
        };
      }),
    );

    // Filtrar solo servicios que tienen estilistas disponibles
    return servicesWithStylists.filter((item) => item.hasAvailableStylists);
  }
}

/**
 * Interfaz que representa un servicio con sus estilistas disponibles
 */
interface ServiceWithAvailableStylists {
  /** Información completa del servicio */
  service: ServiceDto;

  /** Lista de estilistas que están ofreciendo este servicio */
  availableStylists: StylistServiceDto[];

  /** Indica si el servicio tiene al menos un estilista disponible */
  hasAvailableStylists: boolean;
}
