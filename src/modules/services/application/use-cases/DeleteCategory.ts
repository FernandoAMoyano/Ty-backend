import { ICategoryRepository } from '../../domain/repositories/ICategoryRepository';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';

/**
 * Caso de uso para eliminar permanentemente una categoría del sistema
 */
export class DeleteCategory {
  constructor(private categoryRepository: ICategoryRepository) {}

  /**
   * Ejecuta la eliminación de una categoría
   * @param id - ID único de la categoría a eliminar
   * @returns Promise que se resuelve cuando la eliminación es exitosa
   * @throws NotFoundError si la categoría no existe
   */
  async execute(id: string): Promise<void> {
    const exists = await this.categoryRepository.existsById(id);
    if (!exists) {
      throw new NotFoundError('Category', id);
    }

    await this.categoryRepository.delete(id);
  }
}
