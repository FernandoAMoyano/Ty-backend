import { AssignServiceDto } from '../dto/request/AssignServiceDto';
import { StylistServiceDto } from '../dto/response/StylistServiceDto';
import { StylistServiceService } from '../services/StylistServiceService';

/**
 * Use Case para asignar un servicio a un estilista
 * valida estilista + servicio + crea relación + verifica permisos
 */
export class AssignServiceToStylist {
  constructor(private stylistServiceService: StylistServiceService) {}

  async execute(stylistId: string, assignDto: AssignServiceDto): Promise<StylistServiceDto> {
    return await this.stylistServiceService.assignServiceToStylist(stylistId, assignDto);
  }
}
