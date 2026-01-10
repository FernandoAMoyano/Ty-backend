import {
  NotificationStatus,
  NotificationStatusEnum,
} from '../../../../../src/modules/notifications/domain/entities/NotificationStatus';
import { generateUuid } from '../../../../../src/shared/utils/uuid';

describe('NotificationStatus Entity', () => {
  const validStatusData = {
    id: generateUuid(),
    name: 'PENDING',
    description: 'Notificación pendiente de envío',
  };

  describe('NotificationStatus Creation', () => {
    // Debería crear estado de notificación con datos válidos
    it('should create notification status with valid data', () => {
      const status = new NotificationStatus(
        validStatusData.id,
        validStatusData.name,
        validStatusData.description,
      );

      expect(status.id).toBe(validStatusData.id);
      expect(status.name).toBe(validStatusData.name);
      expect(status.description).toBe(validStatusData.description);
    });

    // Debería crear estado de notificación con método estático create
    it('should create notification status with static create method', () => {
      const status = NotificationStatus.create(validStatusData.name, validStatusData.description);

      expect(status.id).toBeDefined();
      expect(status.name).toBe(validStatusData.name);
      expect(status.description).toBe(validStatusData.description);
    });

    // Debería crear estado de notificación sin descripción
    it('should create notification status without description', () => {
      const status = NotificationStatus.create(validStatusData.name);

      expect(status.id).toBeDefined();
      expect(status.name).toBe(validStatusData.name);
      expect(status.description).toBeUndefined();
    });

    // Debería crear estado de notificación desde datos de persistencia
    it('should create notification status from persistence data', () => {
      const status = NotificationStatus.fromPersistence(
        validStatusData.id,
        validStatusData.name,
        validStatusData.description,
      );

      expect(status.id).toBe(validStatusData.id);
      expect(status.name).toBe(validStatusData.name);
      expect(status.description).toBe(validStatusData.description);
    });
  });

  describe('NotificationStatus Validation', () => {
    // Debería lanzar error para nombre vacío
    it('should throw error for empty name', () => {
      expect(() => {
        new NotificationStatus(validStatusData.id, '', validStatusData.description);
      }).toThrow('NotificationStatus name cannot be empty');
    });

    // Debería lanzar error para nombre solo con espacios
    it('should throw error for whitespace-only name', () => {
      expect(() => {
        new NotificationStatus(validStatusData.id, '   ', validStatusData.description);
      }).toThrow('NotificationStatus name cannot be empty');
    });

    // Debería lanzar error para nombre demasiado largo
    it('should throw error for name too long', () => {
      const longName = 'A'.repeat(51);

      expect(() => {
        new NotificationStatus(validStatusData.id, longName, validStatusData.description);
      }).toThrow('NotificationStatus name is too long (max 50 characters)');
    });

    // Debería lanzar error para descripción demasiado larga
    it('should throw error for description too long', () => {
      const longDescription = 'A'.repeat(201);

      expect(() => {
        new NotificationStatus(validStatusData.id, validStatusData.name, longDescription);
      }).toThrow('NotificationStatus description is too long (max 200 characters)');
    });

    // Debería aceptar nombre con exactamente 50 caracteres
    it('should accept name with exactly 50 characters', () => {
      const maxLengthName = 'A'.repeat(50);

      expect(() => {
        new NotificationStatus(validStatusData.id, maxLengthName, validStatusData.description);
      }).not.toThrow();
    });

    // Debería aceptar descripción con exactamente 200 caracteres
    it('should accept description with exactly 200 characters', () => {
      const maxLengthDescription = 'A'.repeat(200);

      expect(() => {
        new NotificationStatus(validStatusData.id, validStatusData.name, maxLengthDescription);
      }).not.toThrow();
    });
  });

  describe('NotificationStatus Business Logic', () => {
    let status: NotificationStatus;

    beforeEach(() => {
      status = new NotificationStatus(
        validStatusData.id,
        validStatusData.name,
        validStatusData.description,
      );
    });

    describe('Information Update', () => {
      // Debería actualizar información del estado
      it('should update status information', () => {
        const newName = 'SENT';
        const newDescription = 'Notificación enviada exitosamente';

        status.updateInfo(newName, newDescription);

        expect(status.name).toBe(newName);
        expect(status.description).toBe(newDescription);
      });

      // Debería eliminar espacios al actualizar
      it('should trim whitespace when updating', () => {
        const nameWithSpaces = '  SENT  ';
        const descriptionWithSpaces = '  Notificación enviada  ';

        status.updateInfo(nameWithSpaces, descriptionWithSpaces);

        expect(status.name).toBe('SENT');
        expect(status.description).toBe('Notificación enviada');
      });

      // Debería actualizar sin descripción
      it('should update without description', () => {
        const newName = 'READ';

        status.updateInfo(newName);

        expect(status.name).toBe(newName);
        expect(status.description).toBeUndefined();
      });

      // Debería validar al actualizar
      it('should validate when updating', () => {
        expect(() => {
          status.updateInfo('');
        }).toThrow('NotificationStatus name cannot be empty');
      });
    });

    describe('Terminal Status Detection', () => {
      // Debería identificar READ como estado terminal
      it('should identify READ as terminal status', () => {
        status.name = NotificationStatusEnum.READ;

        expect(status.isTerminalStatus()).toBe(true);
      });

      // Debería identificar FAILED como estado terminal
      it('should identify FAILED as terminal status', () => {
        status.name = NotificationStatusEnum.FAILED;

        expect(status.isTerminalStatus()).toBe(true);
      });

      // No debería identificar PENDING como estado terminal
      it('should not identify PENDING as terminal status', () => {
        status.name = NotificationStatusEnum.PENDING;

        expect(status.isTerminalStatus()).toBe(false);
      });

      // No debería identificar SENT como estado terminal
      it('should not identify SENT as terminal status', () => {
        status.name = NotificationStatusEnum.SENT;

        expect(status.isTerminalStatus()).toBe(false);
      });
    });

    describe('Status Transitions', () => {
      describe('From PENDING', () => {
        beforeEach(() => {
          status.name = NotificationStatusEnum.PENDING;
        });

        // Debería permitir transición a SENT
        it('should allow transition to SENT', () => {
          expect(status.canTransitionTo(NotificationStatusEnum.SENT)).toBe(true);
        });

        // Debería permitir transición a FAILED
        it('should allow transition to FAILED', () => {
          expect(status.canTransitionTo(NotificationStatusEnum.FAILED)).toBe(true);
        });

        // No debería permitir transición a READ
        it('should not allow transition to READ', () => {
          expect(status.canTransitionTo(NotificationStatusEnum.READ)).toBe(false);
        });
      });

      describe('From SENT', () => {
        beforeEach(() => {
          status.name = NotificationStatusEnum.SENT;
        });

        // Debería permitir transición a READ
        it('should allow transition to READ', () => {
          expect(status.canTransitionTo(NotificationStatusEnum.READ)).toBe(true);
        });

        // No debería permitir transición a PENDING
        it('should not allow transition to PENDING', () => {
          expect(status.canTransitionTo(NotificationStatusEnum.PENDING)).toBe(false);
        });

        // No debería permitir transición a FAILED
        it('should not allow transition to FAILED', () => {
          expect(status.canTransitionTo(NotificationStatusEnum.FAILED)).toBe(false);
        });
      });

      describe('From FAILED', () => {
        beforeEach(() => {
          status.name = NotificationStatusEnum.FAILED;
        });

        // Debería permitir transición a PENDING (reintento)
        it('should allow transition to PENDING (retry)', () => {
          expect(status.canTransitionTo(NotificationStatusEnum.PENDING)).toBe(true);
        });

        // No debería permitir transición a SENT
        it('should not allow transition to SENT', () => {
          expect(status.canTransitionTo(NotificationStatusEnum.SENT)).toBe(false);
        });

        // No debería permitir transición a READ
        it('should not allow transition to READ', () => {
          expect(status.canTransitionTo(NotificationStatusEnum.READ)).toBe(false);
        });
      });

      describe('From READ (Terminal)', () => {
        beforeEach(() => {
          status.name = NotificationStatusEnum.READ;
        });

        // No debería permitir ninguna transición desde READ
        it('should not allow any transition from READ', () => {
          expect(status.canTransitionTo(NotificationStatusEnum.PENDING)).toBe(false);
          expect(status.canTransitionTo(NotificationStatusEnum.SENT)).toBe(false);
          expect(status.canTransitionTo(NotificationStatusEnum.FAILED)).toBe(false);
        });
      });

      describe('Invalid Transitions', () => {
        // Debería retornar false para estado desconocido
        it('should return false for unknown status', () => {
          status.name = NotificationStatusEnum.PENDING;

          expect(status.canTransitionTo('UNKNOWN_STATUS')).toBe(false);
        });
      });
    });

    describe('Persistence Conversion', () => {
      // Debería convertir a formato de persistencia
      it('should convert to persistence format', () => {
        const persistenceData = status.toPersistence();

        expect(persistenceData).toEqual({
          id: status.id,
          name: status.name,
          description: status.description,
        });
      });

      // Debería convertir a formato de persistencia sin descripción
      it('should convert to persistence format without description', () => {
        const statusWithoutDescription = new NotificationStatus(
          validStatusData.id,
          validStatusData.name,
        );

        const persistenceData = statusWithoutDescription.toPersistence();

        expect(persistenceData).toEqual({
          id: statusWithoutDescription.id,
          name: statusWithoutDescription.name,
          description: undefined,
        });
      });
    });
  });

  describe('NotificationStatusEnum', () => {
    // Debería tener todos los valores de estado esperados
    it('should have all expected status values', () => {
      expect(NotificationStatusEnum.PENDING).toBe('PENDING');
      expect(NotificationStatusEnum.SENT).toBe('SENT');
      expect(NotificationStatusEnum.READ).toBe('READ');
      expect(NotificationStatusEnum.FAILED).toBe('FAILED');
    });

    // Debería tener exactamente 4 valores de estado
    it('should have exactly 4 status values', () => {
      const statusValues = Object.values(NotificationStatusEnum);
      expect(statusValues).toHaveLength(4);
    });
  });
});
