import { IServiceRepository } from '../../domain/repositories/IServiceRepository';
import { IAppointmentRepository } from '../../../appointments/domain/repositories/IAppointmentRepository';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { BusinessRuleError } from '../../../../shared/exceptions/BusinessRuleError';

/**
 * Caso de uso para eliminar permanentemente un servicio del sistema
 * Valida que no existan citas asociadas (activas o históricas) antes de eliminar
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
   * @throws BusinessRuleError si el servicio tiene citas asociadas (activas o históricas)
   * @description El hard-delete borra en cascada la relación M2M _AppointmentToService,
   * por lo que se bloquea si existe CUALQUIER cita asociada (no solo activas) para no
   * destruir el registro histórico de servicios de citas ya completadas/canceladas.
   * Para retirar un servicio con historial, usar PATCH /services/:id/deactivate (F8).
   */
  async execute(id: string): Promise<void> {
    const exists = await this.serviceRepository.existsById(id);
    if (!exists) {
      throw new NotFoundError('Service', id);
    }

    // Validar que no existan citas asociadas (activas o históricas) con este servicio
    const hasAssociatedAppointments = await this.appointmentRepository.existsByServiceId(id);
    if (hasAssociatedAppointments) {
      throw new BusinessRuleError(
        'Cannot delete service: it has associated appointments (use deactivate instead)',
      );
    }

    await this.serviceRepository.delete(id);
  }
}
