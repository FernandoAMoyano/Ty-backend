import { Request, Response } from 'express';
import { CreateAppointment } from '../../application/use-cases/CreateAppointment';
import { GetAppointmentById } from '../../application/use-cases/GetAppointmentById';
import { GetAppointmentsByClient } from '../../application/use-cases/GetAppointmentsByClient';
import { GetAppointmentsByStylist } from '../../application/use-cases/GetAppointmentsByStylist';
import { CancelAppointment } from '../../application/use-cases/CancelAppointment';
import { GetAvailableSlots } from '../../application/use-cases/GetAvailableSlots';
import { ConfirmAppointment } from '../../application/use-cases/ConfirmAppointment';
import { UpdateAppointment } from '../../application/use-cases/UpdateAppointment';
import { AuthenticatedRequest } from '../../../auth/presentation/middleware/AuthMiddleware';
import { CreateAppointmentDto } from '../../application/dto/request/CreateAppointmentDto';
import { UpdateAppointmentDto } from '../../application/dto/request/UpdateAppointmentDto';
import { CancelAppointmentDto } from '../../application/dto/request/CancelAppointmentDto';
import { ConfirmAppointmentDto } from '../../application/dto/request/ConfirmAppointmentDto';
import { GetAvailableSlotsDto } from '../../application/dto/request/GetAvailableSlotsDto';
import { UnauthorizedError } from '../../../../shared/exceptions/UnauthorizedError';

/**
 * Controlador de citas que maneja peticiones HTTP relacionadas con el sistema de citas
 * Coordina las operaciones de creación, actualización, consulta y gestión de citas
 * Los errores burbujean al errorHandler global via .catch(next) en AppointmentRoutes
 */
export class AppointmentController {
  constructor(
    private createAppointmentUseCase: CreateAppointment,
    private getAppointmentByIdUseCase: GetAppointmentById,
    private getAppointmentsByClientUseCase: GetAppointmentsByClient,
    private getAppointmentsByStylistUseCase: GetAppointmentsByStylist,
    private cancelAppointmentUseCase: CancelAppointment,
    private getAvailableSlotsUseCase: GetAvailableSlots,
    private confirmAppointmentUseCase: ConfirmAppointment,
    private updateAppointmentUseCase: UpdateAppointment,
  ) {}

  /**
   * Crea una nueva cita en el sistema
   * @route POST /appointments
   * @param req - Request de Express con CreateAppointmentDto en el body y usuario autenticado
   * @param res - Response de Express
   * @returns Promise<Response>
   * @responseStatus 201 - Cita creada exitosamente
   * @throws UnauthorizedError si no hay autenticación
   * @throws ValidationError si los datos no son válidos
   * @throws NotFoundError si alguna entidad relacionada no existe
   * @throws ConflictError si hay conflictos de horario
   */
  async createAppointment(req: AuthenticatedRequest, res: Response): Promise<Response> {
    if (!req.user?.userId) {
      throw new UnauthorizedError('Authentication required');
    }

    const createDto: CreateAppointmentDto = req.body;
    const result = await this.createAppointmentUseCase.execute(createDto, req.user.userId);

    return res.status(201).json({
      success: true,
      data: result,
      message: 'Appointment created successfully',
    });
  }

  /**
   * Obtiene una cita específica por su ID
   * @route GET /appointments/:id
   * @param req - Request de Express con ID de cita en los parámetros
   * @param res - Response de Express
   * @returns Promise<Response>
   * @responseStatus 200 - Cita encontrada exitosamente
   * @throws ValidationError si el ID no es válido
   * @throws NotFoundError si la cita no existe
   */
  async getAppointmentById(req: AuthenticatedRequest, res: Response): Promise<Response> {
    if (!req.user?.userId || !req.user?.roleName) {
      throw new UnauthorizedError('Authentication required');
    }

    const { id } = req.params;
    const result = await this.getAppointmentByIdUseCase.execute(
      id,
      req.user.userId,
      req.user.roleName,
    );

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Appointment retrieved successfully',
    });
  }

  /**
   * Obtiene todas las citas de un cliente específico, paginadas
   * @route GET /appointments/client/:clientId?page=&limit=
   * @param req - Request de Express con ID de cliente en los parámetros y paginación en query
   * @param res - Response de Express
   * @returns Promise<Response>
   * @responseStatus 200 - Citas obtenidas exitosamente
   * @throws ValidationError si el ID de cliente no es válido
   */
  async getAppointmentsByClient(req: AuthenticatedRequest, res: Response): Promise<Response> {
    if (!req.user?.userId || !req.user?.roleName) {
      throw new UnauthorizedError('Authentication required');
    }

    const { clientId } = req.params;
    const { page, limit } = req.query;
    const result = await this.getAppointmentsByClientUseCase.execute(
      clientId,
      req.user.userId,
      req.user.roleName,
      page ? parseInt(page as string, 10) : undefined,
      limit ? parseInt(limit as string, 10) : undefined,
    );

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Client appointments retrieved successfully',
    });
  }

  /**
   * Obtiene todas las citas de un estilista específico, paginadas
   * @route GET /appointments/stylist/:stylistId?page=&limit=
   * @param req - Request de Express con ID de estilista en los parámetros y paginación en query
   * @param res - Response de Express
   * @returns Promise<Response>
   * @responseStatus 200 - Citas obtenidas exitosamente
   * @throws ValidationError si el ID de estilista no es válido
   */
  async getAppointmentsByStylist(req: AuthenticatedRequest, res: Response): Promise<Response> {
    if (!req.user?.userId || !req.user?.roleName) {
      throw new UnauthorizedError('Authentication required');
    }

    const { stylistId } = req.params;
    const { page, limit } = req.query;
    const result = await this.getAppointmentsByStylistUseCase.execute(
      stylistId,
      req.user.userId,
      req.user.roleName,
      page ? parseInt(page as string, 10) : undefined,
      limit ? parseInt(limit as string, 10) : undefined,
    );

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Stylist appointments retrieved successfully',
    });
  }

  /**
   * Actualiza una cita existente
   * @route PUT /appointments/:id
   * @param req - Request de Express con UpdateAppointmentDto en el body
   * @param res - Response de Express
   * @returns Promise<Response>
   * @responseStatus 200 - Cita actualizada exitosamente
   * @throws UnauthorizedError si no hay autenticación o permisos
   * @throws NotFoundError si la cita no existe
   * @throws ValidationError si los datos no son válidos
   * @throws ConflictError si hay conflictos de horario
   * @throws BusinessRuleError si viola reglas de negocio
   */
  async updateAppointment(req: AuthenticatedRequest, res: Response): Promise<Response> {
    if (!req.user?.userId) {
      throw new UnauthorizedError('Authentication required');
    }

    const { id } = req.params;
    const updateDto: UpdateAppointmentDto = req.body;
    const result = await this.updateAppointmentUseCase.execute(
      id,
      updateDto,
      req.user.userId,
      req.user.roleName!,
    );

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Appointment updated successfully',
    });
  }

  /**
   * Confirma una cita pendiente
   * @route POST /appointments/:id/confirm
   * @param req - Request de Express con ID de cita y datos de confirmación
   * @param res - Response de Express
   * @returns Promise<Response>
   * @responseStatus 200 - Cita confirmada exitosamente
   * @throws UnauthorizedError si no hay autenticación o permisos
   * @throws NotFoundError si la cita no existe
   * @throws ValidationError si los datos no son válidos
   * @throws BusinessRuleError si no se puede confirmar según reglas de negocio
   */
  async confirmAppointment(req: AuthenticatedRequest, res: Response): Promise<Response> {
    if (!req.user?.userId) {
      throw new UnauthorizedError('Authentication required');
    }

    const { id } = req.params;
    const confirmDto: ConfirmAppointmentDto = req.body;
    const result = await this.confirmAppointmentUseCase.execute(
      id,
      confirmDto,
      req.user.userId,
      req.user.roleName!,
    );

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Appointment confirmed successfully',
    });
  }

  /**
   * Cancela una cita existente
   * @route POST /appointments/:id/cancel
   * @param req - Request de Express con ID de cita y datos de cancelación
   * @param res - Response de Express
   * @returns Promise<Response>
   * @responseStatus 200 - Cita cancelada exitosamente
   * @throws UnauthorizedError si no hay autenticación o permisos
   * @throws NotFoundError si la cita no existe
   * @throws ValidationError si los datos no son válidos
   * @throws BusinessRuleError si no se puede cancelar según reglas de negocio
   */
  async cancelAppointment(req: AuthenticatedRequest, res: Response): Promise<Response> {
    if (!req.user?.userId) {
      throw new UnauthorizedError('Authentication required');
    }

    const { id } = req.params;
    const cancelDto: CancelAppointmentDto = req.body;
    const result = await this.cancelAppointmentUseCase.execute(
      id,
      cancelDto,
      req.user.userId,
      req.user.roleName!,
    );

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Appointment cancelled successfully',
    });
  }

  /**
   * Obtiene slots de tiempo disponibles para agendar citas
   * @route GET /appointments/available-slots?date=&duration=&stylistId=&serviceIds=
   * @param req - Request de Express con parámetros de consulta
   * @param res - Response de Express
   * @returns Promise<Response>
   * @responseStatus 200 - Slots disponibles obtenidos exitosamente
   * @throws ValidationError si los parámetros no son válidos
   * @throws BusinessRuleError si la fecha no es válida para agendar
   */
  async getAvailableSlots(req: Request, res: Response): Promise<Response> {
    const { date, duration, stylistId, serviceIds } = req.query;

    const getAvailableSlotsDto: GetAvailableSlotsDto = {
      date: date as string,
      duration: duration ? parseInt(duration as string, 10) : undefined,
      stylistId: stylistId as string | undefined,
      serviceIds: serviceIds
        ? Array.isArray(serviceIds)
          ? (serviceIds as string[])
          : [serviceIds as string]
        : undefined,
    };

    const result = await this.getAvailableSlotsUseCase.execute(getAvailableSlotsDto);

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Available slots retrieved successfully',
    });
  }
}
