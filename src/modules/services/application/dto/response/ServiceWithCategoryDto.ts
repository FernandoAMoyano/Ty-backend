/**
 * DTO de respuesta para servicio con información de categoría simplificada
 * Versión desnormalizada que incluye solo el nombre de la categoría
 */
export interface ServiceWithCategoryDto {
  /** ID único del servicio */
  id: string;
  
  /** Nombre del servicio */
  name: string;
  
  /** Descripción detallada del servicio */
  description: string;
  
  /** Duración del servicio en minutos */
  duration: number;
  
  /** Variación permitida en la duración */
  durationVariation: number;
  
  /** Precio del servicio */
  price: number;
  
  /** Precio formateado para mostrar */
  formattedPrice: string;
  
  /** Indica si el servicio está activo */
  isActive: boolean;
  
  /** Nombre de la categoría (desnormalizado para eficiencia) */
  categoryName: string;
  
  /** Fecha de creación del servicio */
  createdAt: Date;
  
  /** Fecha de última actualización */
  updatedAt: Date;
}
