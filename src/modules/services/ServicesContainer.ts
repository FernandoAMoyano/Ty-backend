import { PrismaClient } from '@prisma/client';

// Use cases — Categorías
import { CreateCategory } from './application/use-cases/CreateCategory';
import { UpdateCategory } from './application/use-cases/UpdateCategory';
import { GetCategoryById } from './application/use-cases/GetCategoryById';
import { GetAllCategories } from './application/use-cases/GetAllCategories';
import { GetActiveCategories } from './application/use-cases/GetActiveCategories';
import { ActivateCategory } from './application/use-cases/ActivateCategory';
import { DeactivateCategory } from './application/use-cases/DeactivateCategory';
import { DeleteCategory } from './application/use-cases/DeleteCategory';

// Use cases — Servicios
import { CreateService } from './application/use-cases/CreateService';
import { UpdateService } from './application/use-cases/UpdateService';
import { GetServiceById } from './application/use-cases/GetServiceById';
import { GetAllServices } from './application/use-cases/GetAllServices';
import { GetActiveServices } from './application/use-cases/GetActiveServices';
import { GetServicesByCategory } from './application/use-cases/GetServicesByCategory';
import { GetActiveServicesByCategory } from './application/use-cases/GetActiveServicesByCategory';
import { ActivateService } from './application/use-cases/ActivateService';
import { DeactivateService } from './application/use-cases/DeactivateService';
import { DeleteService } from './application/use-cases/DeleteService';

// Use cases — StylistService
import { AssignServiceToStylist } from './application/use-cases/AssignServiceToStylist';
import { UpdateStylistService } from './application/use-cases/UpdateStylistService';
import { RemoveServiceFromStylist } from './application/use-cases/RemoveServiceFromStylist';
import { GetStylistServices } from './application/use-cases/GetStylistServices';
import { GetActiveOfferings } from './application/use-cases/GetActiveOfferings';
import { GetStylistWithServices } from './application/use-cases/GetStylistWithServices';
import { GetServiceStylists } from './application/use-cases/GetServiceStylists';
import { GetStylistsOfferingService } from './application/use-cases/GetStylistsOfferingService';
import { GetServiceWithStylists } from './application/use-cases/GetServiceWithStylists';
import { GetAvailableServicesForClient } from './application/use-cases/GetAvailableServicesForClient';

// Repositorios de dominio (interfaces)
import { ICategoryRepository } from './domain/repositories/ICategoryRepository';
import { IServiceRepository } from './domain/repositories/IServiceRepository';
import { IStylistServiceRepository } from './domain/repositories/IStylistServiceRepository';

// Repositorios de infraestructura (implementaciones)
import { PrismaCategoryRepository } from './infrastructure/persistence/PrismaCategoryRepository';
import { PrismaServiceRepository } from './infrastructure/persistence/PrismaServiceRepository';
import { PrismaStylistServiceRepository } from './infrastructure/persistence/PrismaStylistServiceRepository';

// Importar userRepository desde el módulo de autenticación
import { IUserRepository } from '../auth/domain/repositories/IUserRepository';
import { PrismaUserRepository } from '../auth/infrastructure/persistence/PrismaUserRepository';

// Importar appointmentRepository desde el módulo de citas
import { IAppointmentRepository } from '../appointments/domain/repositories/IAppointmentRepository';
import { PrismaAppointmentRepository } from '../appointments/infrastructure/persistence/PrismaAppointmentRepository';

// Capa de presentación
import { CategoryController } from './presentation/controllers/CategoryController';
import { ServiceController } from './presentation/controllers/ServiceController';
import { StylistServiceController } from './presentation/controllers/StylistServiceController';
import { ServicesRoutes } from './presentation/routes/ServicesRoutes';
import { AuthMiddleware } from '../auth/presentation/middleware/AuthMiddleware';

/**
 * Contenedor de dependencias para el módulo de servicios
 * Implementa el patrón Singleton para garantizar una única instancia
 */
export class ServicesContainer {
  private static instance: ServicesContainer;

  // Use cases — Categorías
  private _createCategory: CreateCategory;
  private _updateCategory: UpdateCategory;
  private _getCategoryById: GetCategoryById;
  private _getAllCategories: GetAllCategories;
  private _getActiveCategories: GetActiveCategories;
  private _activateCategory: ActivateCategory;
  private _deactivateCategory: DeactivateCategory;
  private _deleteCategory: DeleteCategory;

  // Use cases — Servicios
  private _createService: CreateService;
  private _updateService: UpdateService;
  private _getServiceById: GetServiceById;
  private _getAllServices: GetAllServices;
  private _getActiveServices: GetActiveServices;
  private _getServicesByCategory: GetServicesByCategory;
  private _getActiveServicesByCategory: GetActiveServicesByCategory;
  private _activateService: ActivateService;
  private _deactivateService: DeactivateService;
  private _deleteService: DeleteService;

  // Use cases — StylistService
  private _assignServiceToStylist: AssignServiceToStylist;
  private _updateStylistService: UpdateStylistService;
  private _removeServiceFromStylist: RemoveServiceFromStylist;
  private _getStylistServices: GetStylistServices;
  private _getActiveOfferings: GetActiveOfferings;
  private _getStylistWithServices: GetStylistWithServices;
  private _getServiceStylists: GetServiceStylists;
  private _getStylistsOfferingService: GetStylistsOfferingService;
  private _getServiceWithStylists: GetServiceWithStylists;
  private _getAvailableServicesForClient: GetAvailableServicesForClient;

  // Capa de presentación
  private _categoryController: CategoryController;
  private _serviceController: ServiceController;
  private _stylistServiceController: StylistServiceController;
  private _servicesRoutes: ServicesRoutes;

  private constructor(
    private prisma: PrismaClient,
    private authMiddleware: AuthMiddleware,
  ) {
    this.setupDependencies();
  }

  /**
   * Obtiene la instancia única del contenedor de servicios
   * @param prisma - Cliente Prisma para acceso a base de datos
   * @param authMiddleware - Middleware de autenticación compartido
   * @returns Instancia única de ServicesContainer
   */
  static getInstance(prisma: PrismaClient, authMiddleware: AuthMiddleware): ServicesContainer {
    if (!ServicesContainer.instance) {
      ServicesContainer.instance = new ServicesContainer(prisma, authMiddleware);
    }
    return ServicesContainer.instance;
  }

  /**
   * Configura todas las dependencias del módulo en el orden correcto
   * @description Repositories → Use Cases → Controllers → Routes
   */
  private setupDependencies(): void {
    // 1. Repositorios
    const categoryRepository: ICategoryRepository = new PrismaCategoryRepository(this.prisma);
    const serviceRepository: IServiceRepository = new PrismaServiceRepository(this.prisma);
    const stylistServiceRepository: IStylistServiceRepository = new PrismaStylistServiceRepository(
      this.prisma,
    );
    const userRepository: IUserRepository = new PrismaUserRepository(this.prisma);
    const appointmentRepository: IAppointmentRepository = new PrismaAppointmentRepository(
      this.prisma,
    );

    // 2. Use cases — Categorías
    this._createCategory = new CreateCategory(categoryRepository);
    this._updateCategory = new UpdateCategory(categoryRepository);
    this._getCategoryById = new GetCategoryById(categoryRepository);
    this._getAllCategories = new GetAllCategories(categoryRepository);
    this._getActiveCategories = new GetActiveCategories(categoryRepository);
    this._activateCategory = new ActivateCategory(categoryRepository);
    this._deactivateCategory = new DeactivateCategory(categoryRepository);
    this._deleteCategory = new DeleteCategory(categoryRepository, serviceRepository);

    // 3. Use cases — Servicios
    this._createService = new CreateService(serviceRepository, categoryRepository);
    this._updateService = new UpdateService(serviceRepository, categoryRepository);
    this._getServiceById = new GetServiceById(serviceRepository, categoryRepository);
    this._getAllServices = new GetAllServices(serviceRepository, categoryRepository);
    this._getActiveServices = new GetActiveServices(serviceRepository, categoryRepository);
    this._getServicesByCategory = new GetServicesByCategory(serviceRepository, categoryRepository);
    this._getActiveServicesByCategory = new GetActiveServicesByCategory(
      serviceRepository,
      categoryRepository,
    );
    this._activateService = new ActivateService(serviceRepository, categoryRepository);
    this._deactivateService = new DeactivateService(serviceRepository, categoryRepository);
    this._deleteService = new DeleteService(serviceRepository, appointmentRepository);

    // 4. Use cases — StylistService
    this._assignServiceToStylist = new AssignServiceToStylist(
      stylistServiceRepository,
      serviceRepository,
      userRepository,
    );
    this._updateStylistService = new UpdateStylistService(
      stylistServiceRepository,
      serviceRepository,
    );
    this._removeServiceFromStylist = new RemoveServiceFromStylist(stylistServiceRepository);
    this._getStylistServices = new GetStylistServices(
      stylistServiceRepository,
      serviceRepository,
      userRepository,
    );
    this._getActiveOfferings = new GetActiveOfferings(
      stylistServiceRepository,
      serviceRepository,
      userRepository,
    );
    this._getStylistWithServices = new GetStylistWithServices(
      stylistServiceRepository,
      serviceRepository,
      userRepository,
    );
    this._getServiceStylists = new GetServiceStylists(stylistServiceRepository, serviceRepository);
    this._getStylistsOfferingService = new GetStylistsOfferingService(
      stylistServiceRepository,
      serviceRepository,
    );
    this._getServiceWithStylists = new GetServiceWithStylists(
      stylistServiceRepository,
      serviceRepository,
    );
    this._getAvailableServicesForClient = new GetAvailableServicesForClient(
      this._getActiveServices,
      this._getStylistsOfferingService,
    );

    // 5. Controllers
    this._categoryController = new CategoryController(
      this._createCategory,
      this._updateCategory,
      this._getCategoryById,
      this._getAllCategories,
      this._getActiveCategories,
      this._activateCategory,
      this._deactivateCategory,
      this._deleteCategory,
    );

    this._serviceController = new ServiceController(
      this._createService,
      this._updateService,
      this._getServiceById,
      this._getAllServices,
      this._getActiveServices,
      this._getServicesByCategory,
      this._getActiveServicesByCategory,
      this._activateService,
      this._deactivateService,
      this._deleteService,
    );

    this._stylistServiceController = new StylistServiceController(
      this._assignServiceToStylist,
      this._updateStylistService,
      this._removeServiceFromStylist,
      this._getStylistServices,
      this._getActiveOfferings,
      this._getStylistWithServices,
      this._getServiceStylists,
      this._getStylistsOfferingService,
      this._getServiceWithStylists,
    );

    // 6. Routes
    this._servicesRoutes = new ServicesRoutes(
      this._categoryController,
      this._serviceController,
      this._stylistServiceController,
      this.authMiddleware,
    );
  }

  // Getters — Use cases Categorías
  get createCategory(): CreateCategory {
    return this._createCategory;
  }
  get updateCategory(): UpdateCategory {
    return this._updateCategory;
  }
  get getCategoryById(): GetCategoryById {
    return this._getCategoryById;
  }
  get getAllCategories(): GetAllCategories {
    return this._getAllCategories;
  }
  get getActiveCategories(): GetActiveCategories {
    return this._getActiveCategories;
  }
  get activateCategory(): ActivateCategory {
    return this._activateCategory;
  }
  get deactivateCategory(): DeactivateCategory {
    return this._deactivateCategory;
  }
  get deleteCategory(): DeleteCategory {
    return this._deleteCategory;
  }

  // Getters — Use cases Servicios
  get createService(): CreateService {
    return this._createService;
  }
  get updateService(): UpdateService {
    return this._updateService;
  }
  get getServiceById(): GetServiceById {
    return this._getServiceById;
  }
  get getAllServices(): GetAllServices {
    return this._getAllServices;
  }
  get getActiveServices(): GetActiveServices {
    return this._getActiveServices;
  }
  get getServicesByCategory(): GetServicesByCategory {
    return this._getServicesByCategory;
  }
  get getActiveServicesByCategory(): GetActiveServicesByCategory {
    return this._getActiveServicesByCategory;
  }
  get activateService(): ActivateService {
    return this._activateService;
  }
  get deactivateService(): DeactivateService {
    return this._deactivateService;
  }
  get deleteService(): DeleteService {
    return this._deleteService;
  }

  // Getters — Use cases StylistService
  get assignServiceToStylist(): AssignServiceToStylist {
    return this._assignServiceToStylist;
  }
  get updateStylistService(): UpdateStylistService {
    return this._updateStylistService;
  }
  get removeServiceFromStylist(): RemoveServiceFromStylist {
    return this._removeServiceFromStylist;
  }
  get getStylistServices(): GetStylistServices {
    return this._getStylistServices;
  }
  get getActiveOfferings(): GetActiveOfferings {
    return this._getActiveOfferings;
  }
  get getStylistWithServices(): GetStylistWithServices {
    return this._getStylistWithServices;
  }
  get getServiceStylists(): GetServiceStylists {
    return this._getServiceStylists;
  }
  get getStylistsOfferingService(): GetStylistsOfferingService {
    return this._getStylistsOfferingService;
  }
  get getServiceWithStylists(): GetServiceWithStylists {
    return this._getServiceWithStylists;
  }
  get getAvailableServicesForClient(): GetAvailableServicesForClient {
    return this._getAvailableServicesForClient;
  }

  // Getters — Presentación
  get categoryController(): CategoryController {
    return this._categoryController;
  }
  get serviceController(): ServiceController {
    return this._serviceController;
  }
  get stylistServiceController(): StylistServiceController {
    return this._stylistServiceController;
  }
  get servicesRoutes(): ServicesRoutes {
    return this._servicesRoutes;
  }
}
