import {
  Notification,
  NotificationTypeEnum,
} from '../../../../../src/modules/notifications/domain/entities/Notification';
import { generateUuid } from '../../../../../src/shared/utils/uuid';

describe('Notification Entity', () => {
  const validNotificationData = {
    id: generateUuid(),
    type: NotificationTypeEnum.APPOINTMENT_CONFIRMATION,
    message: 'Tu cita ha sido confirmada para mañana a las 10:00',
    userId: generateUuid(),
    statusId: generateUuid(),
    sentAt: new Date(),
    createdAt: new Date(),
  };

  describe('Notification Creation', () => {
    // Debería crear notificación con datos válidos
    it('should create notification with valid data', () => {
      const notification = new Notification({
        id: validNotificationData.id,
        type: validNotificationData.type,
        message: validNotificationData.message,
        userId: validNotificationData.userId,
        statusId: validNotificationData.statusId,
      });

      expect(notification.id).toBe(validNotificationData.id);
      expect(notification.type).toBe(validNotificationData.type);
      expect(notification.message).toBe(validNotificationData.message);
      expect(notification.userId).toBe(validNotificationData.userId);
      expect(notification.statusId).toBe(validNotificationData.statusId);
    });

    // Debería crear notificación con método estático create
    it('should create notification with static create method', () => {
      const notification = Notification.create(
        validNotificationData.type,
        validNotificationData.message,
        validNotificationData.userId,
        validNotificationData.statusId,
      );

      expect(notification.id).toBeDefined();
      expect(notification.type).toBe(validNotificationData.type);
      expect(notification.message).toBe(validNotificationData.message);
      expect(notification.userId).toBe(validNotificationData.userId);
      expect(notification.statusId).toBe(validNotificationData.statusId);
      expect(notification.sentAt).toBeUndefined();
      expect(notification.createdAt).toBeDefined();
    });

    // Debería crear notificación desde datos de persistencia
    it('should create notification from persistence data', () => {
      const notification = Notification.fromPersistence({
        id: validNotificationData.id,
        type: validNotificationData.type,
        message: validNotificationData.message,
        userId: validNotificationData.userId,
        statusId: validNotificationData.statusId,
        sentAt: validNotificationData.sentAt,
        createdAt: validNotificationData.createdAt,
      });

      expect(notification.id).toBe(validNotificationData.id);
      expect(notification.type).toBe(validNotificationData.type);
      expect(notification.message).toBe(validNotificationData.message);
      expect(notification.sentAt).toEqual(validNotificationData.sentAt);
      expect(notification.createdAt).toEqual(validNotificationData.createdAt);
    });

    // Debería crear notificación desde persistencia con sentAt null
    it('should create notification from persistence with null sentAt', () => {
      const notification = Notification.fromPersistence({
        id: validNotificationData.id,
        type: validNotificationData.type,
        message: validNotificationData.message,
        userId: validNotificationData.userId,
        statusId: validNotificationData.statusId,
        sentAt: null,
        createdAt: validNotificationData.createdAt,
      });

      expect(notification.sentAt).toBeUndefined();
    });

    // Debería generar ID automáticamente si no se proporciona
    it('should generate ID automatically if not provided', () => {
      const notification = new Notification({
        type: validNotificationData.type,
        message: validNotificationData.message,
        userId: validNotificationData.userId,
        statusId: validNotificationData.statusId,
      });

      expect(notification.id).toBeDefined();
      expect(notification.id.length).toBeGreaterThan(0);
    });

    // Debería generar createdAt automáticamente si no se proporciona
    it('should generate createdAt automatically if not provided', () => {
      const beforeCreate = new Date();
      
      const notification = new Notification({
        type: validNotificationData.type,
        message: validNotificationData.message,
        userId: validNotificationData.userId,
        statusId: validNotificationData.statusId,
      });

      const afterCreate = new Date();

      expect(notification.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(notification.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });
  });

  describe('Notification Validation', () => {
    // Debería lanzar error para tipo vacío
    it('should throw error for empty type', () => {
      expect(() => {
        new Notification({
          type: '' as NotificationTypeEnum,
          message: validNotificationData.message,
          userId: validNotificationData.userId,
          statusId: validNotificationData.statusId,
        });
      }).toThrow('Notification type is required');
    });

    // Debería lanzar error para tipo inválido
    it('should throw error for invalid type', () => {
      expect(() => {
        new Notification({
          type: 'INVALID_TYPE' as NotificationTypeEnum,
          message: validNotificationData.message,
          userId: validNotificationData.userId,
          statusId: validNotificationData.statusId,
        });
      }).toThrow('Invalid notification type');
    });

    // Debería lanzar error para mensaje vacío
    it('should throw error for empty message', () => {
      expect(() => {
        new Notification({
          type: validNotificationData.type,
          message: '',
          userId: validNotificationData.userId,
          statusId: validNotificationData.statusId,
        });
      }).toThrow('Notification message cannot be empty');
    });

    // Debería lanzar error para mensaje solo con espacios
    it('should throw error for whitespace-only message', () => {
      expect(() => {
        new Notification({
          type: validNotificationData.type,
          message: '   ',
          userId: validNotificationData.userId,
          statusId: validNotificationData.statusId,
        });
      }).toThrow('Notification message cannot be empty');
    });

    // Debería lanzar error para mensaje demasiado largo
    it('should throw error for message too long', () => {
      const longMessage = 'A'.repeat(1001);

      expect(() => {
        new Notification({
          type: validNotificationData.type,
          message: longMessage,
          userId: validNotificationData.userId,
          statusId: validNotificationData.statusId,
        });
      }).toThrow('Notification message is too long (max 1000 characters)');
    });

    // Debería aceptar mensaje con exactamente 1000 caracteres
    it('should accept message with exactly 1000 characters', () => {
      const maxLengthMessage = 'A'.repeat(1000);

      expect(() => {
        new Notification({
          type: validNotificationData.type,
          message: maxLengthMessage,
          userId: validNotificationData.userId,
          statusId: validNotificationData.statusId,
        });
      }).not.toThrow();
    });

    // Debería lanzar error para userId vacío
    it('should throw error for empty userId', () => {
      expect(() => {
        new Notification({
          type: validNotificationData.type,
          message: validNotificationData.message,
          userId: '',
          statusId: validNotificationData.statusId,
        });
      }).toThrow('User ID is required for notification');
    });

    // Debería lanzar error para statusId vacío
    it('should throw error for empty statusId', () => {
      expect(() => {
        new Notification({
          type: validNotificationData.type,
          message: validNotificationData.message,
          userId: validNotificationData.userId,
          statusId: '',
        });
      }).toThrow('Status ID is required for notification');
    });
  });

  describe('Notification Business Logic', () => {
    let notification: Notification;

    beforeEach(() => {
      notification = new Notification({
        id: validNotificationData.id,
        type: validNotificationData.type,
        message: validNotificationData.message,
        userId: validNotificationData.userId,
        statusId: validNotificationData.statusId,
      });
    });

    describe('Mark as Sent', () => {
      // Debería marcar notificación como enviada
      it('should mark notification as sent', () => {
        expect(notification.sentAt).toBeUndefined();

        notification.markAsSent();

        expect(notification.sentAt).toBeDefined();
        expect(notification.sentAt).toBeInstanceOf(Date);
      });

      // Debería establecer sentAt al momento actual
      it('should set sentAt to current time', () => {
        const beforeMark = new Date();
        
        notification.markAsSent();
        
        const afterMark = new Date();

        expect(notification.sentAt!.getTime()).toBeGreaterThanOrEqual(beforeMark.getTime());
        expect(notification.sentAt!.getTime()).toBeLessThanOrEqual(afterMark.getTime());
      });
    });

    describe('Update Status', () => {
      // Debería actualizar el estado de la notificación
      it('should update notification status', () => {
        const newStatusId = generateUuid();

        notification.updateStatus(newStatusId);

        expect(notification.statusId).toBe(newStatusId);
      });

      // Debería lanzar error para statusId vacío al actualizar
      it('should throw error for empty statusId when updating', () => {
        expect(() => {
          notification.updateStatus('');
        }).toThrow('New status ID cannot be empty');
      });

      // Debería lanzar error para statusId solo con espacios al actualizar
      it('should throw error for whitespace-only statusId when updating', () => {
        expect(() => {
          notification.updateStatus('   ');
        }).toThrow('New status ID cannot be empty');
      });
    });

    describe('Is Sent Check', () => {
      // Debería retornar false si no ha sido enviada
      it('should return false if not sent', () => {
        expect(notification.isSent()).toBe(false);
      });

      // Debería retornar true si ha sido enviada
      it('should return true if sent', () => {
        notification.markAsSent();

        expect(notification.isSent()).toBe(true);
      });
    });

    describe('Appointment Related Check', () => {
      // Debería identificar APPOINTMENT_CONFIRMATION como relacionada con cita
      it('should identify APPOINTMENT_CONFIRMATION as appointment related', () => {
        notification = new Notification({
          type: NotificationTypeEnum.APPOINTMENT_CONFIRMATION,
          message: 'Test',
          userId: validNotificationData.userId,
          statusId: validNotificationData.statusId,
        });

        expect(notification.isAppointmentRelated()).toBe(true);
      });

      // Debería identificar APPOINTMENT_REMINDER como relacionada con cita
      it('should identify APPOINTMENT_REMINDER as appointment related', () => {
        notification = new Notification({
          type: NotificationTypeEnum.APPOINTMENT_REMINDER,
          message: 'Test',
          userId: validNotificationData.userId,
          statusId: validNotificationData.statusId,
        });

        expect(notification.isAppointmentRelated()).toBe(true);
      });

      // Debería identificar APPOINTMENT_CANCELLATION como relacionada con cita
      it('should identify APPOINTMENT_CANCELLATION as appointment related', () => {
        notification = new Notification({
          type: NotificationTypeEnum.APPOINTMENT_CANCELLATION,
          message: 'Test',
          userId: validNotificationData.userId,
          statusId: validNotificationData.statusId,
        });

        expect(notification.isAppointmentRelated()).toBe(true);
      });

      // No debería identificar PROMOTIONAL como relacionada con cita
      it('should not identify PROMOTIONAL as appointment related', () => {
        notification = new Notification({
          type: NotificationTypeEnum.PROMOTIONAL,
          message: 'Test',
          userId: validNotificationData.userId,
          statusId: validNotificationData.statusId,
        });

        expect(notification.isAppointmentRelated()).toBe(false);
      });

      // No debería identificar SYSTEM como relacionada con cita
      it('should not identify SYSTEM as appointment related', () => {
        notification = new Notification({
          type: NotificationTypeEnum.SYSTEM,
          message: 'Test',
          userId: validNotificationData.userId,
          statusId: validNotificationData.statusId,
        });

        expect(notification.isAppointmentRelated()).toBe(false);
      });
    });

    describe('Persistence Conversion', () => {
      // Debería convertir a formato de persistencia
      it('should convert to persistence format', () => {
        const persistenceData = notification.toPersistence();

        expect(persistenceData).toEqual({
          id: notification.id,
          type: notification.type,
          message: notification.message,
          userId: notification.userId,
          statusId: notification.statusId,
          sentAt: null,
          createdAt: notification.createdAt,
        });
      });

      // Debería convertir a formato de persistencia con sentAt
      it('should convert to persistence format with sentAt', () => {
        notification.markAsSent();

        const persistenceData = notification.toPersistence();

        expect(persistenceData.sentAt).toBeDefined();
        expect(persistenceData.sentAt).toEqual(notification.sentAt);
      });
    });
  });

  describe('NotificationTypeEnum', () => {
    // Debería tener todos los valores de tipo esperados
    it('should have all expected type values', () => {
      expect(NotificationTypeEnum.APPOINTMENT_CONFIRMATION).toBe('APPOINTMENT_CONFIRMATION');
      expect(NotificationTypeEnum.APPOINTMENT_REMINDER).toBe('APPOINTMENT_REMINDER');
      expect(NotificationTypeEnum.APPOINTMENT_CANCELLATION).toBe('APPOINTMENT_CANCELLATION');
      expect(NotificationTypeEnum.PROMOTIONAL).toBe('PROMOTIONAL');
      expect(NotificationTypeEnum.SYSTEM).toBe('SYSTEM');
    });

    // Debería tener exactamente 5 valores de tipo
    it('should have exactly 5 type values', () => {
      const typeValues = Object.values(NotificationTypeEnum);
      expect(typeValues).toHaveLength(5);
    });
  });
});
