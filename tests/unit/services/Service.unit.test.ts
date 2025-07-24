import { Service } from '../../../src/modules/services/domain/entities/Service';
import { ValidationError } from '../../../src/shared/exceptions/ValidationError';

describe('Service Entity', () => {
  const validServiceData = {
    categoryId: 'category-id',
    name: 'Hair Cut',
    description: 'Professional hair cutting service',
    duration: 30,
    durationVariation: 15,
    price: 2500, // en centavos
  };

  describe('Creation', () => {
    // Debería crear un servicio con datos válidos
    it('should create a service with valid data', () => {
      const service = Service.create(
        validServiceData.categoryId,
        validServiceData.name,
        validServiceData.description,
        validServiceData.duration,
        validServiceData.durationVariation,
        validServiceData.price,
      );

      expect(service.id).toBeDefined();
      expect(service.categoryId).toBe(validServiceData.categoryId);
      expect(service.name).toBe(validServiceData.name);
      expect(service.description).toBe(validServiceData.description);
      expect(service.duration).toBe(validServiceData.duration);
      expect(service.durationVariation).toBe(validServiceData.durationVariation);
      expect(service.price).toBe(validServiceData.price);
      expect(service.isActive).toBe(true);
    });

    // Debería lanzar error si el nombre está vacío
    it('should throw error if name is empty', () => {
      expect(() => {
        Service.create(
          validServiceData.categoryId,
          '',
          validServiceData.description,
          validServiceData.duration,
          validServiceData.durationVariation,
          validServiceData.price,
        );
      }).toThrow(ValidationError);
    });

    // Debería lanzar error si la duración es inválida
    it('should throw error if duration is invalid', () => {
      expect(() => {
        Service.create(
          validServiceData.categoryId,
          validServiceData.name,
          validServiceData.description,
          0, // duracion invalida
          validServiceData.durationVariation,
          validServiceData.price,
        );
      }).toThrow(ValidationError);
    });

    // Debería lanzar error si la variación de duración excede la duración
    it('should throw error if duration variation exceeds duration', () => {
      expect(() => {
        Service.create(
          validServiceData.categoryId,
          validServiceData.name,
          validServiceData.description,
          30,
          45, // Variacion > duración
          validServiceData.price,
        );
      }).toThrow(ValidationError);
    });

    // Debería lanzar error si el precio es negativo
    it('should throw error if price is negative', () => {
      expect(() => {
        Service.create(
          validServiceData.categoryId,
          validServiceData.name,
          validServiceData.description,
          validServiceData.duration,
          validServiceData.durationVariation,
          -100, // precio negativo
        );
      }).toThrow(ValidationError);
    });
  });

  describe('Duration calculations', () => {
    let service: Service;

    beforeEach(() => {
      service = Service.create(
        validServiceData.categoryId,
        validServiceData.name,
        validServiceData.description,
        60, // 60 minutos
        15, // ±15 minutos variación
        validServiceData.price,
      );
    });

    // Debería calcular la duración mínima correctamente
    it('should calculate minimum duration correctly', () => {
      expect(service.calculateMinDuration()).toBe(45); // 60 - 15
    });

    // Debería calcular la duración máxima correctamente
    it('should calculate maximum duration correctly', () => {
      expect(service.calculateMaxDuration()).toBe(75); // 60 + 15
    });

    // No debería devolver duración mínima negativa
    it('should not return negative minimum duration', () => {
      const shortService = Service.create(
        validServiceData.categoryId,
        validServiceData.name,
        validServiceData.description,
        15, // 15 minutos (igual a la variación)
        15, // ±15 minutos variación
        validServiceData.price,
      );

      expect(shortService.calculateMinDuration()).toBe(0); // Max(0, 15-15)
    });
  });

  describe('Price formatting', () => {
    // Debería formatear el precio correctamente
    it('should format price correctly', () => {
      const service = Service.create(
        validServiceData.categoryId,
        validServiceData.name,
        validServiceData.description,
        validServiceData.duration,
        validServiceData.durationVariation,
        2550, // $25.50 en centavos
      );

      expect(service.getFormattedPrice()).toBe('25.50');
    });
  });

  describe('Status management', () => {
    let service: Service;

    beforeEach(() => {
      service = Service.create(
        validServiceData.categoryId,
        validServiceData.name,
        validServiceData.description,
        validServiceData.duration,
        validServiceData.durationVariation,
        validServiceData.price,
      );
    });

    // Debería activar servicio
    it('should activate service', () => {
      service.deactivate();
      expect(service.isActive).toBe(false);

      service.activate();
      expect(service.isActive).toBe(true);
    });

    // Debería desactivar servicio
    it('should deactivate service', () => {
      expect(service.isActive).toBe(true);

      service.deactivate();
      expect(service.isActive).toBe(false);
    });
  });
});
