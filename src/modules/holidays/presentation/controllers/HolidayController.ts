import { Request, Response, NextFunction } from 'express';
import { CreateHoliday } from '../../application/use-cases/CreateHoliday';
import { GetHolidayById } from '../../application/use-cases/GetHolidayById';
import { GetHolidays } from '../../application/use-cases/GetHolidays';
import { GetHolidaysByYear } from '../../application/use-cases/GetHolidaysByYear';
import { GetUpcomingHolidays } from '../../application/use-cases/GetUpcomingHolidays';
import { UpdateHoliday } from '../../application/use-cases/UpdateHoliday';
import { DeleteHoliday } from '../../application/use-cases/DeleteHoliday';
import { CheckIsHoliday } from '../../application/use-cases/CheckIsHoliday';
import { CreateScheduleException } from '../../application/use-cases/CreateScheduleException';
import { GetScheduleExceptionById } from '../../application/use-cases/GetScheduleExceptionById';
import { GetScheduleExceptions } from '../../application/use-cases/GetScheduleExceptions';
import { GetScheduleExceptionsByHoliday } from '../../application/use-cases/GetScheduleExceptionsByHoliday';
import { GetUpcomingScheduleExceptions } from '../../application/use-cases/GetUpcomingScheduleExceptions';
import { UpdateScheduleException } from '../../application/use-cases/UpdateScheduleException';
import { DeleteScheduleException } from '../../application/use-cases/DeleteScheduleException';

/**
 * Controlador para el módulo de feriados y excepciones de horario
 * @description Maneja las peticiones HTTP relacionadas con feriados y excepciones
 */
export class HolidayController {
  constructor(
    // Holiday Use Cases
    private readonly createHoliday: CreateHoliday,
    private readonly getHolidayById: GetHolidayById,
    private readonly getHolidays: GetHolidays,
    private readonly getHolidaysByYear: GetHolidaysByYear,
    private readonly getUpcomingHolidays: GetUpcomingHolidays,
    private readonly updateHoliday: UpdateHoliday,
    private readonly deleteHoliday: DeleteHoliday,
    private readonly checkIsHoliday: CheckIsHoliday,
    // ScheduleException Use Cases
    private readonly createScheduleException: CreateScheduleException,
    private readonly getScheduleExceptionById: GetScheduleExceptionById,
    private readonly getScheduleExceptions: GetScheduleExceptions,
    private readonly getScheduleExceptionsByHoliday: GetScheduleExceptionsByHoliday,
    private readonly getUpcomingScheduleExceptions: GetUpcomingScheduleExceptions,
    private readonly updateScheduleException: UpdateScheduleException,
    private readonly deleteScheduleException: DeleteScheduleException,
  ) {}

  // =====================
  // HOLIDAY ENDPOINTS
  // =====================

  /**
   * Crea un nuevo feriado
   * POST /holidays
   */
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const holiday = await this.createHoliday.execute(req.body);

      res.status(201).json({
        success: true,
        message: 'Holiday created successfully',
        data: holiday,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene un feriado por ID
   * GET /holidays/:id
   */
  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const holiday = await this.getHolidayById.execute(id);

      res.json({
        success: true,
        message: 'Holiday retrieved successfully',
        data: holiday,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene todos los feriados con filtros y paginación
   * GET /holidays
   */
  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = {
        year: req.query.year ? Number(req.query.year) : undefined,
        month: req.query.month ? Number(req.query.month) : undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        name: req.query.name as string | undefined,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      };

      const result = await this.getHolidays.execute(filters);

      res.json({
        success: true,
        message: 'Holidays retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene feriados por año
   * GET /holidays/year/:year
   */
  getByYear = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const year = Number(req.params.year);
      const holidays = await this.getHolidaysByYear.execute(year);

      res.json({
        success: true,
        message: 'Holidays by year retrieved successfully',
        data: holidays,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene próximos feriados
   * GET /holidays/upcoming
   */
  getUpcoming = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 5;
      const holidays = await this.getUpcomingHolidays.execute(limit);

      res.json({
        success: true,
        message: 'Upcoming holidays retrieved successfully',
        data: holidays,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Verifica si una fecha es feriado
   * GET /holidays/check/:date
   */
  checkDate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { date } = req.params;
      const result = await this.checkIsHoliday.execute(date);

      res.json({
        success: true,
        message: 'Date checked successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Actualiza un feriado
   * PUT /holidays/:id
   */
  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const holiday = await this.updateHoliday.execute(id, req.body);

      res.json({
        success: true,
        message: 'Holiday updated successfully',
        data: holiday,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Elimina un feriado
   * DELETE /holidays/:id
   */
  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.deleteHoliday.execute(id);

      res.json({
        success: true,
        message: 'Holiday deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  // ============================
  // SCHEDULE EXCEPTION ENDPOINTS
  // ============================

  /**
   * Crea una nueva excepción de horario
   * POST /holidays/exceptions
   */
  createException = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const exception = await this.createScheduleException.execute(req.body);

      res.status(201).json({
        success: true,
        message: 'Schedule exception created successfully',
        data: exception,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene una excepción por ID
   * GET /holidays/exceptions/:id
   */
  getExceptionById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const exception = await this.getScheduleExceptionById.execute(id);

      res.json({
        success: true,
        message: 'Schedule exception retrieved successfully',
        data: exception,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene todas las excepciones con filtros y paginación
   * GET /holidays/exceptions
   */
  getAllExceptions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = {
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        holidayId: req.query.holidayId as string | undefined,
        reason: req.query.reason as string | undefined,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      };

      const result = await this.getScheduleExceptions.execute(filters);

      res.json({
        success: true,
        message: 'Schedule exceptions retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene excepciones de un feriado específico
   * GET /holidays/:holidayId/exceptions
   */
  getExceptionsByHoliday = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { holidayId } = req.params;
      const exceptions = await this.getScheduleExceptionsByHoliday.execute(holidayId);

      res.json({
        success: true,
        message: 'Schedule exceptions by holiday retrieved successfully',
        data: exceptions,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene próximas excepciones de horario
   * GET /holidays/exceptions/upcoming
   */
  getUpcomingExceptions = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 5;
      const exceptions = await this.getUpcomingScheduleExceptions.execute(limit);

      res.json({
        success: true,
        message: 'Upcoming schedule exceptions retrieved successfully',
        data: exceptions,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Actualiza una excepción de horario
   * PUT /holidays/exceptions/:id
   */
  updateException = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const exception = await this.updateScheduleException.execute(id, req.body);

      res.json({
        success: true,
        message: 'Schedule exception updated successfully',
        data: exception,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Elimina una excepción de horario
   * DELETE /holidays/exceptions/:id
   */
  deleteException = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.deleteScheduleException.execute(id);

      res.json({
        success: true,
        message: 'Schedule exception deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}
