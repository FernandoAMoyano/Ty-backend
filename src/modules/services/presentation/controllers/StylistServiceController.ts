import { Request, Response, NextFunction } from 'express';
import { StylistServiceService } from '../../application/services/StylistServiceService';
import { AssignServiceDto } from '../../application/dto/request/AssignServiceDto';
import { UpdateStylistServiceDto } from '../../application/dto/request/UpdateStylistServiceDto';

export class StylistServiceController {
  constructor(private stylistServiceService: StylistServiceService) {}

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
