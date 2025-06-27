import { Router } from 'express';
import { CategoryController } from '../controllers/CategoryController';
import { ServiceController } from '../controllers/ServiceController';
import { StylistServiceController } from '../controllers/StylistServiceController';
import { AuthMiddleware } from '../../../auth/presentation/middleware/AuthMiddleware';
import { CategoryValidations } from '../validations/CategoryValidations';
import { ServiceValidations } from '../validations/ServiceValidations';
import { StylistServiceValidations } from '../validations/StylistServiceValidations';
import { ValidationMiddleware } from '../middleware/ValidationMiddleware';

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
    this.router.get('/categories', this.categoryController.getAllCategories);
    this.router.get('/categories/active', this.categoryController.getActiveCategories);
    this.router.get(
      '/categories/:id',
      CategoryValidations.categoryById,
      ValidationMiddleware.handleValidationErrors,
      this.categoryController.getCategoryById,
    );

    this.router.post(
      '/categories',
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(['ADMIN']),
      CategoryValidations.createCategory,
      ValidationMiddleware.handleValidationErrors,
      this.categoryController.createCategory,
    );

    this.router.put(
      '/categories/:id',
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(['ADMIN']),
      CategoryValidations.updateCategory,
      ValidationMiddleware.handleValidationErrors,
      this.categoryController.updateCategory,
    );

    this.router.patch(
      '/categories/:id/activate',
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(['ADMIN']),
      CategoryValidations.categoryById,
      ValidationMiddleware.handleValidationErrors,
      this.categoryController.activateCategory,
    );

    this.router.patch(
      '/categories/:id/deactivate',
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(['ADMIN']),
      CategoryValidations.categoryById,
      ValidationMiddleware.handleValidationErrors,
      this.categoryController.deactivateCategory,
    );

    this.router.delete(
      '/categories/:id',
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(['ADMIN']),
      CategoryValidations.categoryById,
      ValidationMiddleware.handleValidationErrors,
      this.categoryController.deleteCategory,
    );
  }

  private setupServiceRoutes(): void {
    this.router.get('/services/active', this.serviceController.getActiveServices);

    this.router.get(
      '/services/category/:categoryId/active',
      ServiceValidations.servicesByCategory,
      ValidationMiddleware.handleValidationErrors,
      this.serviceController.getActiveServicesByCategory,
    );

    this.router.get(
      '/services/category/:categoryId',
      ServiceValidations.servicesByCategory,
      ValidationMiddleware.handleValidationErrors,
      this.serviceController.getServicesByCategory,
    );

    this.router.get('/services', this.serviceController.getAllServices);

    this.router.get(
      '/services/:id',
      ServiceValidations.serviceById,
      ValidationMiddleware.handleValidationErrors,
      this.serviceController.getServiceById,
    );

    this.router.post(
      '/services',
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(['ADMIN']),
      ServiceValidations.createService,
      ValidationMiddleware.handleValidationErrors,
      this.serviceController.createService,
    );

    this.router.put(
      '/services/:id',
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(['ADMIN']),
      ServiceValidations.updateService,
      ValidationMiddleware.handleValidationErrors,
      this.serviceController.updateService,
    );

    this.router.patch(
      '/services/:id/activate',
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(['ADMIN']),
      ServiceValidations.serviceById,
      ValidationMiddleware.handleValidationErrors,
      this.serviceController.activateService,
    );

    this.router.patch(
      '/services/:id/deactivate',
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(['ADMIN']),
      ServiceValidations.serviceById,
      ValidationMiddleware.handleValidationErrors,
      this.serviceController.deactivateService,
    );

    this.router.delete(
      '/services/:id',
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(['ADMIN']),
      ServiceValidations.serviceById,
      ValidationMiddleware.handleValidationErrors,
      this.serviceController.deleteService,
    );
  }

  private setupStylistServiceRoutes(): void {
    this.router.get(
      '/stylists/:stylistId/services',
      StylistServiceValidations.stylistById,
      ValidationMiddleware.handleValidationErrors,
      this.stylistServiceController.getStylistServices,
    );

    this.router.get(
      '/stylists/:stylistId/services/active',
      StylistServiceValidations.stylistById,
      ValidationMiddleware.handleValidationErrors,
      this.stylistServiceController.getActiveOfferings,
    );

    this.router.get(
      '/services/:serviceId/stylists',
      StylistServiceValidations.serviceById,
      ValidationMiddleware.handleValidationErrors,
      this.stylistServiceController.getServiceStylists,
    );

    this.router.get(
      '/services/:serviceId/stylists/offering',
      StylistServiceValidations.serviceById,
      ValidationMiddleware.handleValidationErrors,
      this.stylistServiceController.getStylistsOfferingService,
    );

    this.router.get(
      '/stylists/:stylistId/services/detailed',
      StylistServiceValidations.stylistById,
      ValidationMiddleware.handleValidationErrors,
      this.stylistServiceController.getStylistWithServices,
    );

    this.router.get(
      '/services/:serviceId/stylists/detailed',
      StylistServiceValidations.serviceById,
      ValidationMiddleware.handleValidationErrors,
      this.stylistServiceController.getServiceWithStylists,
    );

    this.router.post(
      '/stylists/:stylistId/services',
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(['ADMIN', 'STYLIST']),
      StylistServiceValidations.assignService,
      ValidationMiddleware.handleValidationErrors,
      this.stylistServiceController.assignServiceToStylist,
    );

    this.router.put(
      '/stylists/:stylistId/services/:serviceId',
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(['ADMIN', 'STYLIST']),
      StylistServiceValidations.updateStylistService,
      ValidationMiddleware.handleValidationErrors,
      this.stylistServiceController.updateStylistService,
    );

    this.router.delete(
      '/stylists/:stylistId/services/:serviceId',
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(['ADMIN', 'STYLIST']),
      StylistServiceValidations.stylistServiceParams,
      ValidationMiddleware.handleValidationErrors,
      this.stylistServiceController.removeServiceFromStylist,
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
