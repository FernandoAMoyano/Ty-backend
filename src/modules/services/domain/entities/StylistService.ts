import { ValidationError } from '../../../../shared/exceptions/ValidationError';

export class StylistService {
  constructor(
    public stylistId: string,
    public serviceId: string,
    public customPrice: number | null = null,
    public isOffering: boolean = true,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
  ) {
    this.validate();
  }

  /**
   * Crea una nueva instancia de asignación estilista-servicio con validaciones automáticas
   * @param stylistId - ID único del estilista
   * @param serviceId - ID único del servicio
   * @param customPrice - Precio personalizado para este estilista (null = sin precio personalizado)
   * @returns Nueva instancia de StylistService
   * @throws ValidationError si los datos no son válidos
   */
  static create(stylistId: string, serviceId: string, customPrice: number | null = null): StylistService {
    return new StylistService(stylistId, serviceId, customPrice);
  }

  /**
   * Reconstruye una instancia de asignación desde datos de persistencia
   * @param stylistId - ID del estilista
   * @param serviceId - ID del servicio
   * @param customPrice - Precio personalizado (null = sin precio personalizado)
   * @param isOffering - Estado de oferta (por defecto true)
   * @param createdAt - Fecha de creación (opcional)
   * @param updatedAt - Fecha de última actualización (opcional)
   * @returns Instancia de StylistService desde persistencia
   */
  static fromPersistence(
    stylistId: string,
    serviceId: string,
    customPrice: number | null = null,
    isOffering?: boolean,
    createdAt?: Date,
    updatedAt?: Date,
  ): StylistService {
    return new StylistService(stylistId, serviceId, customPrice, isOffering, createdAt, updatedAt);
  }

  /**
   * Ejecuta todas las validaciones de negocio para la asignación
   * @throws ValidationError si alguna validación falla
   */
  private validate(): void {
    if (!this.stylistId || this.stylistId.trim().length === 0) {
      throw new ValidationError('Stylist ID cannot be empty');
    }

    if (!this.serviceId || this.serviceId.trim().length === 0) {
      throw new ValidationError('Service ID cannot be empty');
    }

    if (this.customPrice !== null && this.customPrice < 0) {
      throw new ValidationError('Custom price cannot be negative');
    }
  }

  /**
   * Actualiza el precio personalizado del estilista para este servicio
   * @param newPrice - Nuevo precio personalizado (null para limpiarlo y usar el precio base)
   * @throws ValidationError si el precio es negativo
   */
  updatePrice(newPrice: number | null): void {
    if (newPrice !== null && newPrice < 0) {
      throw new ValidationError('Custom price cannot be negative');
    }
    this.customPrice = newPrice;
    this.updatedAt = new Date();
  }

  /**
   * Marca que el estilista está ofreciendo activamente este servicio
   */
  startOffering(): void {
    this.isOffering = true;
    this.updatedAt = new Date();
  }

  /**
   * Marca que el estilista no está ofreciendo este servicio temporalmente
   */
  stopOffering(): void {
    this.isOffering = false;
    this.updatedAt = new Date();
  }

  /**
   * Calcula el precio efectivo que cobra el estilista por este servicio
   * @param basePrice - Precio base del servicio
   * @returns Precio efectivo (customPrice si existe, sino basePrice)
   */
  getEffectivePrice(basePrice: number): number {
    return this.customPrice ?? basePrice;
  }

  /**
   * Formatea el precio efectivo para mostrar en la interfaz
   * @description El precio (propio o base) se almacena en centavos (patrón Stripe, ver F2);
   * se divide por 100 para mostrarlo en la unidad monetaria base con dos decimales
   * @param basePrice - Precio base del servicio
   * @returns Precio efectivo formateado como string con dos decimales
   */
  getFormattedPrice(basePrice: number): string {
    return (this.getEffectivePrice(basePrice) / 100).toFixed(2);
  }

  /**
   * Verifica si el estilista tiene un precio personalizado para este servicio
   * @returns true si tiene precio personalizado, false si usa el precio base
   */
  hasCustomPrice(): boolean {
    return this.customPrice !== null;
  }

  /**
   * Convierte la entidad a formato de persistencia para guardar en base de datos
   * @returns Objeto plano con todas las propiedades de la asignación
   */
  toPersistence() {
    return {
      stylistId: this.stylistId,
      serviceId: this.serviceId,
      customPrice: this.customPrice,
      isOffering: this.isOffering,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
