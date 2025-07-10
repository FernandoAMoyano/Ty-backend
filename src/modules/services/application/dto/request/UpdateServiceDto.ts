/**
 * DTO para actualizar un servicio existente
 * Todos los campos son opcionales para permitir actualizaciones parciales
 */
export interface UpdateServiceDto {
  /** Nueva categoría del servicio */
  categoryId?: string;
  
  /** Nuevo nombre del servicio (máximo 150 caracteres, debe ser único si se cambia) */
  name?: string;
  
  /** Nueva descripción del servicio (máximo 1000 caracteres) */
  description?: string;
  
  /** Nueva duración base en minutos (debe ser positivo, máximo 600 minutos) */
  duration?: number;
  
  /** 
   * Nueva variación de duración en minutos 
   * No puede ser negativo ni exceder la duración base (si se proporciona duration)
   */
  durationVariation?: number;
  
  /** Nuevo precio del servicio (no puede ser negativo) */
  price?: number;
}
