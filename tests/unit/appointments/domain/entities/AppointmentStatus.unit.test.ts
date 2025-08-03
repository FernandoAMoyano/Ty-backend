import {
  AppointmentStatus,
  AppointmentStatusEnum,
} from '../../../../../src/modules/appointments/domain/entities/AppointmentStatus';
import { generateUuid } from '../../../../../src/shared/utils/uuid';

describe('AppointmentStatus Entity', () => {
  const validStatusData = {
    id: generateUuid(),
    name: 'PENDING',
    description: 'Appointment is pending confirmation',
  };

  describe('AppointmentStatus Creation', () => {
    // Debería crear estado de cita con datos válidos
    it('should create appointment status with valid data', () => {
      const status = new AppointmentStatus(
        validStatusData.id,
        validStatusData.name,
        validStatusData.description,
      );

      expect(status.id).toBe(validStatusData.id);
      expect(status.name).toBe(validStatusData.name);
      expect(status.description).toBe(validStatusData.description);
    });

    // Debería crear estado de cita con método estático create
    it('should create appointment status with static create method', () => {
      const status = AppointmentStatus.create(validStatusData.name, validStatusData.description);

      expect(status.id).toBeDefined();
      expect(status.name).toBe(validStatusData.name);
      expect(status.description).toBe(validStatusData.description);
    });

    // Debería crear estado de cita sin descripción
    it('should create appointment status without description', () => {
      const status = AppointmentStatus.create(validStatusData.name);

      expect(status.id).toBeDefined();
      expect(status.name).toBe(validStatusData.name);
      expect(status.description).toBeUndefined();
    });

    // Debería crear estado de cita desde datos de persistencia
    it('should create appointment status from persistence data', () => {
      const status = AppointmentStatus.fromPersistence(
        validStatusData.id,
        validStatusData.name,
        validStatusData.description,
      );

      expect(status.id).toBe(validStatusData.id);
      expect(status.name).toBe(validStatusData.name);
      expect(status.description).toBe(validStatusData.description);
    });
  });

  describe('AppointmentStatus Validation', () => {
    // Debería lanzar error para nombre vacío
    it('should throw error for empty name', () => {
      expect(() => {
        new AppointmentStatus(validStatusData.id, '', validStatusData.description);
      }).toThrow('AppointmentStatus name cannot be empty');
    });

    // Debería lanzar error para nombre solo con espacios
    it('should throw error for whitespace-only name', () => {
      expect(() => {
        new AppointmentStatus(validStatusData.id, '   ', validStatusData.description);
      }).toThrow('AppointmentStatus name cannot be empty');
    });

    // Debería lanzar error para nombre demasiado largo
    it('should throw error for name too long', () => {
      const longName = 'A'.repeat(51); // 51 caracteres

      expect(() => {
        new AppointmentStatus(validStatusData.id, longName, validStatusData.description);
      }).toThrow('AppointmentStatus name is too long (max 50 characters)');
    });

    // Debería lanzar error para descripción demasiado larga
    it('should throw error for description too long', () => {
      const longDescription = 'A'.repeat(201); // 201 caracteres

      expect(() => {
        new AppointmentStatus(validStatusData.id, validStatusData.name, longDescription);
      }).toThrow('AppointmentStatus description is too long (max 200 characters)');
    });

    // Debería aceptar nombre con exactamente 50 caracteres
    it('should accept name with exactly 50 characters', () => {
      const maxLengthName = 'A'.repeat(50);

      expect(() => {
        new AppointmentStatus(validStatusData.id, maxLengthName, validStatusData.description);
      }).not.toThrow();
    });

    // Debería aceptar descripción con exactamente 200 caracteres
    it('should accept description with exactly 200 characters', () => {
      const maxLengthDescription = 'A'.repeat(200);

      expect(() => {
        new AppointmentStatus(validStatusData.id, validStatusData.name, maxLengthDescription);
      }).not.toThrow();
    });
  });

  describe('AppointmentStatus Business Logic', () => {
    let status: AppointmentStatus;

    beforeEach(() => {
      status = new AppointmentStatus(
        validStatusData.id,
        validStatusData.name,
        validStatusData.description,
      );
    });

    describe('Information Update', () => {
      // Debería actualizar información del estado
      it('should update status information', () => {
        const newName = 'CONFIRMED';
        const newDescription = 'Appointment has been confirmed';

        status.updateInfo(newName, newDescription);

        expect(status.name).toBe(newName);
        expect(status.description).toBe(newDescription);
      });

      // Debería eliminar espacios al actualizar
      it('should trim whitespace when updating', () => {
        const nameWithSpaces = '  CONFIRMED  ';
        const descriptionWithSpaces = '  Appointment confirmed  ';

        status.updateInfo(nameWithSpaces, descriptionWithSpaces);

        expect(status.name).toBe('CONFIRMED');
        expect(status.description).toBe('Appointment confirmed');
      });

      // Debería actualizar sin descripción
      it('should update without description', () => {
        const newName = 'IN_PROGRESS';

        status.updateInfo(newName);

        expect(status.name).toBe(newName);
        expect(status.description).toBeUndefined();
      });

      // Debería validar al actualizar
      it('should validate when updating', () => {
        expect(() => {
          status.updateInfo(''); // Nombre vacío
        }).toThrow('AppointmentStatus name cannot be empty');
      });
    });

    describe('Terminal Status Detection', () => {
      // Debería identificar COMPLETED como estado terminal
      it('should identify COMPLETED as terminal status', () => {
        status.name = AppointmentStatusEnum.COMPLETED;

        expect(status.isTerminalStatus()).toBe(true);
      });

      // Debería identificar CANCELLED como estado terminal
      it('should identify CANCELLED as terminal status', () => {
        status.name = AppointmentStatusEnum.CANCELLED;

        expect(status.isTerminalStatus()).toBe(true);
      });

      // Debería identificar NO_SHOW como estado terminal
      it('should identify NO_SHOW as terminal status', () => {
        status.name = AppointmentStatusEnum.NO_SHOW;

        expect(status.isTerminalStatus()).toBe(true);
      });

      // No debería identificar PENDING como estado terminal
      it('should not identify PENDING as terminal status', () => {
        status.name = AppointmentStatusEnum.PENDING;

        expect(status.isTerminalStatus()).toBe(false);
      });

      // No debería identificar CONFIRMED como estado terminal
      it('should not identify CONFIRMED as terminal status', () => {
        status.name = AppointmentStatusEnum.CONFIRMED;

        expect(status.isTerminalStatus()).toBe(false);
      });

      // No debería identificar IN_PROGRESS como estado terminal
      it('should not identify IN_PROGRESS as terminal status', () => {
        status.name = AppointmentStatusEnum.IN_PROGRESS;

        expect(status.isTerminalStatus()).toBe(false);
      });
    });

    describe('Status Transitions', () => {
      describe('From PENDING', () => {
        beforeEach(() => {
          status.name = AppointmentStatusEnum.PENDING;
        });

        // Debería permitir transición a CONFIRMED
        it('should allow transition to CONFIRMED', () => {
          expect(status.canTransitionTo(AppointmentStatusEnum.CONFIRMED)).toBe(true);
        });

        // Debería permitir transición a CANCELLED
        it('should allow transition to CANCELLED', () => {
          expect(status.canTransitionTo(AppointmentStatusEnum.CANCELLED)).toBe(true);
        });

        // No debería permitir transición a IN_PROGRESS
        it('should not allow transition to IN_PROGRESS', () => {
          expect(status.canTransitionTo(AppointmentStatusEnum.IN_PROGRESS)).toBe(false);
        });

        // No debería permitir transición a COMPLETED
        it('should not allow transition to COMPLETED', () => {
          expect(status.canTransitionTo(AppointmentStatusEnum.COMPLETED)).toBe(false);
        });

        // No debería permitir transición a NO_SHOW
        it('should not allow transition to NO_SHOW', () => {
          expect(status.canTransitionTo(AppointmentStatusEnum.NO_SHOW)).toBe(false);
        });
      });

      describe('From CONFIRMED', () => {
        beforeEach(() => {
          status.name = AppointmentStatusEnum.CONFIRMED;
        });

        // Debería permitir transición a IN_PROGRESS
        it('should allow transition to IN_PROGRESS', () => {
          expect(status.canTransitionTo(AppointmentStatusEnum.IN_PROGRESS)).toBe(true);
        });

        // Debería permitir transición a CANCELLED
        it('should allow transition to CANCELLED', () => {
          expect(status.canTransitionTo(AppointmentStatusEnum.CANCELLED)).toBe(true);
        });

        // Debería permitir transición a NO_SHOW
        it('should allow transition to NO_SHOW', () => {
          expect(status.canTransitionTo(AppointmentStatusEnum.NO_SHOW)).toBe(true);
        });

        // No debería permitir transición a PENDING
        it('should not allow transition to PENDING', () => {
          expect(status.canTransitionTo(AppointmentStatusEnum.PENDING)).toBe(false);
        });

        // No debería permitir transición a COMPLETED
        it('should not allow transition to COMPLETED', () => {
          expect(status.canTransitionTo(AppointmentStatusEnum.COMPLETED)).toBe(false);
        });
      });

      describe('From IN_PROGRESS', () => {
        beforeEach(() => {
          status.name = AppointmentStatusEnum.IN_PROGRESS;
        });

        // Debería permitir transición a COMPLETED
        it('should allow transition to COMPLETED', () => {
          expect(status.canTransitionTo(AppointmentStatusEnum.COMPLETED)).toBe(true);
        });

        // Debería permitir transición a CANCELLED
        it('should allow transition to CANCELLED', () => {
          expect(status.canTransitionTo(AppointmentStatusEnum.CANCELLED)).toBe(true);
        });

        // No debería permitir transición a PENDING
        it('should not allow transition to PENDING', () => {
          expect(status.canTransitionTo(AppointmentStatusEnum.PENDING)).toBe(false);
        });

        // No debería permitir transición a CONFIRMED
        it('should not allow transition to CONFIRMED', () => {
          expect(status.canTransitionTo(AppointmentStatusEnum.CONFIRMED)).toBe(false);
        });

        // No debería permitir transición a NO_SHOW
        it('should not allow transition to NO_SHOW', () => {
          expect(status.canTransitionTo(AppointmentStatusEnum.NO_SHOW)).toBe(false);
        });
      });

      describe('From Terminal States', () => {
        // No debería permitir ninguna transición desde COMPLETED
        it('should not allow any transition from COMPLETED', () => {
          status.name = AppointmentStatusEnum.COMPLETED;

          expect(status.canTransitionTo(AppointmentStatusEnum.PENDING)).toBe(false);
          expect(status.canTransitionTo(AppointmentStatusEnum.CONFIRMED)).toBe(false);
          expect(status.canTransitionTo(AppointmentStatusEnum.IN_PROGRESS)).toBe(false);
          expect(status.canTransitionTo(AppointmentStatusEnum.CANCELLED)).toBe(false);
          expect(status.canTransitionTo(AppointmentStatusEnum.NO_SHOW)).toBe(false);
        });

        // No debería permitir ninguna transición desde CANCELLED
        it('should not allow any transition from CANCELLED', () => {
          status.name = AppointmentStatusEnum.CANCELLED;

          expect(status.canTransitionTo(AppointmentStatusEnum.PENDING)).toBe(false);
          expect(status.canTransitionTo(AppointmentStatusEnum.CONFIRMED)).toBe(false);
          expect(status.canTransitionTo(AppointmentStatusEnum.IN_PROGRESS)).toBe(false);
          expect(status.canTransitionTo(AppointmentStatusEnum.COMPLETED)).toBe(false);
          expect(status.canTransitionTo(AppointmentStatusEnum.NO_SHOW)).toBe(false);
        });

        // No debería permitir ninguna transición desde NO_SHOW
        it('should not allow any transition from NO_SHOW', () => {
          status.name = AppointmentStatusEnum.NO_SHOW;

          expect(status.canTransitionTo(AppointmentStatusEnum.PENDING)).toBe(false);
          expect(status.canTransitionTo(AppointmentStatusEnum.CONFIRMED)).toBe(false);
          expect(status.canTransitionTo(AppointmentStatusEnum.IN_PROGRESS)).toBe(false);
          expect(status.canTransitionTo(AppointmentStatusEnum.COMPLETED)).toBe(false);
          expect(status.canTransitionTo(AppointmentStatusEnum.CANCELLED)).toBe(false);
        });
      });

      describe('Invalid Transitions', () => {
        // Debería retornar false para estado desconocido
        it('should return false for unknown status', () => {
          status.name = AppointmentStatusEnum.PENDING;

          expect(status.canTransitionTo('UNKNOWN_STATUS')).toBe(false);
        });

        // Debería manejar transiciones undefined de manera elegante
        it('should handle undefined transitions gracefully', () => {
          status.name = 'CUSTOM_STATUS' as AppointmentStatusEnum;

          expect(status.canTransitionTo(AppointmentStatusEnum.CONFIRMED)).toBe(false);
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
        const statusWithoutDescription = new AppointmentStatus(
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

  describe('AppointmentStatusEnum', () => {
    // Debería tener todos los valores de estado esperados
    it('should have all expected status values', () => {
      expect(AppointmentStatusEnum.PENDING).toBe('PENDING');
      expect(AppointmentStatusEnum.CONFIRMED).toBe('CONFIRMED');
      expect(AppointmentStatusEnum.IN_PROGRESS).toBe('IN_PROGRESS');
      expect(AppointmentStatusEnum.COMPLETED).toBe('COMPLETED');
      expect(AppointmentStatusEnum.CANCELLED).toBe('CANCELLED');
      expect(AppointmentStatusEnum.NO_SHOW).toBe('NO_SHOW');
    });

    // Debería tener exactamente 6 valores de estado
    it('should have exactly 6 status values', () => {
      const statusValues = Object.values(AppointmentStatusEnum);
      expect(statusValues).toHaveLength(6);
    });
  });
});
