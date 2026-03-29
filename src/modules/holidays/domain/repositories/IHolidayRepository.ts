import { Holiday } from '../entities/Holiday';

/**
 * Interface para filtros de búsqueda de feriados
 */
export interface HolidayFilters {
  year?: number;
  month?: number;
  startDate?: Date;
  endDate?: Date;
  name?: string;
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
 * Interface del repositorio de feriados
 * @description Define las operaciones de persistencia para la entidad Holiday
 */
export interface IHolidayRepository {
  /**
   * Guarda un nuevo feriado
   * @param holiday - Entidad de feriado a guardar
   * @returns El feriado guardado
   */
  save(holiday: Holiday): Promise<Holiday>;

  /**
   * Busca un feriado por su ID
   * @param id - ID del feriado
   * @returns El feriado encontrado o null
   */
  findById(id: string): Promise<Holiday | null>;

  /**
   * Busca feriados por año
   * @param year - Año a buscar
   * @returns Lista de feriados del año
   */
  findByYear(year: number): Promise<Holiday[]>;

  /**
   * Busca un feriado por fecha exacta
   * @param date - Fecha a buscar
   * @returns El feriado encontrado o null
   */
  findByDate(date: Date): Promise<Holiday | null>;

  /**
   * Busca todos los feriados con filtros opcionales
   * @param filters - Filtros de búsqueda
   * @param pagination - Opciones de paginación
   * @returns Resultado paginado de feriados
   */
  findAll(
    filters?: HolidayFilters,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<Holiday>>;

  /**
   * Busca feriados en un rango de fechas
   * @param startDate - Fecha de inicio
   * @param endDate - Fecha de fin
   * @returns Lista de feriados en el rango
   */
  findByDateRange(startDate: Date, endDate: Date): Promise<Holiday[]>;

  /**
   * Busca feriados próximos (futuros)
   * @param limit - Cantidad máxima de resultados
   * @returns Lista de próximos feriados
   */
  findUpcoming(limit?: number): Promise<Holiday[]>;

  /**
   * Actualiza un feriado existente
   * @param holiday - Entidad de feriado con cambios
   * @returns El feriado actualizado
   */
  update(holiday: Holiday): Promise<Holiday>;

  /**
   * Elimina un feriado por su ID
   * @param id - ID del feriado a eliminar
   * @returns true si se eliminó correctamente
   */
  delete(id: string): Promise<boolean>;

  /**
   * Verifica si existe un feriado en una fecha específica
   * @param date - Fecha a verificar
   * @param excludeId - ID a excluir de la búsqueda (para updates)
   * @returns true si existe un feriado en esa fecha
   */
  existsByDate(date: Date, excludeId?: string): Promise<boolean>;

  /**
   * Verifica si una fecha es feriado
   * @param date - Fecha a verificar
   * @returns true si la fecha es feriado
   */
  isHoliday(date: Date): Promise<boolean>;
}
