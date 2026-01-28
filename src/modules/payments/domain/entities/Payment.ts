/**
 * Enum para los estados de pago
 * @description Define los posibles estados de un pago en el sistema
 */
export enum PaymentStatusEnum {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED',
}

/**
 * Enum para los métodos de pago
 * @description Define los métodos de pago aceptados en el sistema
 */
export enum PaymentMethodEnum {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  TRANSFER = 'TRANSFER',
  ONLINE = 'ONLINE',
}

/**
 * Interface para las propiedades del pago
 */
export interface PaymentProps {
  id: string;
  amount: number;
  status: PaymentStatusEnum;
  method: PaymentMethodEnum | null;
  paymentDate: Date | null;
  appointmentId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Entidad Payment
 * @description Representa un pago asociado a una cita en el sistema
 */
export class Payment {
  private readonly _id: string;
  private _amount: number;
  private _status: PaymentStatusEnum;
  private _method: PaymentMethodEnum | null;
  private _paymentDate: Date | null;
  private readonly _appointmentId: string;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: PaymentProps) {
    this._id = props.id;
    this._amount = props.amount;
    this._status = props.status;
    this._method = props.method;
    this._paymentDate = props.paymentDate;
    this._appointmentId = props.appointmentId;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get amount(): number {
    return this._amount;
  }

  get status(): PaymentStatusEnum {
    return this._status;
  }

  get method(): PaymentMethodEnum | null {
    return this._method;
  }

  get paymentDate(): Date | null {
    return this._paymentDate;
  }

  get appointmentId(): string {
    return this._appointmentId;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * Verifica si el pago está completado
   */
  get isCompleted(): boolean {
    return this._status === PaymentStatusEnum.COMPLETED;
  }

  /**
   * Verifica si el pago está pendiente
   */
  get isPending(): boolean {
    return this._status === PaymentStatusEnum.PENDING;
  }

  /**
   * Verifica si el pago fue reembolsado
   */
  get isRefunded(): boolean {
    return this._status === PaymentStatusEnum.REFUNDED;
  }

  /**
   * Verifica si el pago falló
   */
  get isFailed(): boolean {
    return this._status === PaymentStatusEnum.FAILED;
  }

  /**
   * Marca el pago como completado
   * @param method - Método de pago utilizado
   */
  markAsCompleted(method: PaymentMethodEnum): void {
    if (this._status !== PaymentStatusEnum.PENDING) {
      throw new Error('Solo se pueden completar pagos pendientes');
    }
    this._status = PaymentStatusEnum.COMPLETED;
    this._method = method;
    this._paymentDate = new Date();
    this._updatedAt = new Date();
  }

  /**
   * Marca el pago como fallido
   */
  markAsFailed(): void {
    if (this._status !== PaymentStatusEnum.PENDING) {
      throw new Error('Solo se pueden marcar como fallidos pagos pendientes');
    }
    this._status = PaymentStatusEnum.FAILED;
    this._updatedAt = new Date();
  }

  /**
   * Procesa un reembolso del pago
   */
  refund(): void {
    if (this._status !== PaymentStatusEnum.COMPLETED) {
      throw new Error('Solo se pueden reembolsar pagos completados');
    }
    this._status = PaymentStatusEnum.REFUNDED;
    this._updatedAt = new Date();
  }

  /**
   * Actualiza el monto del pago
   * @param amount - Nuevo monto
   */
  updateAmount(amount: number): void {
    if (this._status !== PaymentStatusEnum.PENDING) {
      throw new Error('Solo se puede actualizar el monto de pagos pendientes');
    }
    if (amount <= 0) {
      throw new Error('El monto debe ser mayor a 0');
    }
    this._amount = amount;
    this._updatedAt = new Date();
  }

  /**
   * Convierte la entidad a un objeto plano
   */
  toObject(): PaymentProps {
    return {
      id: this._id,
      amount: this._amount,
      status: this._status,
      method: this._method,
      paymentDate: this._paymentDate,
      appointmentId: this._appointmentId,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  /**
   * Factory method para crear un nuevo pago
   */
  static create(
    id: string,
    amount: number,
    appointmentId: string,
  ): Payment {
    if (amount <= 0) {
      throw new Error('El monto debe ser mayor a 0');
    }

    return new Payment({
      id,
      amount,
      status: PaymentStatusEnum.PENDING,
      method: null,
      paymentDate: null,
      appointmentId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}
