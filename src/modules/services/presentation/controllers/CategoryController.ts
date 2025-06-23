import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../../application/services/CategoryService';
import { CreateCategoryDto } from '../../application/dto/request/CreateCategoryDto';
import { UpdateCategoryDto } from '../../application/dto/request/UpdateCategoryDto ';
import 'express';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      userId: string;
      roleId: string;
      email: string;
    };
  }
}
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const createDto: CreateCategoryDto = req.body;
      const category = await this.categoryService.createCategory(createDto);

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  };

  updateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updateDto: UpdateCategoryDto = req.body;
      const category = await this.categoryService.updateCategory(id, updateDto);

      res.status(200).json({
        success: true,
        message: 'Category updated successfully',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  };

  getCategoryById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const category = await this.categoryService.getCategoryById(id);

      res.status(200).json({
        success: true,
        message: 'Category retrieved successfully',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  };

  getAllCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categories = await this.categoryService.getAllCategories();

      res.status(200).json({
        success: true,
        message: 'Categories retrieved successfully',
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  };

  getActiveCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categories = await this.categoryService.getActiveCategories();

      res.status(200).json({
        success: true,
        message: 'Active categories retrieved successfully',
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  };

  activateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const category = await this.categoryService.activateCategory(id);

      res.status(200).json({
        success: true,
        message: 'Category activated successfully',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  };

  deactivateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const category = await this.categoryService.deactivateCategory(id);

      res.status(200).json({
        success: true,
        message: 'Category deactivated successfully',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.categoryService.deleteCategory(id);

      res.status(200).json({
        success: true,
        message: 'Category deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}
