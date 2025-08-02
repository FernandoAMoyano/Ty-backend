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

    it('should create appointment status with static create method', () => {
      const status = AppointmentStatus.create(validStatusData.name, validStatusData.description);

      expect(status.id).toBeDefined();
      expect(status.name).toBe(validStatusData.name);
      expect(status.description).toBe(validStatusData.description);
    });

    it('should create appointment status without description', () => {
      const status = AppointmentStatus.create(validStatusData.name);

      expect(status.id).toBeDefined();
      expect(status.name).toBe(validStatusData.name);
      expect(status.description).toBeUndefined();
    });

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
    it('should throw error for empty name', () => {
      expect(() => {
        new AppointmentStatus(validStatusData.id, '', validStatusData.description);
      }).toThrow('AppointmentStatus name cannot be empty');
    });

    it('should throw error for whitespace-only name', () => {
      expect(() => {
        new AppointmentStatus(validStatusData.id, '   ', validStatusData.description);
      }).toThrow('AppointmentStatus name cannot be empty');
    });

    it('should throw error for name too long', () => {
      const longName = 'A'.repeat(51); // 51 characters

      expect(() => {
        new AppointmentStatus(validStatusData.id, longName, validStatusData.description);
      }).toThrow('AppointmentStatus name is too long (max 50 characters)');
    });

    it('should throw error for description too long', () => {
      const longDescription = 'A'.repeat(201); // 201 characters

      expect(() => {
        new AppointmentStatus(validStatusData.id, validStatusData.name, longDescription);
      }).toThrow('AppointmentStatus description is too long (max 200 characters)');
    });

    it('should accept name with exactly 50 characters', () => {
      const maxLengthName = 'A'.repeat(50);

      expect(() => {
        new AppointmentStatus(validStatusData.id, maxLengthName, validStatusData.description);
      }).not.toThrow();
    });

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
      it('should update status information', () => {
        const newName = 'CONFIRMED';
        const newDescription = 'Appointment has been confirmed';

        status.updateInfo(newName, newDescription);

        expect(status.name).toBe(newName);
        expect(status.description).toBe(newDescription);
      });

      it('should trim whitespace when updating', () => {
        const nameWithSpaces = '  CONFIRMED  ';
        const descriptionWithSpaces = '  Appointment confirmed  ';

        status.updateInfo(nameWithSpaces, descriptionWithSpaces);

        expect(status.name).toBe('CONFIRMED');
        expect(status.description).toBe('Appointment confirmed');
      });

      it('should update without description', () => {
        const newName = 'IN_PROGRESS';

        status.updateInfo(newName);

        expect(status.name).toBe(newName);
        expect(status.description).toBeUndefined();
      });

      it('should validate when updating', () => {
        expect(() => {
          status.updateInfo(''); // Nombre vacío
        }).toThrow('AppointmentStatus name cannot be empty');
      });
    });

    describe('Terminal Status Detection', () => {
      it('should identify COMPLETED as terminal status', () => {
        status.name = AppointmentStatusEnum.COMPLETED;

        expect(status.isTerminalStatus()).toBe(true);
      });

      it('should identify CANCELLED as terminal status', () => {
        status.name = AppointmentStatusEnum.CANCELLED;

        expect(status.isTerminalStatus()).toBe(true);
      });

      it('should identify NO_SHOW as terminal status', () => {
        status.name = AppointmentStatusEnum.NO_SHOW;

        expect(status.isTerminalStatus()).toBe(true);
      });

      it('should not identify PENDING as terminal status', () => {
        status.name = AppointmentStatusEnum.PENDING;

        expect(status.isTerminalStatus()).toBe(false);
      });

      it('should not identify CONFIRMED as terminal status', () => {
        status.name = AppointmentStatusEnum.CONFIRMED;

        expect(status.isTerminalStatus()).toBe(false);
      });

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

        it('should allow transition to CONFIRMED', () => {
          expect(status.canTransitionTo(AppointmentStatusEnum.CONFIRMED)).toBe(true);
        });

        it('should allow transition to CANCELLED', () => {
          expect(status.canTransitionTo(AppointmentStatusEnum.CANCELLED)).toBe(true);
        });

        it('should not allow transition to IN_PROGRESS', () => {
          expect(status.canTransitionTo(AppointmentStatusEnum.IN_PROGRESS)).toBe(false);
        });

        it('should not allow transition to COMPLETED', () => {
          expect(status.canTransitionTo(AppointmentStatusEnum.COMPLETED)).toBe(false);
        });

        it('should not allow transition to NO_SHOW', () => {
          expect(status.canTransitionTo(AppointmentStatusEnum.NO_SHOW)).toBe(false);
        });
      });

      describe('From CONFIRMED', () => {
        beforeEach(() => {
          status.name = AppointmentStatusEnum.CONFIRMED;
        });

        it('should allow transition to IN_PROGRESS', () => {
          expect(status.canTransitionTo(AppointmentStatusEnum.IN_PROGRESS)).toBe(true);
        });

        it('should allow transition to CANCELLED', () => {
          expect(status.canTransitionTo(AppointmentStatusEnum.CANCELLED)).toBe(true);
        });

        it('should allow transition to NO_SHOW', () => {
          expect(status.canTransitionTo(AppointmentStatusEnum.NO_SHOW)).toBe(true);
        });

        it('should not allow transition to PENDING', () => {
          expect(status.canTransitionTo(AppointmentStatusEnum.PENDING)).toBe(false);
        });

        it('should not allow transition to COMPLETED', () => {
          expect(status.canTransitionTo(AppointmentStatusEnum.COMPLETED)).toBe(false);
        });
      });

      describe('From IN_PROGRESS', () => {
        beforeEach(() => {
          status.name = AppointmentStatusEnum.IN_PROGRESS;
        });

        it('should allow transition to COMPLETED', () => {
          expect(status.canTransitionTo(AppointmentStatusEnum.COMPLETED)).toBe(true);
        });

        it('should allow transition to CANCELLED', () => {
          expect(status.canTransitionTo(AppointmentStatusEnum.CANCELLED)).toBe(true);
        });

        it('should not allow transition to PENDING', () => {
          expect(status.canTransitionTo(AppointmentStatusEnum.PENDING)).toBe(false);
        });

        it('should not allow transition to CONFIRMED', () => {
          expect(status.canTransitionTo(AppointmentStatusEnum.CONFIRMED)).toBe(false);
        });

        it('should not allow transition to NO_SHOW', () => {
          expect(status.canTransitionTo(AppointmentStatusEnum.NO_SHOW)).toBe(false);
        });
      });

      describe('From Terminal States', () => {
        it('should not allow any transition from COMPLETED', () => {
          status.name = AppointmentStatusEnum.COMPLETED;

          expect(status.canTransitionTo(AppointmentStatusEnum.PENDING)).toBe(false);
          expect(status.canTransitionTo(AppointmentStatusEnum.CONFIRMED)).toBe(false);
          expect(status.canTransitionTo(AppointmentStatusEnum.IN_PROGRESS)).toBe(false);
          expect(status.canTransitionTo(AppointmentStatusEnum.CANCELLED)).toBe(false);
          expect(status.canTransitionTo(AppointmentStatusEnum.NO_SHOW)).toBe(false);
        });

        it('should not allow any transition from CANCELLED', () => {
          status.name = AppointmentStatusEnum.CANCELLED;

          expect(status.canTransitionTo(AppointmentStatusEnum.PENDING)).toBe(false);
          expect(status.canTransitionTo(AppointmentStatusEnum.CONFIRMED)).toBe(false);
          expect(status.canTransitionTo(AppointmentStatusEnum.IN_PROGRESS)).toBe(false);
          expect(status.canTransitionTo(AppointmentStatusEnum.COMPLETED)).toBe(false);
          expect(status.canTransitionTo(AppointmentStatusEnum.NO_SHOW)).toBe(false);
        });

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
        it('should return false for unknown status', () => {
          status.name = AppointmentStatusEnum.PENDING;

          expect(status.canTransitionTo('UNKNOWN_STATUS')).toBe(false);
        });

        it('should handle undefined transitions gracefully', () => {
          status.name = 'CUSTOM_STATUS' as AppointmentStatusEnum;

          expect(status.canTransitionTo(AppointmentStatusEnum.CONFIRMED)).toBe(false);
        });
      });
    });

    describe('Persistence Conversion', () => {
      it('should convert to persistence format', () => {
        const persistenceData = status.toPersistence();

        expect(persistenceData).toEqual({
          id: status.id,
          name: status.name,
          description: status.description,
        });
      });

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
    it('should have all expected status values', () => {
      expect(AppointmentStatusEnum.PENDING).toBe('PENDING');
      expect(AppointmentStatusEnum.CONFIRMED).toBe('CONFIRMED');
      expect(AppointmentStatusEnum.IN_PROGRESS).toBe('IN_PROGRESS');
      expect(AppointmentStatusEnum.COMPLETED).toBe('COMPLETED');
      expect(AppointmentStatusEnum.CANCELLED).toBe('CANCELLED');
      expect(AppointmentStatusEnum.NO_SHOW).toBe('NO_SHOW');
    });

    it('should have exactly 6 status values', () => {
      const statusValues = Object.values(AppointmentStatusEnum);
      expect(statusValues).toHaveLength(6);
    });
  });
});
