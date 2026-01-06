import { PrismaClient } from '@prisma/client';

// Repositories
import { NotificationRepository } from './domain/repositories/NotificationRepository';
import { NotificationStatusRepository } from './domain/repositories/NotificationStatusRepository';
import { PrismaNotificationRepository } from './infrastructure/persistence/PrismaNotificationRepository';
import { PrismaNotificationStatusRepository } from './infrastructure/persistence/PrismaNotificationStatusRepository';

// Use Cases
import { CreateNotification } from './application/use-cases/CreateNotification';
import { GetUserNotifications } from './application/use-cases/GetUserNotifications';
import { GetNotificationById } from './application/use-cases/GetNotificationById';
import { MarkNotificationAsRead } from './application/use-cases/MarkNotificationAsRead';
import { GetUnreadCount } from './application/use-cases/GetUnreadCount';

// Presentation
import { NotificationController } from './presentation/controllers/NotificationController';
import { NotificationRoutes } from './presentation/routes/NotificationRoutes';
import { AuthMiddleware } from '../auth/presentation/middleware/AuthMiddleware';

/**
 * Contenedor de dependencias para el módulo de notificaciones
 * @description Implementa el patrón Singleton y configura todas las dependencias del módulo
 * usando inyección de dependencias manual siguiendo Clean Architecture
 */
export class NotificationContainer {
  /** Instancia singleton del contenedor */
  private static instance: NotificationContainer;

  // Repositorios
  private _notificationRepository: NotificationRepository;
  private _notificationStatusRepository: NotificationStatusRepository;

  // Use Cases
  private _createNotification: CreateNotification;
  private _getUserNotifications: GetUserNotifications;
  private _getNotificationById: GetNotificationById;
  private _markNotificationAsRead: MarkNotificationAsRead;
  private _getUnreadCount: GetUnreadCount;

  // Presentation
  private _notificationController: NotificationController;
  private _notificationRoutes: NotificationRoutes;

  /**
   * Constructor privado que inicializa todas las dependencias del módulo
   * @param prisma - Cliente Prisma para acceso a base de datos
   * @param authMiddleware - Middleware de autenticación del módulo auth
   * @description Configura la cadena completa de dependencias siguiendo arquitectura hexagonal
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
   * @returns Instancia única del NotificationContainer
   * @description Implementa patrón Singleton para asegurar una sola instancia
   */
  static getInstance(prisma: PrismaClient, authMiddleware: AuthMiddleware): NotificationContainer {
    if (!NotificationContainer.instance) {
      NotificationContainer.instance = new NotificationContainer(prisma, authMiddleware);
    }
    return NotificationContainer.instance;
  }

  /**
   * Configura todas las dependencias del módulo de notificaciones
   * @private
   * @description Inyecta dependencias siguiendo el orden: repositories -> use cases -> controllers -> routes
   */
  private setupDependencies(): void {
    // 1. Inicializar repositorios
    this._notificationRepository = new PrismaNotificationRepository(this.prisma);
    this._notificationStatusRepository = new PrismaNotificationStatusRepository(this.prisma);

    // 2. Inicializar use cases
    this._createNotification = new CreateNotification(
      this._notificationRepository,
      this._notificationStatusRepository,
    );

    this._getUserNotifications = new GetUserNotifications(
      this._notificationRepository,
      this._notificationStatusRepository,
    );

    this._getNotificationById = new GetNotificationById(this._notificationRepository);

    this._markNotificationAsRead = new MarkNotificationAsRead(
      this._notificationRepository,
      this._notificationStatusRepository,
    );

    this._getUnreadCount = new GetUnreadCount(
      this._notificationRepository,
      this._notificationStatusRepository,
    );

    // 3. Inicializar controller
    this._notificationController = new NotificationController(
      this._createNotification,
      this._getUserNotifications,
      this._getNotificationById,
      this._markNotificationAsRead,
      this._getUnreadCount,
    );

    // 4. Inicializar routes
    this._notificationRoutes = new NotificationRoutes(
      this._notificationController,
      this.authMiddleware,
    );
  }

  // =====================
  // GETTERS - PRESENTATION
  // =====================

  /**
   * Obtiene las rutas de notificaciones configuradas
   * @returns Instancia de NotificationRoutes con controller y middleware inyectados
   */
  get notificationRoutes(): NotificationRoutes {
    return this._notificationRoutes;
  }

  /**
   * Obtiene el controlador de notificaciones configurado
   * @returns Instancia de NotificationController con todas sus dependencias inyectadas
   */
  get notificationController(): NotificationController {
    return this._notificationController;
  }

  // =====================
  // GETTERS - USE CASES
  // =====================

  /**
   * Obtiene el caso de uso para crear notificaciones
   * @returns Instancia del use case CreateNotification
   */
  get createNotification(): CreateNotification {
    return this._createNotification;
  }

  /**
   * Obtiene el caso de uso para obtener notificaciones de un usuario
   * @returns Instancia del use case GetUserNotifications
   */
  get getUserNotifications(): GetUserNotifications {
    return this._getUserNotifications;
  }

  /**
   * Obtiene el caso de uso para obtener una notificación por ID
   * @returns Instancia del use case GetNotificationById
   */
  get getNotificationById(): GetNotificationById {
    return this._getNotificationById;
  }

  /**
   * Obtiene el caso de uso para marcar notificaciones como leídas
   * @returns Instancia del use case MarkNotificationAsRead
   */
  get markNotificationAsRead(): MarkNotificationAsRead {
    return this._markNotificationAsRead;
  }

  /**
   * Obtiene el caso de uso para contar notificaciones no leídas
   * @returns Instancia del use case GetUnreadCount
   */
  get getUnreadCount(): GetUnreadCount {
    return this._getUnreadCount;
  }

  // =====================
  // GETTERS - REPOSITORIES
  // =====================

  /**
   * Obtiene el repositorio de notificaciones
   * @returns Instancia del repositorio de notificaciones
   */
  get notificationRepository(): NotificationRepository {
    return this._notificationRepository;
  }

  /**
   * Obtiene el repositorio de estados de notificación
   * @returns Instancia del repositorio de estados
   */
  get notificationStatusRepository(): NotificationStatusRepository {
    return this._notificationStatusRepository;
  }
}
