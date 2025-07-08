import { DayOfWeekEnum } from '../../modules/appointments/domain/entities/Schedule';
import { ValidationError } from '../exceptions/ValidationError';

export class DayOfWeekUtils {
  private static readonly DAY_MAPPING: Record<number, DayOfWeekEnum> = {
    0: DayOfWeekEnum.SUNDAY,
    1: DayOfWeekEnum.MONDAY,
    2: DayOfWeekEnum.TUESDAY,
    3: DayOfWeekEnum.WEDNESDAY,
    4: DayOfWeekEnum.THURSDAY,
    5: DayOfWeekEnum.FRIDAY,
    6: DayOfWeekEnum.SATURDAY,
  };

  private static readonly STRING_MAPPING: Record<string, DayOfWeekEnum> = {
    SUNDAY: DayOfWeekEnum.SUNDAY,
    MONDAY: DayOfWeekEnum.MONDAY,
    TUESDAY: DayOfWeekEnum.TUESDAY,
    WEDNESDAY: DayOfWeekEnum.WEDNESDAY,
    THURSDAY: DayOfWeekEnum.THURSDAY,
    FRIDAY: DayOfWeekEnum.FRIDAY,
    SATURDAY: DayOfWeekEnum.SATURDAY,
  };

  /**
   * Convierte una fecha de JavaScript en Dayofweek Enum
   * @param date - La fecha para convertir
   * @returns El dayofweekenum correspondiente
   * @throws ValidationError si la fecha no es válida
   */
  static fromDate(date: Date): DayOfWeekEnum {
    if (!date || isNaN(date.getTime())) {
      throw new ValidationError('Invalid date provided');
    }

    const dayNumber = date.getDay();
    const dayEnum = this.DAY_MAPPING[dayNumber];

    if (!dayEnum) {
      throw new ValidationError(`Invalid day number: ${dayNumber}`);
    }

    return dayEnum;
  }

  /**
   * Convierte una cadena en DayofWeekenum (insensible a los casos)
   * @param dayString - La cadena del día para convertir
   * @returns El dayofweekenum correspondiente
   * @throws ValidationError si la cadena no es válida
   */
  static fromString(dayString: string): DayOfWeekEnum {
    if (!dayString || typeof dayString !== 'string') {
      throw new ValidationError('Day string is required');
    }

    const upperDay = dayString.trim().toUpperCase();
    const dayEnum = this.STRING_MAPPING[upperDay];

    if (!dayEnum) {
      throw new ValidationError(
        `Invalid day string: ${dayString}. Valid values are: ${this.getValidDayStrings().join(', ')}`,
      );
    }

    return dayEnum;
  }

  /**
   * Verificación si una cadena es un día válido de semana
   * @param dayString - la cadena para validar
   * @returns Verdadero si es válido, falso de lo contrario
   */
  static isValidDayString(dayString: string): boolean {
    if (!dayString || typeof dayString !== 'string') {
      return false;
    }

    const upperDay = dayString.trim().toUpperCase();
    return upperDay in this.STRING_MAPPING;
  }

  /**
   * Convertir Dayofweek enum al número de día de JavaScript (0-6)
   * @param dayEnum - El enum para convertir
   * @returns El número de día de JavaScript correspondiente
   */
  static toJavaScriptDay(dayEnum: DayOfWeekEnum): number {
    const reverseMapping: Record<DayOfWeekEnum, number> = {
      [DayOfWeekEnum.SUNDAY]: 0,
      [DayOfWeekEnum.MONDAY]: 1,
      [DayOfWeekEnum.TUESDAY]: 2,
      [DayOfWeekEnum.WEDNESDAY]: 3,
      [DayOfWeekEnum.THURSDAY]: 4,
      [DayOfWeekEnum.FRIDAY]: 5,
      [DayOfWeekEnum.SATURDAY]: 6,
    };

    return reverseMapping[dayEnum];
  }

  /**
   * Obtiene todas las strings de día válidos
   * @returns Variedad de strings de día válidas
   */
  static getValidDayStrings(): string[] {
    return Object.keys(this.STRING_MAPPING);
  }

  /**
   * Obtiene todo el día de los valores de Enum Week
   * @returns Matriz de todos los valores de enum
   */
  static getAllDays(): DayOfWeekEnum[] {
    return Object.values(DayOfWeekEnum);
  }

  /**
   * Obtiene días de trabajo (de lunes a viernes)
   * @returns Variedad de días hábiles
   */
  static getWorkingDays(): DayOfWeekEnum[] {
    return [
      DayOfWeekEnum.MONDAY,
      DayOfWeekEnum.TUESDAY,
      DayOfWeekEnum.WEDNESDAY,
      DayOfWeekEnum.THURSDAY,
      DayOfWeekEnum.FRIDAY,
    ];
  }

  /**
   * Obtiene días de fin de semana (sábado y domingo)
   * @returns Variedad de días de fin de semana
   */
  static getWeekendDays(): DayOfWeekEnum[] {
    return [DayOfWeekEnum.SATURDAY, DayOfWeekEnum.SUNDAY];
  }

  /**
   * Cheques si un día es un día de trabajo
   * @param day - El día para verificar
   * @returns verdadero si es un día de trabajo, falso de lo contrario
   */
  static isWorkingDay(day: DayOfWeekEnum): boolean {
    return this.getWorkingDays().includes(day);
  }

  /**
   * Cheques si un día es un día de fin de semana
   * @param day - El día para verificar
   * @returns verdadero si es un día de fin de semana, falso de lo contrario
   */
  static isWeekendDay(day: DayOfWeekEnum): boolean {
    return this.getWeekendDays().includes(day);
  }

  /**
   * Obtiene el día siguiente de la semana
   * @param day - El día actual
   * @returns El día siguiente
   */
  static getNextDay(day: DayOfWeekEnum): DayOfWeekEnum {
    const currentIndex = this.toJavaScriptDay(day);
    const nextIndex = (currentIndex + 1) % 7;
    return this.DAY_MAPPING[nextIndex];
  }

  /**
   * Obtiene el día anterior de la semana
   * @param day - El día actual
   * @returns El día anterior
   */
  static getPreviousDay(day: DayOfWeekEnum): DayOfWeekEnum {
    const currentIndex = this.toJavaScriptDay(day);
    const previousIndex = (currentIndex - 1 + 7) % 7;
    return this.DAY_MAPPING[previousIndex];
  }

  /**
   * Clasifica una variedad de días en orden semanal (domingo primero)
   * @param days - Variedad de días para clasificar
   * @returns Matriz ordenada
   */
  static sortDaysInWeeklyOrder(days: DayOfWeekEnum[]): DayOfWeekEnum[] {
    return days.sort((a, b) => this.toJavaScriptDay(a) - this.toJavaScriptDay(b));
  }

  /**
   * Formatos de un día enum para visualización
   * @param day - El día para formatear
   * @param format - 'completo' |'Corto' |'Min'
   * @returns Cadena de día formateado
   */
  static formatDay(day: DayOfWeekEnum, format: 'full' | 'short' | 'min' = 'full'): string {
    const formats: Record<DayOfWeekEnum, Record<string, string>> = {
      [DayOfWeekEnum.SUNDAY]: { full: 'Sunday', short: 'Sun', min: 'Su' },
      [DayOfWeekEnum.MONDAY]: { full: 'Monday', short: 'Mon', min: 'Mo' },
      [DayOfWeekEnum.TUESDAY]: { full: 'Tuesday', short: 'Tue', min: 'Tu' },
      [DayOfWeekEnum.WEDNESDAY]: { full: 'Wednesday', short: 'Wed', min: 'We' },
      [DayOfWeekEnum.THURSDAY]: { full: 'Thursday', short: 'Thu', min: 'Th' },
      [DayOfWeekEnum.FRIDAY]: { full: 'Friday', short: 'Fri', min: 'Fr' },
      [DayOfWeekEnum.SATURDAY]: { full: 'Saturday', short: 'Sat', min: 'Sa' },
    };

    return formats[day][format];
  }
}
