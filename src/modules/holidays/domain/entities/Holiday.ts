/**
 * Interface para las propiedades del feriado
 */
export interface HolidayProps {
  id: string;
  name: string;
  date: Date;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Entidad Holiday
 * @description Representa un día feriado en el sistema donde el salón no opera
 */
export class Holiday {
  private readonly _id: string;
  private _name: string;
  private _date: Date;
  private _description: string | null;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: HolidayProps) {
    this._id = props.id;
    this._name = props.name;
    this._date = props.date;
    this._description = props.description;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get date(): Date {
    return this._date;
  }

  get description(): string | null {
    return this._description;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * Obtiene el año del feriado
   */
  get year(): number {
    return this._date.getFullYear();
  }

  /**
   * Obtiene el mes del feriado (1-12)
   */
  get month(): number {
    return this._date.getMonth() + 1;
  }

  /**
   * Obtiene el día del mes del feriado
   */
  get day(): number {
    return this._date.getDate();
  }

  /**
   * Verifica si el feriado es en una fecha específica
   * @param date - Fecha a comparar
   */
  isOnDate(date: Date): boolean {
    return (
      this._date.getFullYear() === date.getFullYear() &&
      this._date.getMonth() === date.getMonth() &&
      this._date.getDate() === date.getDate()
    );
  }

  /**
   * Verifica si el feriado ya pasó
   */
  get isPast(): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const holidayDate = new Date(this._date);
    holidayDate.setHours(0, 0, 0, 0);
    return holidayDate < today;
  }

  /**
   * Verifica si el feriado es hoy
   */
  get isToday(): boolean {
    const today = new Date();
    return this.isOnDate(today);
  }

  /**
   * Verifica si el feriado es futuro
   */
  get isFuture(): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const holidayDate = new Date(this._date);
    holidayDate.setHours(0, 0, 0, 0);
    return holidayDate > today;
  }

  /**
   * Actualiza el nombre del feriado
   * @param name - Nuevo nombre
   */
  updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('El nombre del feriado no puede estar vacío');
    }
    this._name = name.trim();
    this._updatedAt = new Date();
  }

  /**
   * Actualiza la fecha del feriado
   * @param date - Nueva fecha
   */
  updateDate(date: Date): void {
    this._date = date;
    this._updatedAt = new Date();
  }

  /**
   * Actualiza la descripción del feriado
   * @param description - Nueva descripción
   */
  updateDescription(description: string | null): void {
    this._description = description ? description.trim() : null;
    this._updatedAt = new Date();
  }

  /**
   * Convierte la entidad a un objeto plano
   */
  toObject(): HolidayProps {
    return {
      id: this._id,
      name: this._name,
      date: this._date,
      description: this._description,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  /**
   * Factory method para crear un nuevo feriado
   * @param id - ID único del feriado
   * @param name - Nombre del feriado
   * @param date - Fecha del feriado
   * @param description - Descripción opcional
   */
  static create(
    id: string,
    name: string,
    date: Date,
    description?: string | null,
  ): Holiday {
    if (!name || name.trim().length === 0) {
      throw new Error('El nombre del feriado no puede estar vacío');
    }

    return new Holiday({
      id,
      name: name.trim(),
      date,
      description: description ? description.trim() : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}
