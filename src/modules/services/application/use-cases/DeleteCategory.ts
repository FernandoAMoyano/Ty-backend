import { ICategoryRepository } from '../../domain/repositories/ICategoryRepository';
import { IServiceRepository } from '../../domain/repositories/IServiceRepository';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { BusinessRuleError } from '../../../../shared/exceptions/BusinessRuleError';

/**
 * Caso de uso para eliminar permanentemente una categoría del sistema
 * Valida que no existan servicios asociados antes de eliminar
 */
export class DeleteCategory {
  constructor(
    private categoryRepository: ICategoryRepository,
    private serviceRepository: IServiceRepository,
  ) {}

  /**
   * Ejecuta la eliminación de una categoría
   * @param id - ID único de la categoría a eliminar
   * @returns Promise que se resuelve cuando la eliminación es exitosa
   * @throws NotFoundError si la categoría no existe
   * @throws BusinessRuleError si la categoría tiene servicios asociados
   */
  async execute(id: string): Promise<void> {
    const exists = await this.categoryRepository.existsById(id);
    if (!exists) {
      throw new NotFoundError('Category', id);
    }

    // Validar que no existan servicios asociados
    const services = await this.serviceRepository.findByCategory(id);
    if (services.length > 0) {
      throw new BusinessRuleError(
        `Cannot delete category: it has ${services.length} associated service(s)`,
      );
    }

    await this.categoryRepository.delete(id);
  }
}
