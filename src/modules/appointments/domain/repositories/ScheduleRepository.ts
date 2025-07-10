import { Schedule, DayOfWeekEnum } from '../entities/Schedule';

/**
 * Interfaz del repositorio para la gestión de persistencia de horarios
 * Define todos los métodos necesarios para operaciones CRUD y consultas específicas de horarios
 */
export interface ScheduleRepository {
  // Operaciones básicas de crud

  /**
   * Busca un horario por su ID único
   * @param id - ID único del horario a buscar
   * @returns Promise que resuelve con el horario encontrado o null si no existe
   */
  findById(id: string): Promise<Schedule | null>;

  /**
   * Obtiene todos los horarios del sistema
   * @returns Promise que resuelve con un array de todos los horarios
   */
  findAll(): Promise<Schedule[]>;

  /**
   * Guarda un nuevo horario en el sistema
   * @param schedule - Entidad de horario a guardar
   * @returns Promise que resuelve con el horario guardado (con ID asignado)
   */
  save(schedule: Schedule): Promise<Schedule>;

  /**
   * Actualiza un horario existente en el sistema
   * @param schedule - Entidad de horario con los datos actualizados
   * @returns Promise que resuelve con el horario actualizado
   */
  update(schedule: Schedule): Promise<Schedule>;

  /**
   * Elimina un horario del sistema de forma permanente
   * @param id - ID único del horario a eliminar
   * @returns Promise que resuelve cuando la eliminación se completa
   */
  delete(id: string): Promise<void>;

  /**
   * Verifica si existe un horario con el ID especificado
   * @param id - ID único del horario a verificar
   * @returns Promise que resuelve con true si existe, false en caso contrario
   */
  existsById(id: string): Promise<boolean>;

  // Consultas específicas del negocio

  /**
   * Busca todos los horarios configurados para un día específico de la semana
   * @param dayOfWeek - Día de la semana a buscar (MONDAY, TUESDAY, etc.)
   * @returns Promise que resuelve con un array de horarios para ese día
   */
  findByDayOfWeek(dayOfWeek: DayOfWeekEnum): Promise<Schedule[]>;

  /**
   * Busca todos los horarios asociados a un feriado específico
   * @param holidayId - ID único del feriado
   * @returns Promise que resuelve con un array de horarios especiales para el feriado
   */
  findByHolidayId(holidayId: string): Promise<Schedule[]>;

  /**
   * Busca todos los horarios regulares (sin asociación a feriados)
   * @returns Promise que resuelve con un array de horarios de trabajo normales
   */
  findRegularSchedule(): Promise<Schedule[]>;

  /**
   * Busca todos los horarios especiales (asociados a feriados)
   * @returns Promise que resuelve con un array de horarios de feriados
   */
  findHolidaySchedule(): Promise<Schedule[]>;

  // Consultas basadas en el tiempo

  /**
   * Busca los horarios disponibles para un día específico de la semana
   * Retorna solo horarios que están activos y disponibles para programar citas
   * @param dayOfWeek - Día de la semana a consultar
   * @returns Promise que resuelve con un array de horarios disponibles
   */
  findAvailableSchedulesForDay(dayOfWeek: DayOfWeekEnum): Promise<Schedule[]>;

  /**
   * Busca un horario específico que contenga un slot de tiempo determinado
   * @param dayOfWeek - Día de la semana del slot
   * @param time - Hora específica en formato HH:MM
   * @returns Promise que resuelve con el horario que contiene ese slot o null si no existe
   */
  findScheduleByTimeSlot(dayOfWeek: DayOfWeekEnum, time: string): Promise<Schedule | null>;

  // Detección de conflictos

  /**
   * Busca horarios que puedan tener conflicto con un nuevo horario propuesto
   * @param dayOfWeek - Día de la semana del nuevo horario
   * @param startTime - Hora de inicio del nuevo horario en formato HH:MM
   * @param endTime - Hora de fin del nuevo horario en formato HH:MM
   * @param excludeScheduleId - ID de horario a excluir de la búsqueda (para actualizaciones)
   * @returns Promise que resuelve con un array de horarios en conflicto
   */
  findConflictingSchedules(
    dayOfWeek: DayOfWeekEnum,
    startTime: string,
    endTime: string,
    excludeScheduleId?: string,
  ): Promise<Schedule[]>;
}
