import { StylistService } from '../../../src/modules/services/domain/entities/StylistService';
import { ValidationError } from '../../../src/shared/exceptions/ValidationError';

describe('StylistService Entity', () => {
  const validData = {
    stylistId: 'stylist-id',
    serviceId: 'service-id',
    customPrice: 3000, // $30.00 en centavos
  };

  describe('Creation', () => {
    // Debería crear servicio de estilista con datos válidos
    it('should create stylist service with valid data', () => {
      const stylistService = StylistService.create(
        validData.stylistId,
        validData.serviceId,
        validData.customPrice,
      );

      expect(stylistService.stylistId).toBe(validData.stylistId);
      expect(stylistService.serviceId).toBe(validData.serviceId);
      expect(stylistService.customPrice).toBe(validData.customPrice);
      expect(stylistService.isOffering).toBe(true);
      expect(stylistService.createdAt).toBeInstanceOf(Date);
      expect(stylistService.updatedAt).toBeInstanceOf(Date);
    });

    // Debería crear servicio de estilista sin precio personalizado
    it('should create stylist service without custom price', () => {
      const stylistService = StylistService.create(validData.stylistId, validData.serviceId);

      expect(stylistService.customPrice).toBeUndefined();
      expect(stylistService.isOffering).toBe(true);
    });

    // Debería lanzar error si el ID del estilista está vacío
    it('should throw error if stylist ID is empty', () => {
      expect(() => {
        StylistService.create('', validData.serviceId);
      }).toThrow(ValidationError);
    });

    // Debería lanzar error si el ID del servicio está vacío
    it('should throw error if service ID is empty', () => {
      expect(() => {
        StylistService.create(validData.stylistId, '');
      }).toThrow(ValidationError);
    });

    // Debería lanzar error si el precio personalizado es negativo
    it('should throw error if custom price is negative', () => {
      expect(() => {
        StylistService.create(
          validData.stylistId,
          validData.serviceId,
          -100, // precio negativo
        );
      }).toThrow(ValidationError);
    });
  });

  describe('Price management', () => {
    let stylistService: StylistService;

    beforeEach(() => {
      stylistService = StylistService.create(
        validData.stylistId,
        validData.serviceId,
        validData.customPrice,
      );
    });

    // Debería actualizar precio personalizado
    it('should update custom price', () => {
      stylistService.updatePrice(3500);
      expect(stylistService.customPrice).toBe(3500);
    });

    // Debería remover precio personalizado
    it('should remove custom price', () => {
      stylistService.updatePrice(undefined);
      expect(stylistService.customPrice).toBeUndefined();
    });

    // Debería lanzar error al actualizar a precio negativo
    it('should throw error when updating to negative price', () => {
      expect(() => {
        stylistService.updatePrice(-100);
      }).toThrow(ValidationError);
    });

    // Debería obtener precio efectivo con precio personalizado
    it('should get effective price with custom price', () => {
      const basePrice = 2500;
      expect(stylistService.getEffectivePrice(basePrice)).toBe(validData.customPrice);
    });

    // Debería obtener precio efectivo sin precio personalizado
    it('should get effective price without custom price', () => {
      stylistService.updatePrice(undefined);
      const basePrice = 2500;
      expect(stylistService.getEffectivePrice(basePrice)).toBe(basePrice);
    });

    // Debería formatear el precio correctamente
    it('should format price correctly', () => {
      const basePrice = 2500;
      expect(stylistService.getFormattedPrice(basePrice)).toBe('30.00');
    });

    // Debería verificar si tiene precio personalizado
    it('should check if has custom price', () => {
      expect(stylistService.hasCustomPrice()).toBe(true);

      stylistService.updatePrice(undefined);
      expect(stylistService.hasCustomPrice()).toBe(false);
    });
  });

  describe('Offering management', () => {
    let stylistService: StylistService;

    beforeEach(() => {
      stylistService = StylistService.create(validData.stylistId, validData.serviceId);
    });

    // Debería empezar a ofrecer
    it('should start offering', () => {
      stylistService.stopOffering();
      expect(stylistService.isOffering).toBe(false);

      stylistService.startOffering();
      expect(stylistService.isOffering).toBe(true);
    });

    // Debería dejar de ofrecer
    it('should stop offering', () => {
      expect(stylistService.isOffering).toBe(true);

      stylistService.stopOffering();
      expect(stylistService.isOffering).toBe(false);
    });
  });
});
