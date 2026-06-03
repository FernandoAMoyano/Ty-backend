import { ServiceRepository } from '../../domain/repositories/ServiceRepository';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';

/**
 * Caso de uso para eliminar permanentemente un servicio del sistema
 */
export class DeleteService {
  constructor(private serviceRepository: ServiceRepository) {}

  /**
   * Ejecuta la eliminación de un servicio
   * @param id - ID único del servicio a eliminar
   * @returns Promise que se resuelve cuando la eliminación es exitosa
   * @throws NotFoundError si el servicio no existe
   */
  async execute(id: string): Promise<void> {
    const exists = await this.serviceRepository.existsById(id);
    if (!exists) {
      throw new NotFoundError('Service', id);
    }

    await this.serviceRepository.delete(id);
  }
}
