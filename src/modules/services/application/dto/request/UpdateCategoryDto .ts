/**
 * DTO para actualizar una categoría existente
 * Todos los campos son opcionales para permitir actualizaciones parciales
 */
export interface UpdateCategoryDto {
  /** Nuevo nombre de la categoría (máximo 100 caracteres, debe ser único si se cambia) */
  name?: string;
  
  /** Nueva descripción de la categoría (máximo 500 caracteres) */
  description?: string;
}
