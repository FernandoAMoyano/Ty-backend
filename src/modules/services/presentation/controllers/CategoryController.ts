import { Request, Response, NextFunction } from 'express';
import { CreateCategory } from '../../application/use-cases/CreateCategory';
import { UpdateCategory } from '../../application/use-cases/UpdateCategory';
import { GetCategoryById } from '../../application/use-cases/GetCategoryById';
import { GetAllCategories } from '../../application/use-cases/GetAllCategories';
import { GetActiveCategories } from '../../application/use-cases/GetActiveCategories';
import { ActivateCategory } from '../../application/use-cases/ActivateCategory';
import { DeactivateCategory } from '../../application/use-cases/DeactivateCategory';
import { DeleteCategory } from '../../application/use-cases/DeleteCategory';
import { CreateCategoryDto } from '../../application/dto/request/CreateCategoryDto';
import { UpdateCategoryDto } from '../../application/dto/request/UpdateCategoryDto';

/**
 * Controlador para la gestión de categorías de servicios
 * Maneja las peticiones HTTP relacionadas con operaciones CRUD de categorías
 */
export class CategoryController {
  constructor(
    private _createCategory: CreateCategory,
    private _updateCategory: UpdateCategory,
    private _getCategoryById: GetCategoryById,
    private _getAllCategories: GetAllCategories,
    private _getActiveCategories: GetActiveCategories,
    private _activateCategory: ActivateCategory,
    private _deactivateCategory: DeactivateCategory,
    private _deleteCategory: DeleteCategory,
  ) {}

  /**
   * Crea una nueva categoría en el sistema
   * @route POST /categories
   * @responseStatus 201 - Categoría creada exitosamente
   * @throws ValidationError si los datos no son válidos
   * @throws ConflictError si ya existe una categoría con ese nombre
   */
  createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const createDto: CreateCategoryDto = req.body;
      const category = await this._createCategory.execute(createDto);
      res.status(201).json({ success: true, message: 'Category created successfully', data: category });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Actualiza una categoría existente
   * @route PUT /categories/:id
   * @responseStatus 200 - Categoría actualizada exitosamente
   * @throws NotFoundError si la categoría no existe
   * @throws ConflictError si el nuevo nombre ya está en uso
   */
  updateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updateDto: UpdateCategoryDto = req.body;
      const category = await this._updateCategory.execute(id, updateDto);
      res.status(200).json({ success: true, message: 'Category updated successfully', data: category });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene una categoría específica por su ID
   * @route GET /categories/:id
   * @responseStatus 200 - Categoría encontrada exitosamente
   * @throws NotFoundError si la categoría no existe
   */
  getCategoryById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const category = await this._getCategoryById.execute(id);
      res.status(200).json({ success: true, message: 'Category retrieved successfully', data: category });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene todas las categorías del sistema
   * @route GET /categories
   * @responseStatus 200 - Categorías obtenidas exitosamente
   */
  getAllCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categories = await this._getAllCategories.execute();
      res.status(200).json({ success: true, message: 'Categories retrieved successfully', data: categories });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obtiene solo las categorías activas del sistema
   * @route GET /categories/active
   * @responseStatus 200 - Categorías activas obtenidas exitosamente
   */
  getActiveCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categories = await this._getActiveCategories.execute();
      res.status(200).json({ success: true, message: 'Active categories retrieved successfully', data: categories });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Activa una categoría previamente desactivada
   * @route PATCH /categories/:id/activate
   * @responseStatus 200 - Categoría activada exitosamente
   * @throws NotFoundError si la categoría no existe
   */
  activateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const category = await this._activateCategory.execute(id);
      res.status(200).json({ success: true, message: 'Category activated successfully', data: category });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Desactiva una categoría sin eliminarla del sistema
   * @route PATCH /categories/:id/deactivate
   * @responseStatus 200 - Categoría desactivada exitosamente
   * @throws NotFoundError si la categoría no existe
   */
  deactivateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const category = await this._deactivateCategory.execute(id);
      res.status(200).json({ success: true, message: 'Category deactivated successfully', data: category });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Elimina permanentemente una categoría del sistema
   * @route DELETE /categories/:id
   * @responseStatus 200 - Categoría eliminada exitosamente
   * @throws NotFoundError si la categoría no existe
   */
  deleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this._deleteCategory.execute(id);
      res.status(200).json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
      next(error);
    }
  };
}
