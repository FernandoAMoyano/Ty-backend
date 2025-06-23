import { ServiceDto } from '../dto/response/ServiceDto';
import { StylistServiceDto } from '../dto/response/StylistServiceDto';
import { ServiceManagementService } from '../services/ServiceManagementService';
import { StylistServiceService } from '../services/StylistServiceService';

/**
 * Use Case que combina servicios activos con estilistas disponibles
 *  solo mostrar servicios que tienen estilistas activos ofreciéndolos
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

interface ServiceWithAvailableStylists {
  service: ServiceDto;
  availableStylists: StylistServiceDto[];
  hasAvailableStylists: boolean;
}
