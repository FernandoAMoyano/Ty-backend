import { IServiceRepository } from '../../domain/repositories/IServiceRepository';
import { IAppointmentRepository } from '../../../appointments/domain/repositories/IAppointmentRepository';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { BusinessRuleError } from '../../../../shared/exceptions/BusinessRuleError';

/**
 * Caso de uso para eliminar permanentemente un servicio del sistema
 * Valida que no existan citas activas antes de eliminar
 */
export class DeleteService {
  constructor(
    private serviceRepository: IServiceRepository,
    private appointmentRepository: IAppointmentRepository,
  ) {}

  /**
   * Ejecuta la eliminación de un servicio
   * @param id - ID único del servicio a eliminar
   * @returns Promise que se resuelve cuando la eliminación es exitosa
   * @throws NotFoundError si el servicio no existe
   * @throws BusinessRuleError si el servicio tiene citas activas
   */
  async execute(id: string): Promise<void> {
    const exists = await this.serviceRepository.existsById(id);
    if (!exists) {
      throw new NotFoundError('Service', id);
    }

    // Validar que no existan citas activas con este servicio
    const hasActiveAppointments = await this.appointmentRepository.existsActiveByServiceId(id);
    if (hasActiveAppointments) {
      throw new BusinessRuleError(
        'Cannot delete service: it has active appointments',
      );
    }

    await this.serviceRepository.delete(id);
  }
}
