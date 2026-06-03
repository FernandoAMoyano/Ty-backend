import { Request, Response, NextFunction } from 'express';
import { CreateService } from '../../application/use-cases/CreateService';
import { UpdateService } from '../../application/use-cases/UpdateService';
import { GetServiceById } from '../../application/use-cases/GetServiceById';
import { GetAllServices } from '../../application/use-cases/GetAllServices';
import { GetActiveServices } from '../../application/use-cases/GetActiveServices';
import { GetServicesByCategory } from '../../application/use-cases/GetServicesByCategory';
import { GetActiveServicesByCategory } from '../../application/use-cases/GetActiveServicesByCategory';
import { ActivateService } from '../../application/use-cases/ActivateService';
import { DeactivateService } from '../../application/use-cases/DeactivateService';
import { DeleteService } from '../../application/use-cases/DeleteService';
import { CreateServiceDto } from '../../application/dto/request/CreateServiceDto';
import { UpdateServiceDto } from '../../application/dto/request/UpdateServiceDto';

/**
 * Controlador para la gestión de servicios del salón de belleza
 * Maneja las peticiones HTTP relacionadas con operaciones CRUD de servicios
 */
export class ServiceController {
  constructor(
    private _createService: CreateService,
    private _updateService: UpdateService,
    private _getServiceById: GetServiceById,
    private _getAllServices: GetAllServices,
    private _getActiveServices: GetActiveServices,
    private _getServicesByCategory: GetServicesByCategory,
    private _getActiveServicesByCategory: GetActiveServicesByCategory,
    private _activateService: ActivateService,
    private _deactivateService: DeactivateService,
    private _deleteService: DeleteService,
  ) {}

  /**
   * Crea un nuevo servicio en el sistema
   * @route POST /servicesø
   * @responseStatus 201 - Servicio creado exitosamente
   */
  createService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const createDto: CreateServiceDto = req.body;
      const service = await this._createService.execute(createDto);
      res
        .status(201)
        .json({ success: true, message: 'Service created successfully', data: service });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Actualiza un servicio existente
   * @route PUT /services/:id
   * @responseStatus 200 - Servicio actualizado exitosamente
   */
  updateService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updateDto: UpdateServiceDto = req.body;
      const service = await this._updateService.execute(id, updateDto);
      res
        .status(200)
        .json({ success: true, message: 'Service updated successfully', data: service });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene un servicio específico por su ID
   * @route GET /services/:id
   * @responseStatus 200 - Servicio encontrado exitosamente
   */
  getServiceById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const service = await this._getServiceById.execute(id);
      res
        .status(200)
        .json({ success: true, message: 'Service retrieved successfully', data: service });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene todos los servicios del sistema
   * @route GET /services
   * @responseStatus 200 - Servicios obtenidos exitosamente
   */
  getAllServices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const services = await this._getAllServices.execute();
      res
        .status(200)
        .json({ success: true, message: 'Services retrieved successfully', data: services });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene solo los servicios activos del sistema
   * @route GET /services/active
   * @responseStatus 200 - Servicios activos obtenidos exitosamente
   */
  getActiveServices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const services = await this._getActiveServices.execute();
      res
        .status(200)
        .json({ success: true, message: 'Active services retrieved successfully', data: services });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene todos los servicios de una categoría específica
   * @route GET /services/category/:categoryId
   * @responseStatus 200 - Servicios de la categoría obtenidos exitosamente
   */
  getServicesByCategory = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { categoryId } = req.params;
      const services = await this._getServicesByCategory.execute(categoryId);
      res
        .status(200)
        .json({
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
   * @responseStatus 200 - Servicios activos de la categoría obtenidos exitosamente
   */
  getActiveServicesByCategory = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { categoryId } = req.params;
      const services = await this._getActiveServicesByCategory.execute(categoryId);
      res
        .status(200)
        .json({
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
   * @responseStatus 200 - Servicio activado exitosamente
   */
  activateService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const service = await this._activateService.execute(id);
      res
        .status(200)
        .json({ success: true, message: 'Service activated successfully', data: service });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Desactiva un servicio sin eliminarlo del sistema
   * @route PATCH /services/:id/deactivate
   * @responseStatus 200 - Servicio desactivado exitosamente
   */
  deactivateService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const service = await this._deactivateService.execute(id);
      res
        .status(200)
        .json({ success: true, message: 'Service deactivated successfully', data: service });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Elimina permanentemente un servicio del sistema
   * @route DELETE /services/:id
   * @responseStatus 200 - Servicio eliminado exitosamente
   */
  deleteService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this._deleteService.execute(id);
      res.status(200).json({ success: true, message: 'Service deleted successfully' });
    } catch (error) {
      next(error);
    }
  };
}
