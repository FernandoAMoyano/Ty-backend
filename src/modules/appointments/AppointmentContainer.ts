import { PrismaClient } from '@prisma/client';
import { AppointmentController } from './presentation/controllers/AppointmentController';
import { AppointmentRoutes } from './presentation/routes/AppointmentRoutes';
import { AuthMiddleware } from '../auth/presentation/middleware/AuthMiddleware';

// Repositorios de dominio
import { AppointmentRepository } from './domain/repositories/AppointmentRepository';
import { AppointmentStatusRepository } from './domain/repositories/AppointmentStatusRepository';
import { ScheduleRepository } from './domain/repositories/ScheduleRepository';

// Repositorios de infraestructura
import { PrismaAppointmentRepository } from './infrastructure/persistence/PrismaAppointmentRepository';
import { PrismaAppointmentStatusRepository } from './infrastructure/persistence/PrismaAppointmentStatusRepository';
import { PrismaScheduleRepository } from './infrastructure/persistence/PrismaScheduleRepository';

// Repositorios de módulos externos
import { ServiceRepository } from '../services/domain/repositories/ServiceRepository';
import { StylistRepository } from '../services/domain/repositories/StylistRepository';
import { UserRepository } from '../auth/domain/repositories/User';
import { PrismaServiceRepository } from '../services/infrastructure/persistence/PrismaServiceRepository';
import { PrismaStylistRepository } from '../services/infrastructure/persistence/PrismaStylistRepository';
import { PrismaUserRepository } from '../auth/infrastructure/persistence/PrismaUserRepository';

// Casos de uso
import { CreateAppointment } from './application/use-cases/CreateAppointment';

/**
 * Contenedor de dependencias para el módulo de citas
 * Implementa el patrón Singleton y configura todas las dependencias del módulo appointments
 * usando inyección de dependencias manual
 */
export class AppointmentContainer {
  /** Instancia singleton del contenedor */
  private static instance: AppointmentContainer;

  private _appointmentController: AppointmentController;
  private _appointmentRoutes: AppointmentRoutes;

  // Use Cases
  private _createAppointment: CreateAppointment;

  // Repositories - Own module
  private _appointmentRepository: AppointmentRepository;
  private _appointmentStatusRepository: AppointmentStatusRepository;
  private _scheduleRepository: ScheduleRepository;

  // Repositories - External modules
  private _serviceRepository: ServiceRepository;
  private _stylistRepository: StylistRepository;
  private _userRepository: UserRepository;

  /**
   * Constructor privado que inicializa todas las dependencias del módulo
   * @param prisma - Cliente Prisma para acceso a base de datos
   * @param authMiddleware - Middleware de autenticación del módulo auth
   * @description Configura la cadena completa de dependencias siguiendo arquitectura hexagonal
   */
  constructor(
    private prisma: PrismaClient,
    private authMiddleware: AuthMiddleware,
  ) {
    this.setupDependencies();
  }

  /**
   * Obtiene la instancia singleton del contenedor
   * @param prisma - Cliente Prisma para inicialización
   * @param authMiddleware - Middleware de autenticación
   * @returns Instancia única del AppointmentContainer
   * @description Implementa patrón Singleton para asegurar una sola instancia
   */
  static getInstance(prisma: PrismaClient, authMiddleware: AuthMiddleware): AppointmentContainer {
    if (!AppointmentContainer.instance) {
      AppointmentContainer.instance = new AppointmentContainer(prisma, authMiddleware);
    }
    return AppointmentContainer.instance;
  }

  /**
   * Configura todas las dependencias del módulo de citas
   * @private
   * @description Inyecta dependencias siguiendo el orden: repositories -> use cases -> controllers
   */
  private setupDependencies(): void {
    // Own Module Repositories
    this._appointmentRepository = new PrismaAppointmentRepository(this.prisma);
    this._appointmentStatusRepository = new PrismaAppointmentStatusRepository(this.prisma);
    this._scheduleRepository = new PrismaScheduleRepository(this.prisma);

    // External Module Repositories
    this._serviceRepository = new PrismaServiceRepository(this.prisma);
    this._stylistRepository = new PrismaStylistRepository(this.prisma);
    this._userRepository = new PrismaUserRepository(this.prisma);

    // Use Cases - Solo CreateAppointment está implementado por ahora
    this._createAppointment = new CreateAppointment(
      this._appointmentRepository,
      this._appointmentStatusRepository,
      this._scheduleRepository,
      this._serviceRepository,
      this._stylistRepository,
      this._userRepository,
    );

    // HTTP Layer - Solo inyectamos el caso de uso implementado
    this._appointmentController = new AppointmentController(
      this._createAppointment,
      // TODO: Inyectar otros casos de uso cuando se implementen:
      // this._updateAppointmentUseCase,
      // this._cancelAppointmentUseCase,
      // this._confirmAppointmentUseCase,
      // this._getAppointmentByIdUseCase,
      // this._getAppointmentsByClientUseCase,
      // this._getAppointmentsByStylistUseCase,
      // this._getAvailableSlotsUseCase,
    );

    this._appointmentRoutes = new AppointmentRoutes(
      this._appointmentController,
      this.authMiddleware,
    );
  }

  // Getters para acceso externo

  /**
   * Obtiene el controlador de citas configurado
   * @returns Instancia de AppointmentController con todas sus dependencias inyectadas
   */
  get appointmentController(): AppointmentController {
    return this._appointmentController;
  }

  /**
   * Obtiene las rutas de citas configuradas
   * @returns Instancia de AppointmentRoutes con controller y middleware inyectados
   */
  get appointmentRoutes(): AppointmentRoutes {
    return this._appointmentRoutes;
  }

  // Getters para casos de uso (para testing o uso directo)

  /**
   * Obtiene el caso de uso de creación de citas configurado
   * @returns Instancia de CreateAppointment para uso directo o testing
   */
  get createAppointment(): CreateAppointment {
    return this._createAppointment;
  }

  // Getters para repositorios (para testing o uso directo)

  /**
   * Obtiene el repositorio de citas configurado
   * @returns Instancia de AppointmentRepository para uso directo o testing
   */
  get appointmentRepository(): AppointmentRepository {
    return this._appointmentRepository;
  }

  /**
   * Obtiene el repositorio de estados de citas configurado
   * @returns Instancia de AppointmentStatusRepository para uso directo o testing
   */
  get appointmentStatusRepository(): AppointmentStatusRepository {
    return this._appointmentStatusRepository;
  }

  /**
   * Obtiene el repositorio de horarios configurado
   * @returns Instancia de ScheduleRepository para uso directo o testing
   */
  get scheduleRepository(): ScheduleRepository {
    return this._scheduleRepository;
  }

  /**
   * Obtiene el repositorio de servicios configurado
   * @returns Instancia de ServiceRepository para uso directo o testing
   */
  get serviceRepository(): ServiceRepository {
    return this._serviceRepository;
  }

  /**
   * Obtiene el repositorio de estilistas configurado
   * @returns Instancia de StylistRepository para uso directo o testing
   */
  get stylistRepository(): StylistRepository {
    return this._stylistRepository;
  }

  /**
   * Obtiene el repositorio de usuarios configurado
   * @returns Instancia de UserRepository para uso directo o testing
   */
  get userRepository(): UserRepository {
    return this._userRepository;
  }
}
