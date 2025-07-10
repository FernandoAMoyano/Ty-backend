/**
 * DTO para crear una nueva categoría de servicios
 */
export interface CreateCategoryDto {
  /** Nombre de la categoría (debe ser único, máximo 100 caracteres) */
  name: string;
  
  /** Descripción opcional de la categoría (máximo 500 caracteres) */
  description?: string;
}
