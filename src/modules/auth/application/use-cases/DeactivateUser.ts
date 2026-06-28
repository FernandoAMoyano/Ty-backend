import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IRoleRepository } from '../../domain/repositories/IRoleRepository';
import { IStylistRepository } from '../../../services/domain/repositories/IStylistRepository';
import { IStylistServiceRepository } from '../../../services/domain/repositories/IStylistServiceRepository';
import { IAppointmentRepository } from '../../../appointments/domain/repositories/IAppointmentRepository';
import { IAppointmentStatusRepository } from '../../../appointments/domain/repositories/IAppointmentStatusRepository';
import { AppointmentStatusEnum } from '../../../appointments/domain/entities/AppointmentStatus';
import { DeactivateUserResponseDto } from '../dto/response/DeactivateUserResponseDto';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { BusinessRuleError } from '../../../../shared/exceptions/BusinessRuleError';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';

/**
 * Caso de uso para desactivar un usuario del sistema
 * Si el usuario es STYLIST, ejecuta acciones en cascada:
 * - Cancela citas activas (PENDING/CONFIRMED) con razón "Stylist deactivated"
 * - Desactiva asignaciones StylistService (isOffering = false)
 */
export class DeactivateUser {
  constructor(
    private userRepository: IUserRepository,
    private roleRepository: IRoleRepository,
    private stylistRepository: IStylistRepository,
    private stylistServiceRepository: IStylistServiceRepository,
    private appointmentRepository: IAppointmentRepository,
    private appointmentStatusRepository: IAppointmentStatusRepository,
  ) {}

  /**
   * Ejecuta la desactivación del usuario con cascada si es STYLIST
   * @param userId - ID del usuario a desactivar
   * @returns Resumen de la desactivación y acciones en cascada
   * @throws ValidationError si el ID no es válido
   * @throws NotFoundError si el usuario no existe
   * @throws BusinessRuleError si el usuario ya está inactivo
   */
  async execute(userId: string): Promise<DeactivateUserResponseDto> {
    // 1. Validar entrada
    this.validateInput(userId);

    // 2. Buscar usuario
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }

    // 3. Verificar que el usuario está activo
    if (!user.isActive) {
      throw new BusinessRuleError('User is already deactivated');
    }

    // 4. Obtener el rol del usuario
    const role = await this.roleRepository.findById(user.roleId);
    if (!role) {
      throw new NotFoundError('Role', user.roleId);
    }

    // 5. Desactivar usuario
    user.deactivate();
    await this.userRepository.update(user);

    // 6. Ejecutar cascada si es STYLIST
    let cascadeSummary: { appointmentsCancelled: number; servicesDeactivated: number } | undefined;

    if (role.name === 'STYLIST') {
      cascadeSummary = await this.executeStylistCascade(userId);
    }

    // 7. Retornar resumen
    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      cascadeApplied: role.name === 'STYLIST',
      cascadeSummary,
    };
  }

  /**
   * Valida los datos de entrada
   * @param userId - ID del usuario a validar
   * @throws ValidationError si el ID no es válido
   */
  private validateInput(userId: string): void {
    if (!userId || userId.trim().length === 0) {
      throw new ValidationError('User ID is required');
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      throw new ValidationError('User ID must be a valid UUID');
    }
  }

  /**
   * Ejecuta las acciones en cascada para un estilista desactivado
   * - Cancela citas activas (PENDING/CONFIRMED)
   * - Desactiva asignaciones StylistService
   * @param userId - ID del usuario estilista
   * @returns Resumen con conteo de citas canceladas y servicios desactivados
   */
  private async executeStylistCascade(
    userId: string,
  ): Promise<{ appointmentsCancelled: number; servicesDeactivated: number }> {
    // Buscar estilista por userId
    const stylist = await this.stylistRepository.findByUserId(userId);
    if (!stylist) {
      // El usuario tiene rol STYLIST pero no tiene registro en la tabla Stylist
      // No hay cascada que ejecutar
      return { appointmentsCancelled: 0, servicesDeactivated: 0 };
    }

    // Ejecutar ambas cascadas
    // cancelActiveAppointments recibe User.id porque Appointment.stylistId ahora almacena User.id
    // deactivateStylistServices recibe Stylist.id porque StylistService.stylistId sigue apuntando a Stylist.id
    const [appointmentsCancelled, servicesDeactivated] = await Promise.all([
      this.cancelActiveAppointments(userId),
      this.deactivateStylistServices(stylist.id),
    ]);

    return { appointmentsCancelled, servicesDeactivated };
  }

  /**
   * Cancela todas las citas activas (PENDING/CONFIRMED) del estilista
   * @param stylistUserId - ID del usuario estilista (User.id), ya que Appointment.stylistId almacena User.id
   * @returns Cantidad de citas canceladas
   */
  private async cancelActiveAppointments(stylistUserId: string): Promise<number> {
    // Obtener el estado CANCELLED
    const cancelledStatus = await this.appointmentStatusRepository.findByName(
      AppointmentStatusEnum.CANCELLED,
    );
    if (!cancelledStatus) {
      throw new NotFoundError('AppointmentStatus', AppointmentStatusEnum.CANCELLED);
    }

    // Obtener estados activos (PENDING y CONFIRMED)
    const [pendingStatus, confirmedStatus] = await Promise.all([
      this.appointmentStatusRepository.findByName(AppointmentStatusEnum.PENDING),
      this.appointmentStatusRepository.findByName(AppointmentStatusEnum.CONFIRMED),
    ]);

    const activeStatusIds = [pendingStatus?.id, confirmedStatus?.id].filter(Boolean) as string[];

    if (activeStatusIds.length === 0) {
      return 0;
    }

    // Obtener todas las citas del estilista
    const allAppointments = await this.appointmentRepository.findByStylistId(stylistUserId);

    // Filtrar solo las activas (PENDING/CONFIRMED)
    const activeAppointments = allAppointments.filter(a =>
      activeStatusIds.includes(a.statusId),
    );

    // Cancelar cada cita activa
    for (const appointment of activeAppointments) {
      appointment.markAsCancelled(
        cancelledStatus.id,
        'Stylist deactivated',
        'system',
      );
      await this.appointmentRepository.update(appointment);
    }

    return activeAppointments.length;
  }

  /**
   * Desactiva todas las asignaciones StylistService del estilista
   * @param stylistId - ID del estilista
   * @returns Cantidad de asignaciones desactivadas
   */
  private async deactivateStylistServices(stylistId: string): Promise<number> {
    const stylistServices = await this.stylistServiceRepository.findByStylist(stylistId);

    // Filtrar solo las que están activas
    const activeServices = stylistServices.filter(ss => ss.isOffering);

    // Desactivar cada asignación
    for (const stylistService of activeServices) {
      stylistService.stopOffering();
      await this.stylistServiceRepository.update(stylistService);
    }

    return activeServices.length;
  }
}
