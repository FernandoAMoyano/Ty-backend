import { GetNotificationById } from '../../../../../src/modules/notifications/application/use-cases/GetNotificationById';
import { NotificationRepository } from '../../../../../src/modules/notifications/domain/repositories/NotificationRepository';
import { Notification, NotificationTypeEnum } from '../../../../../src/modules/notifications/domain/entities/Notification';
import { ValidationError } from '../../../../../src/shared/exceptions/ValidationError';
import { NotFoundError } from '../../../../../src/shared/exceptions/NotFoundError';
import { BusinessRuleError } from '../../../../../src/shared/exceptions/BusinessRuleError';
import { generateUuid } from '../../../../../src/shared/utils/uuid';

describe('GetNotificationById Use Case', () => {
  let useCase: GetNotificationById;
  let mockNotificationRepository: jest.Mocked<NotificationRepository>;

  const validNotificationId = generateUuid();
  const validUserId = generateUuid();
  const validStatusId = generateUuid();

  const createMockNotification = (overrides: Partial<{
    id: string;
    type: NotificationTypeEnum;
    message: string;
    userId: string;
    statusId: string;
    sentAt: Date;
    createdAt: Date;
  }> = {}): Notification => {
    return Notification.fromPersistence({
      id: overrides.id || validNotificationId,
      type: overrides.type || NotificationTypeEnum.APPOINTMENT_CONFIRMATION,
      message: overrides.message || 'Tu cita ha sido confirmada',
      userId: overrides.userId || validUserId,
      statusId: overrides.statusId || validStatusId,
      sentAt: overrides.sentAt || null,
      createdAt: overrides.createdAt || new Date(),
    });
  };

  beforeEach(() => {
    mockNotificationRepository = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findByUserIdPaginated: jest.fn(),
      findByUserIdAndStatus: jest.fn(),
      findByUserIdAndType: jest.fn(),
      countUnreadByUserId: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
      update: jest.fn(),
      updateManyStatus: jest.fn(),
      delete: jest.fn(),
      deleteByUserId: jest.fn(),
      existsById: jest.fn(),
      countByUserId: jest.fn(),
    };

    useCase = new GetNotificationById(mockNotificationRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful Execution', () => {
    // Debería obtener notificación por ID exitosamente
    it('should get notification by ID successfully', async () => {
      // Arrange
      const notification = createMockNotification();
      mockNotificationRepository.findById.mockResolvedValue(notification);

      // Act
      const result = await useCase.execute(validNotificationId, validUserId);

      // Assert
      expect(mockNotificationRepository.findById).toHaveBeenCalledWith(validNotificationId);
      expect(result.id).toBe(validNotificationId);
      expect(result.type).toBe(notification.type);
      expect(result.message).toBe(notification.message);
      expect(result.userId).toBe(validUserId);
      expect(result.statusId).toBe(validStatusId);
    });

    // Debería mapear fechas a formato ISO string
    it('should map dates to ISO string format', async () => {
      // Arrange
      const createdAt = new Date('2024-01-15T10:00:00.000Z');
      const sentAt = new Date('2024-01-15T10:30:00.000Z');
      const notification = createMockNotification({ createdAt, sentAt });
      mockNotificationRepository.findById.mockResolvedValue(notification);

      // Act
      const result = await useCase.execute(validNotificationId, validUserId);

      // Assert
      expect(result.createdAt).toBe(createdAt.toISOString());
      expect(result.sentAt).toBe(sentAt.toISOString());
    });

    // Debería manejar notificación sin sentAt
    it('should handle notification without sentAt', async () => {
      // Arrange
      const notification = createMockNotification();
      mockNotificationRepository.findById.mockResolvedValue(notification);

      // Act
      const result = await useCase.execute(validNotificationId, validUserId);

      // Assert
      expect(result.sentAt).toBeUndefined();
    });
  });

  describe('Input Validation', () => {
    // Debería lanzar error para notificationId vacío
    it('should throw error for empty notificationId', async () => {
      // Act & Assert
      await expect(useCase.execute('', validUserId)).rejects.toThrow(ValidationError);
      await expect(useCase.execute('', validUserId)).rejects.toThrow('Notification ID is required');
      expect(mockNotificationRepository.findById).not.toHaveBeenCalled();
    });

    // Debería lanzar error para notificationId con formato UUID inválido
    it('should throw error for invalid UUID format notificationId', async () => {
      // Act & Assert
      await expect(useCase.execute('invalid-uuid', validUserId)).rejects.toThrow(ValidationError);
      await expect(useCase.execute('invalid-uuid', validUserId)).rejects.toThrow('Notification ID must be a valid UUID');
      expect(mockNotificationRepository.findById).not.toHaveBeenCalled();
    });

    // Debería lanzar error para requesterId vacío
    it('should throw error for empty requesterId', async () => {
      // Act & Assert
      await expect(useCase.execute(validNotificationId, '')).rejects.toThrow(ValidationError);
      await expect(useCase.execute(validNotificationId, '')).rejects.toThrow('Requester ID is required');
      expect(mockNotificationRepository.findById).not.toHaveBeenCalled();
    });

    // Debería lanzar error para requesterId con formato UUID inválido
    it('should throw error for invalid UUID format requesterId', async () => {
      // Act & Assert
      await expect(useCase.execute(validNotificationId, 'invalid-uuid')).rejects.toThrow(ValidationError);
      await expect(useCase.execute(validNotificationId, 'invalid-uuid')).rejects.toThrow('Requester ID must be a valid UUID');
      expect(mockNotificationRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('Not Found Handling', () => {
    // Debería lanzar NotFoundError si notificación no existe
    it('should throw NotFoundError if notification does not exist', async () => {
      // Arrange
      mockNotificationRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(validNotificationId, validUserId)).rejects.toThrow(NotFoundError);
      expect(mockNotificationRepository.findById).toHaveBeenCalledWith(validNotificationId);
    });
  });

  describe('Permission Validation', () => {
    // Debería lanzar BusinessRuleError si el usuario no es propietario
    it('should throw BusinessRuleError if user is not owner', async () => {
      // Arrange
      const otherUserId = generateUuid();
      const notification = createMockNotification({ userId: otherUserId });
      mockNotificationRepository.findById.mockResolvedValue(notification);

      // Act & Assert
      await expect(useCase.execute(validNotificationId, validUserId)).rejects.toThrow(BusinessRuleError);
      await expect(useCase.execute(validNotificationId, validUserId)).rejects.toThrow('You do not have permission to access this notification');
    });

    // Debería permitir acceso si el usuario es propietario
    it('should allow access if user is owner', async () => {
      // Arrange
      const notification = createMockNotification({ userId: validUserId });
      mockNotificationRepository.findById.mockResolvedValue(notification);

      // Act
      const result = await useCase.execute(validNotificationId, validUserId);

      // Assert
      expect(result.id).toBe(validNotificationId);
      expect(result.userId).toBe(validUserId);
    });
  });

  describe('Error Handling', () => {
    // Debería propagar errores del repository
    it('should propagate repository errors', async () => {
      // Arrange
      mockNotificationRepository.findById.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(useCase.execute(validNotificationId, validUserId)).rejects.toThrow('Database error');
    });
  });

  describe('Repository Integration', () => {
    // Debería llamar al repository con el ID correcto
    it('should call repository with correct ID', async () => {
      // Arrange
      const notification = createMockNotification();
      mockNotificationRepository.findById.mockResolvedValue(notification);

      // Act
      await useCase.execute(validNotificationId, validUserId);

      // Assert
      expect(mockNotificationRepository.findById).toHaveBeenCalledTimes(1);
      expect(mockNotificationRepository.findById).toHaveBeenCalledWith(validNotificationId);
    });

    // No debería llamar otros métodos del repository
    it('should not call other repository methods', async () => {
      // Arrange
      const notification = createMockNotification();
      mockNotificationRepository.findById.mockResolvedValue(notification);

      // Act
      await useCase.execute(validNotificationId, validUserId);

      // Assert
      expect(mockNotificationRepository.findById).toHaveBeenCalledTimes(1);
      expect(mockNotificationRepository.findByUserId).not.toHaveBeenCalled();
      expect(mockNotificationRepository.save).not.toHaveBeenCalled();
      expect(mockNotificationRepository.update).not.toHaveBeenCalled();
      expect(mockNotificationRepository.delete).not.toHaveBeenCalled();
    });
  });
});
