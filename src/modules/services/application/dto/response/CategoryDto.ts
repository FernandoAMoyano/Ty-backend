/**
 * DTO de respuesta para información básica de categoría
 */
export interface CategoryDto {
  /** ID único de la categoría */
  id: string;
  
  /** Nombre de la categoría */
  name: string;
  
  /** Descripción opcional de la categoría */
  description?: string;
  
  /** Indica si la categoría está activa */
  isActive: boolean;
  
  /** Número de servicios en esta categoría (opcional, calculado dinámicamente) */
  servicesCount?: number;
  
  /** Fecha de creación de la categoría */
  createdAt: Date;
  
  /** Fecha de última actualización */
  updatedAt: Date;
}
