import { PrismaClient } from '@prisma/client';

// Repositories
import { IHolidayRepository } from './domain/repositories/IHolidayRepository';
import { IScheduleExceptionRepository } from './domain/repositories/IScheduleExceptionRepository';
import { PrismaHolidayRepository } from './infrastructure/persistence/PrismaHolidayRepository';
import { PrismaScheduleExceptionRepository } from './infrastructure/persistence/PrismaScheduleExceptionRepository';

// Holiday Use Cases
import { CreateHoliday } from './application/use-cases/CreateHoliday';
import { GetHolidayById } from './application/use-cases/GetHolidayById';
import { GetHolidays } from './application/use-cases/GetHolidays';
import { GetHolidaysByYear } from './application/use-cases/GetHolidaysByYear';
import { GetUpcomingHolidays } from './application/use-cases/GetUpcomingHolidays';
import { UpdateHoliday } from './application/use-cases/UpdateHoliday';
import { DeleteHoliday } from './application/use-cases/DeleteHoliday';
import { CheckIsHoliday } from './application/use-cases/CheckIsHoliday';

// ScheduleException Use Cases
import { CreateScheduleException } from './application/use-cases/CreateScheduleException';
import { GetScheduleExceptionById } from './application/use-cases/GetScheduleExceptionById';
import { GetScheduleExceptions } from './application/use-cases/GetScheduleExceptions';
import { GetScheduleExceptionsByHoliday } from './application/use-cases/GetScheduleExceptionsByHoliday';
import { GetUpcomingScheduleExceptions } from './application/use-cases/GetUpcomingScheduleExceptions';
import { UpdateScheduleException } from './application/use-cases/UpdateScheduleException';
import { DeleteScheduleException } from './application/use-cases/DeleteScheduleException';

// Presentation
import { HolidayController } from './presentation/controllers/HolidayController';
import { HolidayRoutes } from './presentation/routes/HolidayRoutes';
import { AuthMiddleware } from '../auth/presentation/middleware/AuthMiddleware';

/**
 * Contenedor de dependencias para el módulo de feriados
 * @description Implementa el patrón Singleton y configura todas las dependencias del módulo
 * usando inyección de dependencias manual siguiendo Clean Architecture
 */
export class HolidayContainer {
  /** Instancia singleton del contenedor */
  private static instance: HolidayContainer;

  // Repositories
  private _holidayRepository: IHolidayRepository;
  private _scheduleExceptionRepository: IScheduleExceptionRepository;

  // Holiday Use Cases
  private _createHoliday: CreateHoliday;
  private _getHolidayById: GetHolidayById;
  private _getHolidays: GetHolidays;
  private _getHolidaysByYear: GetHolidaysByYear;
  private _getUpcomingHolidays: GetUpcomingHolidays;
  private _updateHoliday: UpdateHoliday;
  private _deleteHoliday: DeleteHoliday;
  private _checkIsHoliday: CheckIsHoliday;

  // ScheduleException Use Cases
  private _createScheduleException: CreateScheduleException;
  private _getScheduleExceptionById: GetScheduleExceptionById;
  private _getScheduleExceptions: GetScheduleExceptions;
  private _getScheduleExceptionsByHoliday: GetScheduleExceptionsByHoliday;
  private _getUpcomingScheduleExceptions: GetUpcomingScheduleExceptions;
  private _updateScheduleException: UpdateScheduleException;
  private _deleteScheduleException: DeleteScheduleException;

  // Presentation
  private _holidayController: HolidayController;
  private _holidayRoutes: HolidayRoutes;

  /**
   * Constructor privado que inicializa todas las dependencias del módulo
   * @param prisma - Cliente Prisma para acceso a base de datos
   * @param authMiddleware - Middleware de autenticación del módulo auth
   */
  private constructor(
    private prisma: PrismaClient,
    private authMiddleware: AuthMiddleware,
  ) {
    this.setupDependencies();
  }

  /**
   * Obtiene la instancia singleton del contenedor
   * @param prisma - Cliente Prisma para inicialización
   * @param authMiddleware - Middleware de autenticación
   * @returns Instancia única del HolidayContainer
   */
  static getInstance(prisma: PrismaClient, authMiddleware: AuthMiddleware): HolidayContainer {
    if (!HolidayContainer.instance) {
      HolidayContainer.instance = new HolidayContainer(prisma, authMiddleware);
    }
    return HolidayContainer.instance;
  }

  /**
   * Configura todas las dependencias del módulo de feriados
   * @private
   */
  private setupDependencies(): void {
    // 1. Inicializar repositorios
    this._holidayRepository = new PrismaHolidayRepository(this.prisma);
    this._scheduleExceptionRepository = new PrismaScheduleExceptionRepository(this.prisma);

    // 2. Inicializar Holiday use cases
    this._createHoliday = new CreateHoliday(this._holidayRepository);
    this._getHolidayById = new GetHolidayById(this._holidayRepository);
    this._getHolidays = new GetHolidays(this._holidayRepository);
    this._getHolidaysByYear = new GetHolidaysByYear(this._holidayRepository);
    this._getUpcomingHolidays = new GetUpcomingHolidays(this._holidayRepository);
    this._updateHoliday = new UpdateHoliday(this._holidayRepository);
    this._deleteHoliday = new DeleteHoliday(
      this._holidayRepository,
      this._scheduleExceptionRepository,
    );
    this._checkIsHoliday = new CheckIsHoliday(this._holidayRepository);

    // 3. Inicializar ScheduleException use cases
    this._createScheduleException = new CreateScheduleException(
      this._scheduleExceptionRepository,
      this._holidayRepository,
    );
    this._getScheduleExceptionById = new GetScheduleExceptionById(this._scheduleExceptionRepository);
    this._getScheduleExceptions = new GetScheduleExceptions(this._scheduleExceptionRepository);
    this._getScheduleExceptionsByHoliday = new GetScheduleExceptionsByHoliday(
      this._scheduleExceptionRepository,
      this._holidayRepository,
    );
    this._getUpcomingScheduleExceptions = new GetUpcomingScheduleExceptions(
      this._scheduleExceptionRepository,
    );
    this._updateScheduleException = new UpdateScheduleException(
      this._scheduleExceptionRepository,
      this._holidayRepository,
    );
    this._deleteScheduleException = new DeleteScheduleException(this._scheduleExceptionRepository);

    // 4. Inicializar controller
    this._holidayController = new HolidayController(
      this._createHoliday,
      this._getHolidayById,
      this._getHolidays,
      this._getHolidaysByYear,
      this._getUpcomingHolidays,
      this._updateHoliday,
      this._deleteHoliday,
      this._checkIsHoliday,
      this._createScheduleException,
      this._getScheduleExceptionById,
      this._getScheduleExceptions,
      this._getScheduleExceptionsByHoliday,
      this._getUpcomingScheduleExceptions,
      this._updateScheduleException,
      this._deleteScheduleException,
    );

    // 5. Inicializar routes
    this._holidayRoutes = new HolidayRoutes(
      this._holidayController,
      this.authMiddleware,
    );
  }

  // =====================
  // GETTERS - PRESENTATION
  // =====================

  get holidayRoutes(): HolidayRoutes {
    return this._holidayRoutes;
  }

  get holidayController(): HolidayController {
    return this._holidayController;
  }

  // =====================
  // GETTERS - HOLIDAY USE CASES
  // =====================

  get createHoliday(): CreateHoliday {
    return this._createHoliday;
  }

  get getHolidayById(): GetHolidayById {
    return this._getHolidayById;
  }

  get getHolidays(): GetHolidays {
    return this._getHolidays;
  }

  get getHolidaysByYear(): GetHolidaysByYear {
    return this._getHolidaysByYear;
  }

  get getUpcomingHolidays(): GetUpcomingHolidays {
    return this._getUpcomingHolidays;
  }

  get updateHoliday(): UpdateHoliday {
    return this._updateHoliday;
  }

  get deleteHoliday(): DeleteHoliday {
    return this._deleteHoliday;
  }

  get checkIsHoliday(): CheckIsHoliday {
    return this._checkIsHoliday;
  }

  // =====================
  // GETTERS - SCHEDULE EXCEPTION USE CASES
  // =====================

  get createScheduleException(): CreateScheduleException {
    return this._createScheduleException;
  }

  get getScheduleExceptionById(): GetScheduleExceptionById {
    return this._getScheduleExceptionById;
  }

  get getScheduleExceptions(): GetScheduleExceptions {
    return this._getScheduleExceptions;
  }

  get getScheduleExceptionsByHoliday(): GetScheduleExceptionsByHoliday {
    return this._getScheduleExceptionsByHoliday;
  }

  get getUpcomingScheduleExceptions(): GetUpcomingScheduleExceptions {
    return this._getUpcomingScheduleExceptions;
  }

  get updateScheduleException(): UpdateScheduleException {
    return this._updateScheduleException;
  }

  get deleteScheduleException(): DeleteScheduleException {
    return this._deleteScheduleException;
  }

  // =====================
  // GETTERS - REPOSITORIES
  // =====================

  get holidayRepository(): IHolidayRepository {
    return this._holidayRepository;
  }

  get scheduleExceptionRepository(): IScheduleExceptionRepository {
    return this._scheduleExceptionRepository;
  }
}
