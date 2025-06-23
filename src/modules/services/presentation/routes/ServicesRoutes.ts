import { Router } from 'express';
import { CategoryController } from '../controllers/CategoryController';
import { ServiceController } from '../controllers/ServiceController';
import { StylistServiceController } from '../controllers/StylistServiceController';
import { AuthMiddleware } from '../../../auth/presentation/middleware/AuthMiddleware';

export class ServicesRoutes {
  private router: Router;

  constructor(
    private categoryController: CategoryController,
    private serviceController: ServiceController,
    private stylistServiceController: StylistServiceController,
    private authMiddleware: AuthMiddleware,
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.setupCategoryRoutes();
    this.setupServiceRoutes();
    this.setupStylistServiceRoutes();
  }

  private setupCategoryRoutes(): void {
    // Rutas públicas
    this.router.get('/categories', this.categoryController.getAllCategories);
    this.router.get('/categories/active', this.categoryController.getActiveCategories);
    this.router.get('/categories/:id', this.categoryController.getCategoryById);

    // Rutas solo de administración
    this.router.post(
      '/categories',
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(['ADMIN']),
      this.categoryController.createCategory,
    );

    this.router.put(
      '/categories/:id',
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(['ADMIN']),
      this.categoryController.updateCategory,
    );

    this.router.patch(
      '/categories/:id/activate',
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(['ADMIN']),
      this.categoryController.activateCategory,
    );

    this.router.patch(
      '/categories/:id/deactivate',
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(['ADMIN']),
      this.categoryController.deactivateCategory,
    );

    this.router.delete(
      '/categories/:id',
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(['ADMIN']),
      this.categoryController.deleteCategory,
    );
  }

  private setupServiceRoutes(): void {
    // Rutas públicas
    this.router.get('/services', this.serviceController.getAllServices);
    this.router.get('/services/active', this.serviceController.getActiveServices);
    this.router.get('/services/:id', this.serviceController.getServiceById);
    this.router.get('/services/category/:categoryId', this.serviceController.getServicesByCategory);
    this.router.get(
      '/services/category/:categoryId/active',
      this.serviceController.getActiveServicesByCategory,
    );

    // Rutas solo de administración
    this.router.post(
      '/services',
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(['ADMIN']),
      this.serviceController.createService,
    );

    this.router.put(
      '/services/:id',
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(['ADMIN']),
      this.serviceController.updateService,
    );

    this.router.patch(
      '/services/:id/activate',
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(['ADMIN']),
      this.serviceController.activateService,
    );

    this.router.patch(
      '/services/:id/deactivate',
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(['ADMIN']),
      this.serviceController.deactivateService,
    );

    this.router.delete(
      '/services/:id',
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(['ADMIN']),
      this.serviceController.deleteService,
    );
  }

  private setupStylistServiceRoutes(): void {
    // Rutas públicas - Ver qué servicios ofrece un estilista
    this.router.get(
      '/stylists/:stylistId/services',
      this.stylistServiceController.getStylistServices,
    );
    this.router.get(
      '/stylists/:stylistId/services/active',
      this.stylistServiceController.getActiveOfferings,
    );
    this.router.get(
      '/services/:serviceId/stylists',
      this.stylistServiceController.getServiceStylists,
    );
    this.router.get(
      '/services/:serviceId/stylists/offering',
      this.stylistServiceController.getStylistsOfferingService,
    );

    // Vistas detalladas
    this.router.get(
      '/stylists/:stylistId/services/detailed',
      this.stylistServiceController.getStylistWithServices,
    );
    this.router.get(
      '/services/:serviceId/stylists/detailed',
      this.stylistServiceController.getServiceWithStylists,
    );

    // El estilista puede gestionar sus propios servicios.
    this.router.post(
      '/stylists/:stylistId/services',
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(['ADMIN', 'STYLIST']),
      this.stylistServiceController.assignServiceToStylist,
    );

    this.router.put(
      '/stylists/:stylistId/services/:serviceId',
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(['ADMIN', 'STYLIST']),
      this.stylistServiceController.updateStylistService,
    );

    this.router.delete(
      '/stylists/:stylistId/services/:serviceId',
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(['ADMIN', 'STYLIST']),
      this.stylistServiceController.removeServiceFromStylist,
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
