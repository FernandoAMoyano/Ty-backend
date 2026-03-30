import { ScheduleException } from '../entities/ScheduleException';

/**
 * Interface para filtros de búsqueda de excepciones
 */
export interface ScheduleExceptionFilters {
  startDate?: Date;
  endDate?: Date;
  holidayId?: string;
  reason?: string;
}

/**
 * Interface para opciones de paginación
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
}

/**
 * Interface para resultado paginado
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Interface del repositorio de excepciones de horario
 * @description Define las operaciones de persistencia para la entidad ScheduleException
 */
export interface IScheduleExceptionRepository {
  /**
   * Guarda una nueva excepción
   * @param exception - Entidad de excepción a guardar
   * @returns La excepción guardada
   */
  save(exception: ScheduleException): Promise<ScheduleException>;

  /**
   * Busca una excepción por su ID
   * @param id - ID de la excepción
   * @returns La excepción encontrada o null
   */
  findById(id: string): Promise<ScheduleException | null>;

  /**
   * Busca excepciones por fecha
   * @param date - Fecha a buscar
   * @returns Lista de excepciones para esa fecha
   */
  findByDate(date: Date): Promise<ScheduleException[]>;

  /**
   * Busca excepciones por ID de feriado
   * @param holidayId - ID del feriado
   * @returns Lista de excepciones asociadas al feriado
   */
  findByHolidayId(holidayId: string): Promise<ScheduleException[]>;

  /**
   * Busca todas las excepciones con filtros opcionales
   * @param filters - Filtros de búsqueda
   * @param pagination - Opciones de paginación
   * @returns Resultado paginado de excepciones
   */
  findAll(
    filters?: ScheduleExceptionFilters,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<ScheduleException>>;

  /**
   * Busca excepciones en un rango de fechas
   * @param startDate - Fecha de inicio
   * @param endDate - Fecha de fin
   * @returns Lista de excepciones en el rango
   */
  findByDateRange(startDate: Date, endDate: Date): Promise<ScheduleException[]>;

  /**
   * Busca excepciones próximas (futuras)
   * @param limit - Cantidad máxima de resultados
   * @returns Lista de próximas excepciones
   */
  findUpcoming(limit?: number): Promise<ScheduleException[]>;

  /**
   * Actualiza una excepción existente
   * @param exception - Entidad de excepción con cambios
   * @returns La excepción actualizada
   */
  update(exception: ScheduleException): Promise<ScheduleException>;

  /**
   * Elimina una excepción por su ID
   * @param id - ID de la excepción a eliminar
   * @returns true si se eliminó correctamente
   */
  delete(id: string): Promise<boolean>;

  /**
   * Elimina todas las excepciones asociadas a un feriado
   * @param holidayId - ID del feriado
   * @returns Número de excepciones eliminadas
   */
  deleteByHolidayId(holidayId: string): Promise<number>;

  /**
   * Verifica si existe una excepción en una fecha específica
   * @param date - Fecha a verificar
   * @param excludeId - ID a excluir de la búsqueda (para updates)
   * @returns true si existe una excepción en esa fecha
   */
  existsByDate(date: Date, excludeId?: string): Promise<boolean>;

  /**
   * Obtiene la excepción de horario para una fecha (si existe)
   * @param date - Fecha a verificar
   * @returns La excepción si existe, null si no
   */
  getExceptionForDate(date: Date): Promise<ScheduleException | null>;
}
