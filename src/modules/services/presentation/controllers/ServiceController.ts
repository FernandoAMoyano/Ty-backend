import { Request, Response, NextFunction } from 'express';
import { ServiceManagementService } from '../../application/services/ServiceManagementService';
import { CreateServiceDto } from '../../application/dto/request/CreateServiceDto';
import { UpdateServiceDto } from '../../application/dto/request/UpdateServiceDto';

/**
 * Controlador para la gestión de servicios del salón de belleza
 * Maneja las peticiones HTTP relacionadas con operaciones CRUD de servicios
 */
export class ServiceController {
  constructor(private serviceManagementService: ServiceManagementService) {}

  /**
   * Crea un nuevo servicio en el sistema
   * @route POST /services
   * @param req - Request de Express con CreateServiceDto en el body
   * @param res - Response de Express
   * @param next - NextFunction para manejo de errores
   * @returns Promise<void>
   * @description Recibe los datos del servicio, valida y crea un nuevo servicio con categoría
   * @responseStatus 201 - Servicio creado exitosamente
   * @throws ValidationError si los datos no son válidos
   * @throws NotFoundError si la categoría no existe
   * @throws ConflictError si ya existe un servicio con ese nombre
   */
  createService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const createDto: CreateServiceDto = req.body;
      const service = await this.serviceManagementService.createService(createDto);

      res.status(201).json({
        success: true,
        message: 'Service created successfully',
        data: service,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Actualiza un servicio existente
   * @route PUT /services/:id
   * @param req - Request de Express con ID en params y UpdateServiceDto en body
   * @param res - Response de Express
   * @param next - NextFunction para manejo de errores
   * @returns Promise<void>
   * @description Actualiza los datos de un servicio existente incluyendo categoría, precio y duración
   * @responseStatus 200 - Servicio actualizado exitosamente
   * @throws NotFoundError si el servicio no existe
   * @throws ValidationError si los datos no son válidos
   * @throws ConflictError si el nuevo nombre ya está en uso
   */
  updateService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updateDto: UpdateServiceDto = req.body;
      const service = await this.serviceManagementService.updateService(id, updateDto);

      res.status(200).json({
        success: true,
        message: 'Service updated successfully',
        data: service,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene un servicio específico por su ID
   * @route GET /services/:id
   * @param req - Request de Express con ID en params
   * @param res - Response de Express
   * @param next - NextFunction para manejo de errores
   * @returns Promise<void>
   * @description Retorna los datos completos de un servicio incluyendo información de categoría
   * @responseStatus 200 - Servicio encontrado exitosamente
   * @throws NotFoundError si el servicio no existe
   */
  getServiceById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const service = await this.serviceManagementService.getServiceById(id);

      res.status(200).json({
        success: true,
        message: 'Service retrieved successfully',
        data: service,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene todos los servicios del sistema (activos e inactivos)
   * @route GET /services
   * @param req - Request de Express
   * @param res - Response de Express
   * @param next - NextFunction para manejo de errores
   * @returns Promise<void>
   * @description Retorna lista completa de servicios con información de categorías
   * @responseStatus 200 - Servicios obtenidos exitosamente
   */
  getAllServices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const services = await this.serviceManagementService.getAllServices();

      res.status(200).json({
        success: true,
        message: 'Services retrieved successfully',
        data: services,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene solo los servicios activos del sistema
   * @route GET /services/active
   * @param req - Request de Express
   * @param res - Response de Express
   * @param next - NextFunction para manejo de errores
   * @returns Promise<void>
   * @description Retorna lista de servicios activos para uso público
   * @responseStatus 200 - Servicios activos obtenidos exitosamente
   */
  getActiveServices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const services = await this.serviceManagementService.getActiveServices();

      res.status(200).json({
        success: true,
        message: 'Active services retrieved successfully',
        data: services,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene todos los servicios de una categoría específica
   * @route GET /services/category/:categoryId
   * @param req - Request de Express con categoryId en params
   * @param res - Response de Express
   * @param next - NextFunction para manejo de errores
   * @returns Promise<void>
   * @description Retorna servicios filtrados por categoría (activos e inactivos)
   * @responseStatus 200 - Servicios de la categoría obtenidos exitosamente
   * @throws NotFoundError si la categoría no existe
   */
  getServicesByCategory = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { categoryId } = req.params;
      const services = await this.serviceManagementService.getServicesByCategory(categoryId);

      res.status(200).json({
        success: true,
        message: 'Services by category retrieved successfully',
        data: services,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene solo los servicios activos de una categoría específica
   * @route GET /services/category/:categoryId/active
   * @param req - Request de Express con categoryId en params
   * @param res - Response de Express
   * @param next - NextFunction para manejo de errores
   * @returns Promise<void>
   * @description Retorna servicios activos filtrados por categoría para uso público
   * @responseStatus 200 - Servicios activos de la categoría obtenidos exitosamente
   * @throws NotFoundError si la categoría no existe
   */
  getActiveServicesByCategory = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { categoryId } = req.params;
      const services = await this.serviceManagementService.getActiveServicesByCategory(categoryId);

      res.status(200).json({
        success: true,
        message: 'Active services by category retrieved successfully',
        data: services,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Activa un servicio previamente desactivado
   * @route PATCH /services/:id/activate
   * @param req - Request de Express con ID en params
   * @param res - Response de Express
   * @param next - NextFunction para manejo de errores
   * @returns Promise<void>
   * @description Cambia el estado del servicio a activo
   * @responseStatus 200 - Servicio activado exitosamente
   * @throws NotFoundError si el servicio no existe
   */
  activateService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const service = await this.serviceManagementService.activateService(id);

      res.status(200).json({
        success: true,
        message: 'Service activated successfully',
        data: service,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Desactiva un servicio sin eliminarlo del sistema
   * @route PATCH /services/:id/deactivate
   * @param req - Request de Express con ID en params
   * @param res - Response de Express
   * @param next - NextFunction para manejo de errores
   * @returns Promise<void>
   * @description Cambia el estado del servicio a inactivo
   * @responseStatus 200 - Servicio desactivado exitosamente
   * @throws NotFoundError si el servicio no existe
   */
  deactivateService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const service = await this.serviceManagementService.deactivateService(id);

      res.status(200).json({
        success: true,
        message: 'Service deactivated successfully',
        data: service,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Elimina permanentemente un servicio del sistema
   * @route DELETE /services/:id
   * @param req - Request de Express con ID en params
   * @param res - Response de Express
   * @param next - NextFunction para manejo de errores
   * @returns Promise<void>
   * @description Elimina el servicio de forma permanente
   * @responseStatus 200 - Servicio eliminado exitosamente
   * @throws NotFoundError si el servicio no existe
   */
  deleteService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.serviceManagementService.deleteService(id);

      res.status(200).json({
        success: true,
        message: 'Service deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}
