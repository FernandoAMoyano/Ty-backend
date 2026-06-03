import { Request, Response, NextFunction } from 'express';
import { AssignServiceToStylist } from '../../application/use-cases/AssignServiceToStylist';
import { UpdateStylistService } from '../../application/use-cases/UpdateStylistService';
import { RemoveServiceFromStylist } from '../../application/use-cases/RemoveServiceFromStylist';
import { GetStylistServices } from '../../application/use-cases/GetStylistServices';
import { GetActiveOfferings } from '../../application/use-cases/GetActiveOfferings';
import { GetStylistWithServices } from '../../application/use-cases/GetStylistWithServices';
import { GetServiceStylists } from '../../application/use-cases/GetServiceStylists';
import { GetStylistsOfferingService } from '../../application/use-cases/GetStylistsOfferingService';
import { GetServiceWithStylists } from '../../application/use-cases/GetServiceWithStylists';
import { AssignServiceDto } from '../../application/dto/request/AssignServiceDto';
import { UpdateStylistServiceDto } from '../../application/dto/request/UpdateStylistServiceDto';

/**
 * Controlador para la gestión de servicios de estilistas
 * Maneja las peticiones HTTP relacionadas con asignaciones de servicios a estilistas
 */
export class StylistServiceController {
  constructor(
    private _assignServiceToStylist: AssignServiceToStylist,
    private _updateStylistService: UpdateStylistService,
    private _removeServiceFromStylist: RemoveServiceFromStylist,
    private _getStylistServices: GetStylistServices,
    private _getActiveOfferings: GetActiveOfferings,
    private _getStylistWithServices: GetStylistWithServices,
    private _getServiceStylists: GetServiceStylists,
    private _getStylistsOfferingService: GetStylistsOfferingService,
    private _getServiceWithStylists: GetServiceWithStylists,
  ) {}

  /**
   * Asigna un servicio a un estilista específico
   * @route POST /services/stylists/:stylistId/services
   * @responseStatus 201 - Servicio asignado exitosamente
   */
  assignServiceToStylist = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { stylistId } = req.params;
      const assignDto: AssignServiceDto = req.body;
      const assignment = await this._assignServiceToStylist.execute(stylistId, assignDto);
      res.status(201).json({ success: true, message: 'Service assigned to stylist successfully', data: assignment });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Actualiza una asignación de servicio de estilista existente
   * @route PUT /services/stylists/:stylistId/services/:serviceId
   * @responseStatus 200 - Asignación actualizada exitosamente
   */
  updateStylistService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { stylistId, serviceId } = req.params;
      const updateDto: UpdateStylistServiceDto = req.body;
      const assignment = await this._updateStylistService.execute(stylistId, serviceId, updateDto);
      res.status(200).json({ success: true, message: 'Stylist service updated successfully', data: assignment });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Remueve un servicio de la lista de servicios de un estilista
   * @route DELETE /services/stylists/:stylistId/services/:serviceId
   * @responseStatus 200 - Servicio removido exitosamente
   */
  removeServiceFromStylist = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { stylistId, serviceId } = req.params;
      await this._removeServiceFromStylist.execute(stylistId, serviceId);
      res.status(200).json({ success: true, message: 'Service removed from stylist successfully' });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene todos los servicios asignados a un estilista
   * @route GET /services/stylists/:stylistId/services
   * @responseStatus 200 - Servicios del estilista obtenidos exitosamente
   */
  getStylistServices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { stylistId } = req.params;
      const services = await this._getStylistServices.execute(stylistId);
      res.status(200).json({ success: true, message: 'Stylist services retrieved successfully', data: services });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene solo los servicios que el estilista está ofreciendo activamente
   * @route GET /services/stylists/:stylistId/services/active
   * @responseStatus 200 - Ofertas activas del estilista obtenidas exitosamente
   */
  getActiveOfferings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { stylistId } = req.params;
      const services = await this._getActiveOfferings.execute(stylistId);
      res.status(200).json({ success: true, message: 'Active stylist offerings retrieved successfully', data: services });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene información completa de un estilista con todos sus servicios
   * @route GET /services/stylists/:stylistId/services/detailed
   * @responseStatus 200 - Información detallada del estilista obtenida exitosamente
   */
  getStylistWithServices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { stylistId } = req.params;
      const result = await this._getStylistWithServices.execute(stylistId);
      res.status(200).json({ success: true, message: 'Stylist with services retrieved successfully', data: result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene todos los estilistas que pueden realizar un servicio específico
   * @route GET /services/:serviceId/stylists
   * @responseStatus 200 - Estilistas del servicio obtenidos exitosamente
   */
  getServiceStylists = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { serviceId } = req.params;
      const stylists = await this._getServiceStylists.execute(serviceId);
      res.status(200).json({ success: true, message: 'Service stylists retrieved successfully', data: stylists });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene estilistas que están ofreciendo activamente un servicio específico
   * @route GET /services/:serviceId/stylists/offering
   * @responseStatus 200 - Estilistas que ofrecen el servicio obtenidos exitosamente
   */
  getStylistsOfferingService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { serviceId } = req.params;
      const stylists = await this._getStylistsOfferingService.execute(serviceId);
      res.status(200).json({ success: true, message: 'Stylists offering service retrieved successfully', data: stylists });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene información completa de un servicio con todos los estilistas disponibles
   * @route GET /services/:serviceId/stylists/detailed
   * @responseStatus 200 - Información detallada del servicio obtenida exitosamente
   */
  getServiceWithStylists = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { serviceId } = req.params;
      const result = await this._getServiceWithStylists.execute(serviceId);
      res.status(200).json({ success: true, message: 'Service with stylists retrieved successfully', data: result });
    } catch (error) {
      next(error);
    }
  };
}
