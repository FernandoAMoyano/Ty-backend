import { AssignServiceDto } from '../dto/request/AssignServiceDto';
import { StylistServiceDto } from '../dto/response/StylistServiceDto';
import { StylistServiceService } from '../services/StylistServiceService';

/**
 * Caso de uso para asignar un servicio a un estilista
 * Valida que el estilista y servicio existan, verifica permisos y crea la relación
 */

/**
 * Ejecuta la asignación de un servicio a un estilista
 * @param stylistId - ID único del estilista al que se asignará el servicio
 * @param assignDto - Datos de la asignación incluyendo servicio y precio personalizado
 * @returns Promise con los datos de la asignación creada
 * @throws NotFoundError si el estilista o servicio no existen
 * @throws ValidationError si el usuario no es estilista
 * @throws ConflictError si el servicio ya está asignado al estilista
 */
export class AssignServiceToStylist {
  constructor(private stylistServiceService: StylistServiceService) {}

  async execute(stylistId: string, assignDto: AssignServiceDto): Promise<StylistServiceDto> {
    return await this.stylistServiceService.assignServiceToStylist(stylistId, assignDto);
  }
}
