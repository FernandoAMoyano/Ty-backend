import { PrismaClient } from '@prisma/client';

// Servicios de aplicaciones
import { CategoryService } from './application/services/CategoryService';
import { ServiceManagementService } from './application/services/ServiceManagementService';
import { StylistServiceService } from './application/services/StylistServiceService';

// casos de uso
import { AssignServiceToStylist } from './application/use-cases/AssignServiceToStylist';
import { ManageStylistServiceOffering } from './application/use-cases/ManageStylistServiceOffering';
import { GetAvailableServicesForClient } from './application/use-cases/GetAvailableServicesForClient';

// Repositorios de dominio (interfaces)
import { CategoryRepository } from './domain/repositories/CategoryRepository';
import { ServiceRepository } from './domain/repositories/ServiceRepository';
import { StylistServiceRepository } from './domain/repositories/StylistServiceRepository';

// Repositorios de infraestructura (implementaciones)
import { PrismaCategoryRepository } from './infrastructure/persistence/PrismaCategoryRepository';
import { PrismaServiceRepository } from './infrastructure/persistence/PrismaServiceRepository';
import { PrismaStylistServiceRepository } from './infrastructure/persistence/PrismaStylistServiceRepository';

// Capa de presentación
import { CategoryController } from './presentation/controllers/CategoryController';
import { ServiceController } from './presentation/controllers/ServiceController';
import { StylistServiceController } from './presentation/controllers/StylistServiceController';
import { ServicesRoutes } from './presentation/routes/ServicesRoutes';
// Importar userRepository desde el módulo de autenticación
import { UserRepository } from '../auth/domain/repositories/User';
import { PrismaUserRepository } from '../auth/infrastructure/persistence/PrismaUserRepository';

// Import AuthMiddleware
import { AuthMiddleware } from '../auth/presentation/middleware/AuthMiddleware';

export class ServicesContainer {
  private static instance: ServicesContainer;

  // Servicios de aplicaciones
  private _categoryService: CategoryService;
  private _serviceManagementService: ServiceManagementService;
  private _stylistServiceService: StylistServiceService;

  // Casos de uso
  private _assignServiceToStylist: AssignServiceToStylist;
  private _manageStylistServiceOffering: ManageStylistServiceOffering;
  private _getAvailableServicesForClient: GetAvailableServicesForClient;

  // Presentation Layer
  private _categoryController: CategoryController;
  private _serviceController: ServiceController;
  private _stylistServiceController: StylistServiceController;
  private _servicesRoutes: ServicesRoutes;

  constructor(
    private prisma: PrismaClient,
    private authMiddleware: AuthMiddleware,
  ) {
    this.setupDependencies();
  }

  static getInstance(prisma: PrismaClient, authMiddleware: AuthMiddleware): ServicesContainer {
    if (!ServicesContainer.instance) {
      ServicesContainer.instance = new ServicesContainer(prisma, authMiddleware);
    }
    return ServicesContainer.instance;
  }

  private setupDependencies(): void {
    // Repositorios
    const categoryRepository: CategoryRepository = new PrismaCategoryRepository(this.prisma);
    const serviceRepository: ServiceRepository = new PrismaServiceRepository(this.prisma);
    const stylistServiceRepository: StylistServiceRepository = new PrismaStylistServiceRepository(
      this.prisma,
    );
    const userRepository: UserRepository = new PrismaUserRepository(this.prisma);

    // Servicios de aplicaciones
    this._categoryService = new CategoryService(categoryRepository);

    this._serviceManagementService = new ServiceManagementService(
      serviceRepository,
      categoryRepository,
    );

    this._stylistServiceService = new StylistServiceService(
      stylistServiceRepository,
      serviceRepository,
      userRepository,
    );

    // Casos de uso
    this._assignServiceToStylist = new AssignServiceToStylist(this._stylistServiceService);
    this._manageStylistServiceOffering = new ManageStylistServiceOffering(
      this._stylistServiceService,
    );
    this._getAvailableServicesForClient = new GetAvailableServicesForClient(
      this._serviceManagementService,
      this._stylistServiceService,
    );

    // Capa de presentación
    this._categoryController = new CategoryController(this._categoryService);
    this._serviceController = new ServiceController(this._serviceManagementService);
    this._stylistServiceController = new StylistServiceController(this._stylistServiceService);

    this._servicesRoutes = new ServicesRoutes(
      this._categoryController,
      this._serviceController,
      this._stylistServiceController,
      this.authMiddleware,
    );
  }

  // Getters - Servicios de aplicaciones
  get categoryService(): CategoryService {
    return this._categoryService;
  }

  get serviceManagementService(): ServiceManagementService {
    return this._serviceManagementService;
  }

  get stylistServiceService(): StylistServiceService {
    return this._stylistServiceService;
  }

  // Getters - Casos de uso
  get assignServiceToStylist(): AssignServiceToStylist {
    return this._assignServiceToStylist;
  }

  get manageStylistServiceOffering(): ManageStylistServiceOffering {
    return this._manageStylistServiceOffering;
  }

  get getAvailableServicesForClient(): GetAvailableServicesForClient {
    return this._getAvailableServicesForClient;
  }

  // Getters - Capa de presentación
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
