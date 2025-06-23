import { Request, Response, NextFunction } from 'express';
import { ServiceManagementService } from '../../application/services/ServiceManagementService';
import { CreateServiceDto } from '../../application/dto/request/CreateServiceDto';
import { UpdateServiceDto } from '../../application/dto/request/UpdateServiceDto';

export class ServiceController {
  constructor(private serviceManagementService: ServiceManagementService) {}

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
