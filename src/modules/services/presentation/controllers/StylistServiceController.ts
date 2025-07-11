import { Request, Response, NextFunction } from 'express';
import { StylistServiceService } from '../../application/services/StylistServiceService';
import { AssignServiceDto } from '../../application/dto/request/AssignServiceDto';
import { UpdateStylistServiceDto } from '../../application/dto/request/UpdateStylistServiceDto';

/**
 * Controlador para la gestión de servicios de estilistas
 * Maneja las peticiones HTTP relacionadas con asignaciones de servicios a estilistas
 */
export class StylistServiceController {
  constructor(private stylistServiceService: StylistServiceService) {}

  /**
   * Asigna un servicio a un estilista específico
   * @route POST /services/stylists/:stylistId/services
   * @param req - Request de Express con stylistId en params y AssignServiceDto en body
   * @param res - Response de Express
   * @param next - NextFunction para manejo de errores
   * @returns Promise<void>
   * @description Crea una nueva asignación de servicio con precio personalizado opcional
   * @responseStatus 201 - Servicio asignado exitosamente
   * @throws NotFoundError si el estilista o servicio no existen
   * @throws ConflictError si el servicio ya está asignado al estilista
   */
  assignServiceToStylist = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { stylistId } = req.params;
      const assignDto: AssignServiceDto = req.body;
      const assignment = await this.stylistServiceService.assignServiceToStylist(
        stylistId,
        assignDto,
      );

      res.status(201).json({
        success: true,
        message: 'Service assigned to stylist successfully',
        data: assignment,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Actualiza una asignación de servicio de estilista existente
   * @route PUT /services/stylists/:stylistId/services/:serviceId
   * @param req - Request de Express con stylistId y serviceId en params, UpdateStylistServiceDto en body
   * @param res - Response de Express
   * @param next - NextFunction para manejo de errores
   * @returns Promise<void>
   * @description Modifica precio personalizado y estado de oferta del servicio
   * @responseStatus 200 - Asignación actualizada exitosamente
   * @throws NotFoundError si la asignación no existe
   */
  updateStylistService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { stylistId, serviceId } = req.params;
      const updateDto: UpdateStylistServiceDto = req.body;
      const assignment = await this.stylistServiceService.updateStylistService(
        stylistId,
        serviceId,
        updateDto,
      );

      res.status(200).json({
        success: true,
        message: 'Stylist service updated successfully',
        data: assignment,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Remueve un servicio de la lista de servicios de un estilista
   * @route DELETE /services/stylists/:stylistId/services/:serviceId
   * @param req - Request de Express con stylistId y serviceId en params
   * @param res - Response de Express
   * @param next - NextFunction para manejo de errores
   * @returns Promise<void>
   * @description Elimina la asignación de servicio del estilista
   * @responseStatus 200 - Servicio removido exitosamente
   * @throws NotFoundError si la asignación no existe
   */
  removeServiceFromStylist = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { stylistId, serviceId } = req.params;
      await this.stylistServiceService.removeServiceFromStylist(stylistId, serviceId);

      res.status(200).json({
        success: true,
        message: 'Service removed from stylist successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene todos los servicios asignados a un estilista
   * @route GET /services/stylists/:stylistId/services
   * @param req - Request de Express con stylistId en params
   * @param res - Response de Express
   * @param next - NextFunction para manejo de errores
   * @returns Promise<void>
   * @description Retorna servicios asignados (activos e inactivos) del estilista
   * @responseStatus 200 - Servicios del estilista obtenidos exitosamente
   * @throws NotFoundError si el estilista no existe
   */
  getStylistServices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { stylistId } = req.params;
      const services = await this.stylistServiceService.getStylistServices(stylistId);

      res.status(200).json({
        success: true,
        message: 'Stylist services retrieved successfully',
        data: services,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene solo los servicios que el estilista está ofreciendo activamente
   * @route GET /services/stylists/:stylistId/services/active
   * @param req - Request de Express con stylistId en params
   * @param res - Response de Express
   * @param next - NextFunction para manejo de errores
   * @returns Promise<void>
   * @description Retorna servicios que el estilista tiene habilitados para ofrecer
   * @responseStatus 200 - Ofertas activas del estilista obtenidas exitosamente
   * @throws NotFoundError si el estilista no existe
   */
  getActiveOfferings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { stylistId } = req.params;
      const services = await this.stylistServiceService.getActiveOfferings(stylistId);

      res.status(200).json({
        success: true,
        message: 'Active stylist offerings retrieved successfully',
        data: services,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene todos los estilistas que pueden realizar un servicio específico
   * @route GET /services/:serviceId/stylists
   * @param req - Request de Express con serviceId en params
   * @param res - Response de Express
   * @param next - NextFunction para manejo de errores
   * @returns Promise<void>
   * @description Retorna estilistas que tienen asignado el servicio especificado
   * @responseStatus 200 - Estilistas del servicio obtenidos exitosamente
   * @throws NotFoundError si el servicio no existe
   */
  getServiceStylists = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { serviceId } = req.params;
      const stylists = await this.stylistServiceService.getServiceStylists(serviceId);

      res.status(200).json({
        success: true,
        message: 'Service stylists retrieved successfully',
        data: stylists,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene estilistas que están ofreciendo activamente un servicio específico
   * @route GET /services/:serviceId/stylists/offering
   * @param req - Request de Express con serviceId en params
   * @param res - Response de Express
   * @param next - NextFunction para manejo de errores
   * @returns Promise<void>
   * @description Retorna solo estilistas que tienen habilitado el servicio para ofertar
   * @responseStatus 200 - Estilistas que ofrecen el servicio obtenidos exitosamente
   * @throws NotFoundError si el servicio no existe
   */
  getStylistsOfferingService = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { serviceId } = req.params;
      const stylists = await this.stylistServiceService.getStylistsOfferingService(serviceId);

      res.status(200).json({
        success: true,
        message: 'Stylists offering service retrieved successfully',
        data: stylists,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene información completa de un estilista con todos sus servicios
   * @route GET /services/stylists/:stylistId/services/detailed
   * @param req - Request de Express con stylistId en params
   * @param res - Response de Express
   * @param next - NextFunction para manejo de errores
   * @returns Promise<void>
   * @description Retorna datos completos del estilista incluyendo estadísticas de servicios
   * @responseStatus 200 - Información detallada del estilista obtenida exitosamente
   * @throws NotFoundError si el estilista no existe
   */
  getStylistWithServices = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { stylistId } = req.params;
      const stylistWithServices =
        await this.stylistServiceService.getStylistWithServices(stylistId);

      res.status(200).json({
        success: true,
        message: 'Stylist with services retrieved successfully',
        data: stylistWithServices,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene información completa de un servicio con todos los estilistas disponibles
   * @route GET /services/:serviceId/stylists/detailed
   * @param req - Request de Express con serviceId en params
   * @param res - Response de Express
   * @param next - NextFunction para manejo de errores
   * @returns Promise<void>
   * @description Retorna datos completos del servicio incluyendo estadísticas de estilistas
   * @responseStatus 200 - Información detallada del servicio obtenida exitosamente
   * @throws NotFoundError si el servicio no existe
   */
  getServiceWithStylists = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { serviceId } = req.params;
      const serviceWithStylists =
        await this.stylistServiceService.getServiceWithStylists(serviceId);

      res.status(200).json({
        success: true,
        message: 'Service with stylists retrieved successfully',
        data: serviceWithStylists,
      });
    } catch (error) {
      next(error);
    }
  };
}
