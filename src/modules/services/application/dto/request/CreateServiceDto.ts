/**
 * DTO para crear un nuevo servicio con todos los datos requeridos
 */
export interface CreateServiceDto {
  /** ID de la categoría a la que pertenece el servicio */
  categoryId: string;
  
  /** Nombre del servicio (debe ser único, máximo 150 caracteres) */
  name: string;
  
  /** Descripción detallada del servicio (requerida, máximo 1000 caracteres) */
  description: string;
  
  /** Duración base del servicio en minutos (debe ser positivo, máximo 600 minutos) */
  duration: number;
  
  /** 
   * Variación de duración en minutos (no puede ser negativo ni exceder la duración base)
   * Permite flexibilidad en el tiempo del servicio
   */
  durationVariation: number;
  
  /** Precio del servicio (no puede ser negativo) */
  price: number;
}
