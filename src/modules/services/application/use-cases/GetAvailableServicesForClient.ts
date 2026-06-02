import { ServiceDto } from '../dto/response/ServiceDto';
import { StylistServiceDto } from '../dto/response/StylistServiceDto';
import { GetActiveServices } from './GetActiveServices';
import { GetStylistsOfferingService } from './GetStylistsOfferingService';

/**
 * Interfaz que representa un servicio con sus estilistas disponibles para clientes
 */
interface ServiceWithAvailableStylists {
  /** Información completa del servicio */
  service: ServiceDto;
  /** Lista de estilistas que están ofreciendo este servicio */
  availableStylists: StylistServiceDto[];
  /** Indica si el servicio tiene al menos un estilista disponible */
  hasAvailableStylists: boolean;
}

/**
 * Caso de uso que combina servicios activos con estilistas disponibles
 * Solo muestra servicios que tienen al menos un estilista activo ofreciéndolos
 */
export class GetAvailableServicesForClient {
  constructor(
    private getActiveServicesUseCase: GetActiveServices,
    private getStylistsOfferingServiceUseCase: GetStylistsOfferingService,
  ) {}

  /**
   * Ejecuta la obtención de servicios disponibles para clientes
   * @returns Promise con lista de servicios que tienen al menos un estilista activo
   * @description Filtra servicios activos que cuenten con estilistas ofreciéndolos actualmente
   */
  async execute(): Promise<ServiceWithAvailableStylists[]> {
    const activeServices = await this.getActiveServicesUseCase.execute();

    const servicesWithStylists = await Promise.all(
      activeServices.map(async (service) => {
        const availableStylists = await this.getStylistsOfferingServiceUseCase.execute(service.id);

        return {
          service,
          availableStylists,
          hasAvailableStylists: availableStylists.length > 0,
        };
      }),
    );

    return servicesWithStylists.filter((item) => item.hasAvailableStylists);
  }
}
