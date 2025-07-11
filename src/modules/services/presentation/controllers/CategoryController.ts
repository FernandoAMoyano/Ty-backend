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

/**
 * Controlador para la gestión de categorías de servicios
 * Maneja las peticiones HTTP relacionadas con operaciones CRUD de categorías
 */

export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  /**
   * Crea una nueva categoría en el sistema
   * @route POST /categories
   * @param req - Request de Express con CreateCategoryDto en el body
   * @param res - Response de Express
   * @param next - NextFunction para manejo de errores
   * @returns Promise<void>
   * @description Recibe los datos de la categoría, valida y crea una nueva categoría
   * @responseStatus 201 - Categoría creada exitosamente
   * @throws ValidationError si los datos no son válidos
   * @throws ConflictError si ya existe una categoría con ese nombre
   */
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

  /**
   * Actualiza una categoría existente
   * @route PUT /categories/:id
   * @param req - Request de Express con ID en params y UpdateCategoryDto en body
   * @param res - Response de Express
   * @param next - NextFunction para manejo de errores
   * @returns Promise<void>
   * @description Actualiza los datos de una categoría existente
   * @responseStatus 200 - Categoría actualizada exitosamente
   * @throws NotFoundError si la categoría no existe
   * @throws ValidationError si los datos no son válidos
   * @throws ConflictError si el nuevo nombre ya está en uso
   */
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

  /**
   * Obtiene una categoría específica por su ID
   * @route GET /categories/:id
   * @param req - Request de Express con ID en params
   * @param res - Response de Express
   * @param next - NextFunction para manejo de errores
   * @returns Promise<void>
   * @description Retorna los datos completos de una categoría
   * @responseStatus 200 - Categoría encontrada exitosamente
   * @throws NotFoundError si la categoría no existe
   */
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

  /**
   * Obtiene todas las categorías del sistema (activas e inactivas)
   * @route GET /categories
   * @param req - Request de Express
   * @param res - Response de Express
   * @param next - NextFunction para manejo de errores
   * @returns Promise<void>
   * @description Retorna lista completa de categorías ordenadas alfabéticamente
   * @responseStatus 200 - Categorías obtenidas exitosamente
   */
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

  /**
   * Obtiene solo las categorías activas del sistema
   * @route GET /categories/active
   * @param req - Request de Express
   * @param res - Response de Express
   * @param next - NextFunction para manejo de errores
   * @returns Promise<void>
   * @description Retorna lista de categorías activas para uso público
   * @responseStatus 200 - Categorías activas obtenidas exitosamente
   */
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

  /**
   * Activa una categoría previamente desactivada
   * @route PATCH /categories/:id/activate
   * @param req - Request de Express con ID en params
   * @param res - Response de Express
   * @param next - NextFunction para manejo de errores
   * @returns Promise<void>
   * @description Cambia el estado de la categoría a activa
   * @responseStatus 200 - Categoría activada exitosamente
   * @throws NotFoundError si la categoría no existe
   */
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

  /**
   * Desactiva una categoría sin eliminarla del sistema
   * @route PATCH /categories/:id/deactivate
   * @param req - Request de Express con ID en params
   * @param res - Response de Express
   * @param next - NextFunction para manejo de errores
   * @returns Promise<void>
   * @description Cambia el estado de la categoría a inactiva
   * @responseStatus 200 - Categoría desactivada exitosamente
   * @throws NotFoundError si la categoría no existe
   */
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

  /**
   * Elimina permanentemente una categoría del sistema
   * @route DELETE /categories/:id
   * @param req - Request de Express con ID en params
   * @param res - Response de Express
   * @param next - NextFunction para manejo de errores
   * @returns Promise<void>
   * @description Elimina la categoría de forma permanente
   * @responseStatus 200 - Categoría eliminada exitosamente
   * @throws NotFoundError si la categoría no existe
   */
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
