import { IStylistServiceRepository } from '../../domain/repositories/IStylistServiceRepository';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';

/**
 * Caso de uso para remover la asignación de un servicio de un estilista
 */
export class RemoveServiceFromStylist {
  constructor(private stylistServiceRepository: IStylistServiceRepository) {}

  /**
   * Ejecuta la eliminación de la asignación estilista-servicio
   * @param stylistId - ID único del estilista
   * @param serviceId - ID único del servicio
   * @returns Promise que se resuelve cuando la eliminación es exitosa
   * @throws NotFoundError si la asignación no existe
   */
  async execute(stylistId: string, serviceId: string): Promise<void> {
    const exists = await this.stylistServiceRepository.existsAssignment(stylistId, serviceId);
    if (!exists) {
      throw new NotFoundError('Stylist service assignment', `${stylistId}-${serviceId}`);
    }

    await this.stylistServiceRepository.delete(stylistId, serviceId);
  }
}
