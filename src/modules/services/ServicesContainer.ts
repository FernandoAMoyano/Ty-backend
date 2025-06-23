import { PrismaClient } from '@prisma/client';
// Servicios de aplicaciones
import { CategoryService } from './application/services/CategoryService';
import { ServiceManagementService } from './application/services/ServiceManagementService';
import { StylistServiceService } from './application/services/StylistServiceService';
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
// Import UserRepository from Auth module
import { UserRepository } from '../auth/domain/repositories/User';
import { PrismaUserRepository } from '../auth/infrastructure/persistence/PrismaUserRepository';
// Import AuthMiddleware
import { AuthMiddleware } from '../auth/presentation/middleware/AuthMiddleware';

export class ServicesContainer {
  private static instance: ServicesContainer;

  private _categoryService: CategoryService;
  private _serviceManagementService: ServiceManagementService;
  private _stylistServiceService: StylistServiceService;

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

    //Capa de presentación
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

  // Getters
  get categoryService(): CategoryService {
    return this._categoryService;
  }

  get serviceManagementService(): ServiceManagementService {
    return this._serviceManagementService;
  }

  get stylistServiceService(): StylistServiceService {
    return this._stylistServiceService;
  }

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
