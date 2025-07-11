import { Router } from 'express';
import { CategoryController } from '../controllers/CategoryController';
import { ServiceController } from '../controllers/ServiceController';
import { StylistServiceController } from '../controllers/StylistServiceController';
import { AuthMiddleware } from '../../../auth/presentation/middleware/AuthMiddleware';
import { CategoryValidations } from '../validations/CategoryValidations';
import { ServiceValidations } from '../validations/ServiceValidations';
import { StylistServiceValidations } from '../validations/StylistServiceValidations';
import { ValidationMiddleware } from '../middleware/ValidationMiddleware';

/**
 * Configurador de rutas para el módulo de servicios
 * Organiza y registra todas las rutas relacionadas con categorías, servicios y asignaciones de estilistas
 */
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

  /**
   * Configura todas las rutas del módulo de servicios
   * @description Organiza las rutas en grupos lógicos por funcionalidad
   */
  private setupRoutes(): void {
    this.setupCategoryRoutes();
    this.setupServiceRoutes();
    this.setupStylistServiceRoutes();
  }

  /**
   * Configura las rutas para operaciones CRUD de categorías
   * @description Define rutas públicas y administrativas para gestión de categorías
   * @routes
   * - GET /categories - Obtener todas las categorías
   * - GET /categories/active - Obtener categorías activas
   * - GET /categories/:id - Obtener categoría por ID
   * - POST /categories - Crear categoría (requiere ADMIN)
   * - PUT /categories/:id - Actualizar categoría (requiere ADMIN)
   * - PATCH /categories/:id/activate - Activar categoría (requiere ADMIN)
   * - PATCH /categories/:id/deactivate - Desactivar categoría (requiere ADMIN)
   * - DELETE /categories/:id - Eliminar categoría (requiere ADMIN)
   */
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

  /**
   * Configura las rutas para operaciones CRUD de servicios
   * @description Define rutas públicas y administrativas con orden específico para evitar conflictos
   * @routes
   * - GET /services/active - Obtener servicios activos
   * - GET /services/category/:categoryId/active - Obtener servicios activos por categoría
   * - GET /services/category/:categoryId - Obtener servicios por categoría
   * - GET /services - Obtener todos los servicios
   * - GET /services/:id - Obtener servicio por ID
   * - POST /services - Crear servicio (requiere ADMIN)
   * - PUT /services/:id - Actualizar servicio (requiere ADMIN)
   * - PATCH /services/:id/activate - Activar servicio (requiere ADMIN)
   * - PATCH /services/:id/deactivate - Desactivar servicio (requiere ADMIN)
   * - DELETE /services/:id - Eliminar servicio (requiere ADMIN)
   */
  private setupServiceRoutes(): void {
    // 1. PRIMERO: Rutas más específicas
    this.router.get('/active', this.serviceController.getActiveServices);

    this.router.get(
      '/category/:categoryId/active',
      ServiceValidations.servicesByCategory,
      ValidationMiddleware.handleValidationErrors,
      this.serviceController.getActiveServicesByCategory,
    );

    this.router.get(
      '/category/:categoryId',
      ServiceValidations.servicesByCategory,
      ValidationMiddleware.handleValidationErrors,
      this.serviceController.getServicesByCategory,
    );

    // 2. DESPUÉS: Rutas generales
    this.router.get('/', this.serviceController.getAllServices);

    this.router.get(
      '/:id',
      ServiceValidations.serviceById,
      ValidationMiddleware.handleValidationErrors,
      this.serviceController.getServiceById,
    );

    // 3. FINALMENTE: CRUD operations
    this.router.post(
      '/',
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(['ADMIN']),
      ServiceValidations.createService,
      ValidationMiddleware.handleValidationErrors,
      this.serviceController.createService,
    );

    this.router.put(
      '/:id',
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(['ADMIN']),
      ServiceValidations.updateService,
      ValidationMiddleware.handleValidationErrors,
      this.serviceController.updateService,
    );

    this.router.patch(
      '/:id/activate',
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(['ADMIN']),
      ServiceValidations.serviceById,
      ValidationMiddleware.handleValidationErrors,
      this.serviceController.activateService,
    );

    this.router.patch(
      '/:id/deactivate',
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(['ADMIN']),
      ServiceValidations.serviceById,
      ValidationMiddleware.handleValidationErrors,
      this.serviceController.deactivateService,
    );

    this.router.delete(
      '/:id',
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(['ADMIN']),
      ServiceValidations.serviceById,
      ValidationMiddleware.handleValidationErrors,
      this.serviceController.deleteService,
    );
  }

  /**
   * Configura las rutas para operaciones de asignación de servicios a estilistas
   * @description Define rutas de consulta y modificación con orden específico para resolver conflictos
   * @routes
   * - GET /services/stylists/:stylistId/services/active - Ofertas activas del estilista
   * - GET /services/stylists/:stylistId/services/detailed - Estilista con servicios detallado
   * - GET /services/stylists/:stylistId/services - Servicios del estilista
   * - GET /services/:serviceId/stylists/offering - Estilistas ofreciendo servicio
   * - GET /services/:serviceId/stylists/detailed - Servicio con estilistas detallado
   * - GET /services/:serviceId/stylists - Estilistas del servicio
   * - POST /services/stylists/:stylistId/services - Asignar servicio (requiere ADMIN/STYLIST)
   * - PUT /services/stylists/:stylistId/services/:serviceId - Actualizar asignación (requiere ADMIN/STYLIST)
   * - DELETE /services/stylists/:stylistId/services/:serviceId - Remover asignación (requiere ADMIN/STYLIST)
   */
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
      '/:serviceId/stylists',
      StylistServiceValidations.serviceById,
      ValidationMiddleware.handleValidationErrors,
      this.stylistServiceController.getServiceStylists,
    );

    this.router.get(
      '/:serviceId/stylists/offering',
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
      '/:serviceId/stylists/detailed',
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
  /**
   * Obtiene el router configurado con todas las rutas
   * @returns Router de Express con todas las rutas del módulo de servicios configuradas
   */
  getRouter(): Router {
    return this.router;
  }
}

/* import { Router } from 'express';
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
    // Rutas públicas de categorías
    this.router.get('/categories', this.categoryController.getAllCategories);
    this.router.get('/categories/active', this.categoryController.getActiveCategories);
    this.router.get(
      '/categories/:id',
      CategoryValidations.categoryById,
      ValidationMiddleware.handleValidationErrors,
      this.categoryController.getCategoryById,
    );

    // Rutas administrativas de categorías
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
    // 1. Rutas con palabras clave específicas (active, category)
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

    // 2. Rutas generales que pueden capturar cualquier cosa
    this.router.get('/services', this.serviceController.getAllServices);

    // 3. Ruta con ID específico
    this.router.get(
      '/services/:id',
      ServiceValidations.serviceById,
      ValidationMiddleware.handleValidationErrors,
      this.serviceController.getServiceById,
    );

    // 4. Operaciones CRUD (POST, PUT, PATCH, DELETE)
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
    // Rutas de consulta (GET)
    this.router.get(
      '/services/stylists/:stylistId/services/active',
      StylistServiceValidations.stylistById,
      ValidationMiddleware.handleValidationErrors,
      this.stylistServiceController.getActiveOfferings,
    );

    this.router.get(
      '/services/stylists/:stylistId/services/detailed',
      StylistServiceValidations.stylistById,
      ValidationMiddleware.handleValidationErrors,
      this.stylistServiceController.getStylistWithServices,
    );

    this.router.get(
      '/services/stylists/:stylistId/services',
      StylistServiceValidations.stylistById,
      ValidationMiddleware.handleValidationErrors,
      this.stylistServiceController.getStylistServices,
    );

    this.router.get(
      '/services/:serviceId/stylists/offering',
      StylistServiceValidations.serviceById,
      ValidationMiddleware.handleValidationErrors,
      this.stylistServiceController.getStylistsOfferingService,
    );

    this.router.get(
      '/services/:serviceId/stylists/detailed',
      StylistServiceValidations.serviceById,
      ValidationMiddleware.handleValidationErrors,
      this.stylistServiceController.getServiceWithStylists,
    );

    this.router.get(
      '/services/:serviceId/stylists',
      StylistServiceValidations.serviceById,
      ValidationMiddleware.handleValidationErrors,
      this.stylistServiceController.getServiceStylists,
    );

    // Operaciones de modificación (POST, PUT, DELETE)
    this.router.post(
      '/services/stylists/:stylistId/services',
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(['ADMIN', 'STYLIST']),
      StylistServiceValidations.assignService,
      ValidationMiddleware.handleValidationErrors,
      this.stylistServiceController.assignServiceToStylist,
    );

    this.router.put(
      '/services/stylists/:stylistId/services/:serviceId',
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(['ADMIN', 'STYLIST']),
      StylistServiceValidations.updateStylistService,
      ValidationMiddleware.handleValidationErrors,
      this.stylistServiceController.updateStylistService,
    );

    this.router.delete(
      '/services/stylists/:stylistId/services/:serviceId',
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
 */
