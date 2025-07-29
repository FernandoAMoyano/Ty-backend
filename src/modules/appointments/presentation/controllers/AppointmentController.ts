import { Request, Response } from 'express';
import { CreateAppointment } from '../../application/use-cases/CreateAppointment';
import { GetAppointmentById } from '../../application/use-cases/GetAppointmentById';
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

/**
 * Controlador de citas que maneja peticiones HTTP relacionadas con el sistema de citas
 * Coordina las operaciones de creación, actualización, consulta y gestión de citas
 */
export class AppointmentController {
  constructor(
    private createAppointmentUseCase: CreateAppointment,
    private getAppointmentByIdUseCase: GetAppointmentById,
    private cancelAppointmentUseCase: CancelAppointment,
    private getAvailableSlotsUseCase: GetAvailableSlots,
    private confirmAppointmentUseCase: ConfirmAppointment,
    private updateAppointmentUseCase: UpdateAppointment,
  ) {}

  /**
   * Crea una nueva cita en el sistema
   * @description Crea una nueva cita validando disponibilidad y reglas de negocio
   * @route POST /appointments
   * @param req - Request de Express con CreateAppointmentDto en el body y usuario autenticado
   * @param res - Response de Express
   * @returns Promise<Response | void>
   * @responseStatus 201 - Cita creada exitosamente
   * @throws ValidationError si los datos no son válidos
   * @throws NotFoundError si alguna entidad relacionada no existe
   * @throws ConflictError si hay conflictos de horario
   * @throws UnauthorizedError si no hay autenticación
   */
  async createAppointment(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const createDto: CreateAppointmentDto = req.body;
      const result = await this.createAppointmentUseCase.execute(createDto, userId);

      return res.status(201).json({
        success: true,
        data: result,
        message: 'Appointment created successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene una cita específica por su ID
   * @description Retorna información completa de una cita específica
   * @route GET /appointments/:id
   * @param req - Request de Express con ID de cita en los parámetros
   * @param res - Response de Express
   * @returns Promise<Response | void>
   * @responseStatus 200 - Cita encontrada exitosamente
   * @throws NotFoundError si la cita no existe
   * @throws ValidationError si el ID no es válido
   */
  async getAppointmentById(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const { id } = req.params;

      const result = await this.getAppointmentByIdUseCase.execute(id);

      return res.status(200).json({
        success: true,
        data: result,
        message: 'Appointment retrieved successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene todas las citas de un cliente específico
   * @description Retorna lista de citas ordenada por fecha para un cliente
   * @route GET /appointments/client/:clientId
   * @param req - Request de Express con ID de cliente en los parámetros
   * @param res - Response de Express
   * @returns Promise<Response | void>
   * @responseStatus 200 - Citas obtenidas exitosamente
   * @throws NotFoundError si el cliente no existe
   * @throws ValidationError si el ID de cliente no es válido
   */
  async getAppointmentsByClient(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<Response | void> {
    try {
      const { clientId } = req.params;

      // TODO: Implementar el caso de uso GetAppointmentsByClient
      // const result = await this.getAppointmentsByClient.execute(clientId);

      return res.status(200).json({
        success: true,
        data: { clientId, message: 'GetAppointmentsByClient use case not implemented yet' },
        message: 'Client appointments retrieved successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene todas las citas de un estilista específico
   * @description Retorna lista de citas ordenada por fecha para un estilista
   * @route GET /appointments/stylist/:stylistId
   * @param req - Request de Express con ID de estilista en los parámetros
   * @param res - Response de Express
   * @returns Promise<Response | void>
   * @responseStatus 200 - Citas obtenidas exitosamente
   * @throws NotFoundError si el estilista no existe
   * @throws ValidationError si el ID de estilista no es válido
   */
  async getAppointmentsByStylist(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<Response | void> {
    try {
      const { stylistId } = req.params;

      // TODO: Implementar el caso de uso GetAppointmentsByStylist
      // const result = await this.getAppointmentsByStylist.execute(stylistId);

      return res.status(200).json({
        success: true,
        data: { stylistId, message: 'GetAppointmentsByStylist use case not implemented yet' },
        message: 'Stylist appointments retrieved successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene citas filtradas por rango de fechas
   * @description Retorna citas dentro del rango de fechas especificado
   * @route GET /appointments/date-range?startDate=&endDate=
   * @param req - Request de Express con fechas en query parameters
   * @param res - Response de Express
   * @returns Promise<Response | void>
   * @responseStatus 200 - Citas obtenidas exitosamente
   * @throws ValidationError si las fechas no son válidas
   */
  async getAppointmentsByDateRange(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<Response | void> {
    try {
      const { startDate, endDate } = req.query;

      // TODO: Implementar el caso de uso GetAppointmentsByDateRange
      // const result = await this.getAppointmentsByDateRange.execute(
      //   new Date(startDate as string),
      //   new Date(endDate as string)
      // );

      return res.status(200).json({
        success: true,
        data: {
          startDate,
          endDate,
          message: 'GetAppointmentsByDateRange use case not implemented yet',
        },
        message: 'Appointments retrieved successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza una cita existente
   * @description Modifica datos de una cita validando reglas de negocio
   * @route PUT /appointments/:id
   * @param req - Request de Express con UpdateAppointmentDto en el body
   * @param res - Response de Express
   * @returns Promise<Response | void>
   * @responseStatus 200 - Cita actualizada exitosamente
   * @throws NotFoundError si la cita no existe
   * @throws ValidationError si los datos no son válidos
   * @throws ConflictError si hay conflictos de horario
   * @throws UnauthorizedError si no tiene permisos
   */
  async updateAppointment(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const updateDto: UpdateAppointmentDto = req.body;
      const result = await this.updateAppointmentUseCase.execute(id, updateDto, userId);

      return res.status(200).json({
        success: true,
        data: result,
        message: 'Appointment updated successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Confirma una cita pendiente
   * @description Marca una cita como confirmada y actualiza su estado
   * @route POST /appointments/:id/confirm
   * @param req - Request de Express con ID de cita en los parámetros y datos de confirmación
   * @param res - Response de Express
   * @returns Promise<Response | void>
   * @responseStatus 200 - Cita confirmada exitosamente
   * @throws NotFoundError si la cita no existe
   * @throws ValidationError si los datos no son válidos
   * @throws BusinessRuleError si no se puede confirmar según reglas de negocio
   * @throws UnauthorizedError si no hay autenticación o permisos
   */
  async confirmAppointment(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const confirmDto: ConfirmAppointmentDto = req.body;
      const result = await this.confirmAppointmentUseCase.execute(id, confirmDto, userId);

      return res.status(200).json({
        success: true,
        data: result,
        message: 'Appointment confirmed successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cancela una cita existente
   * @description Marca una cita como cancelada con razón opcional y validaciones de negocio
   * @route POST /appointments/:id/cancel
   * @param req - Request de Express con ID de cita y datos de cancelación
   * @param res - Response de Express
   * @returns Promise<Response | void>
   * @responseStatus 200 - Cita cancelada exitosamente
   * @throws NotFoundError si la cita no existe
   * @throws ValidationError si los datos no son válidos
   * @throws BusinessRuleError si no se puede cancelar según reglas de negocio
   * @throws UnauthorizedError si no hay autenticación o permisos
   */
  async cancelAppointment(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const cancelDto: CancelAppointmentDto = req.body;
      const result = await this.cancelAppointmentUseCase.execute(id, cancelDto, userId);

      return res.status(200).json({
        success: true,
        data: result,
        message: 'Appointment cancelled successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene slots de tiempo disponibles para agendar citas
   * @description Retorna horarios disponibles basados en criterios de filtrado
   * @route GET /appointments/available-slots?date=&duration=&stylistId=&serviceIds=
   * @param req - Request de Express con parámetros de consulta
   * @param res - Response de Express
   * @returns Promise<Response | void>
   * @responseStatus 200 - Slots disponibles obtenidos exitosamente
   * @throws ValidationError si los parámetros no son válidos
   * @throws BusinessRuleError si la fecha no es válida para agendar
   */
  async getAvailableSlots(req: Request, res: Response): Promise<Response | void> {
    try {
      const { date, duration, stylistId, serviceIds } = req.query;

      // Construir DTO con validación de parámetros
      const getAvailableSlotsDto: GetAvailableSlotsDto = {
        date: date as string,
        duration: duration ? parseInt(duration as string) : undefined,
        stylistId: stylistId as string | undefined,
        serviceIds: serviceIds
          ? Array.isArray(serviceIds)
            ? (serviceIds as string[])
            : [serviceIds as string]
          : undefined,
      };

      // Ejecutar caso de uso
      const result = await this.getAvailableSlotsUseCase.execute(getAvailableSlotsDto);

      return res.status(200).json({
        success: true,
        data: result,
        message: 'Available slots retrieved successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de citas para dashboard administrativo
   * @description Retorna métricas y estadísticas de citas del sistema
   * @route GET /appointments/statistics
   * @param req - Request de Express con posibles filtros en query
   * @param res - Response de Express
   * @returns Promise<Response | void>
   * @responseStatus 200 - Estadísticas obtenidas exitosamente
   */

  async getAppointmentStatistics(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<Response | void> {
    try {
      // TODO: Implementar el caso de uso GetAppointmentStatistics
      // const result = await this.getAppointmentStatistics.execute();

      return res.status(200).json({
        success: true,
        data: { message: 'GetAppointmentStatistics use case not implemented yet' },
        message: 'Appointment statistics retrieved successfully',
      });
    } catch (error) {
      throw error;
    }
  }
}
