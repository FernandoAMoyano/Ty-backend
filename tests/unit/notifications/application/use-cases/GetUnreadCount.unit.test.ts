import { GetUnreadCount } from '../../../../../src/modules/notifications/application/use-cases/GetUnreadCount';
import { NotificationRepository } from '../../../../../src/modules/notifications/domain/repositories/NotificationRepository';
import { NotificationStatusRepository } from '../../../../../src/modules/notifications/domain/repositories/NotificationStatusRepository';
import { Notification, NotificationTypeEnum } from '../../../../../src/modules/notifications/domain/entities/Notification';
import { NotificationStatus, NotificationStatusEnum } from '../../../../../src/modules/notifications/domain/entities/NotificationStatus';
import { ValidationError } from '../../../../../src/shared/exceptions/ValidationError';
import { generateUuid } from '../../../../../src/shared/utils/uuid';

describe('GetUnreadCount Use Case', () => {
  let useCase: GetUnreadCount;
  let mockNotificationRepository: jest.Mocked<NotificationRepository>;
  let mockNotificationStatusRepository: jest.Mocked<NotificationStatusRepository>;

  const validUserId = generateUuid();
  const readStatusId = generateUuid();
  const pendingStatusId = generateUuid();
  const sentStatusId = generateUuid();

  const mockReadStatus = NotificationStatus.fromPersistence(
    readStatusId,
    NotificationStatusEnum.READ,
    'Notificación leída',
  );

  const createMockNotification = (statusId: string): Notification => {
    return Notification.fromPersistence({
      id: generateUuid(),
      type: NotificationTypeEnum.APPOINTMENT_CONFIRMATION,
      message: 'Test notification',
      userId: validUserId,
      statusId: statusId,
      sentAt: null,
      createdAt: new Date(),
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

    mockNotificationStatusRepository = {
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsById: jest.fn(),
      existsByName: jest.fn(),
    };

    useCase = new GetUnreadCount(
      mockNotificationRepository,
      mockNotificationStatusRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful Execution', () => {
    // Debería retornar conteo de notificaciones no leídas
    it('should return count of unread notifications', async () => {
      // Arrange
      const notifications = [
        createMockNotification(pendingStatusId),
        createMockNotification(sentStatusId),
        createMockNotification(readStatusId),
      ];
      mockNotificationStatusRepository.findByName.mockResolvedValue(mockReadStatus);
      mockNotificationRepository.findByUserId.mockResolvedValue(notifications);

      // Act
      const result = await useCase.execute(validUserId);

      // Assert
      expect(result.unreadCount).toBe(2); // 2 no están en estado READ
    });

    // Debería retornar 0 si todas están leídas
    it('should return 0 if all notifications are read', async () => {
      // Arrange
      const notifications = [
        createMockNotification(readStatusId),
        createMockNotification(readStatusId),
      ];
      mockNotificationStatusRepository.findByName.mockResolvedValue(mockReadStatus);
      mockNotificationRepository.findByUserId.mockResolvedValue(notifications);

      // Act
      const result = await useCase.execute(validUserId);

      // Assert
      expect(result.unreadCount).toBe(0);
    });

    // Debería retornar 0 si no hay notificaciones
    it('should return 0 if no notifications', async () => {
      // Arrange
      mockNotificationStatusRepository.findByName.mockResolvedValue(mockReadStatus);
      mockNotificationRepository.findByUserId.mockResolvedValue([]);

      // Act
      const result = await useCase.execute(validUserId);

      // Assert
      expect(result.unreadCount).toBe(0);
    });

    // Debería contar todas como no leídas si ninguna está en READ
    it('should count all as unread if none are in READ status', async () => {
      // Arrange
      const notifications = [
        createMockNotification(pendingStatusId),
        createMockNotification(sentStatusId),
        createMockNotification(pendingStatusId),
      ];
      mockNotificationStatusRepository.findByName.mockResolvedValue(mockReadStatus);
      mockNotificationRepository.findByUserId.mockResolvedValue(notifications);

      // Act
      const result = await useCase.execute(validUserId);

      // Assert
      expect(result.unreadCount).toBe(3);
    });

    // Debería contar todas como no leídas si no existe estado READ
    it('should count all as unread if READ status does not exist', async () => {
      // Arrange
      mockNotificationStatusRepository.findByName.mockResolvedValue(null);
      mockNotificationRepository.countByUserId.mockResolvedValue(5);

      // Act
      const result = await useCase.execute(validUserId);

      // Assert
      expect(result.unreadCount).toBe(5);
    });
  });

  describe('Input Validation', () => {
    // Debería lanzar error para userId vacío
    it('should throw error for empty userId', async () => {
      // Act & Assert
      await expect(useCase.execute('')).rejects.toThrow(ValidationError);
      await expect(useCase.execute('')).rejects.toThrow('User ID is required');
      expect(mockNotificationRepository.findByUserId).not.toHaveBeenCalled();
    });

    // Debería lanzar error para userId con espacios
    it('should throw error for whitespace-only userId', async () => {
      // Act & Assert
      await expect(useCase.execute('   ')).rejects.toThrow(ValidationError);
      expect(mockNotificationRepository.findByUserId).not.toHaveBeenCalled();
    });

    // Debería lanzar error para userId con formato UUID inválido
    it('should throw error for invalid UUID format userId', async () => {
      // Act & Assert
      await expect(useCase.execute('invalid-uuid')).rejects.toThrow(ValidationError);
      await expect(useCase.execute('invalid-uuid')).rejects.toThrow('User ID must be a valid UUID');
      expect(mockNotificationRepository.findByUserId).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    // Debería propagar errores del notification repository
    it('should propagate notification repository errors', async () => {
      // Arrange
      mockNotificationStatusRepository.findByName.mockResolvedValue(mockReadStatus);
      mockNotificationRepository.findByUserId.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(useCase.execute(validUserId)).rejects.toThrow('Database error');
    });

    // Debería propagar errores del status repository
    it('should propagate status repository errors', async () => {
      // Arrange
      mockNotificationStatusRepository.findByName.mockRejectedValue(new Error('Status fetch error'));

      // Act & Assert
      await expect(useCase.execute(validUserId)).rejects.toThrow('Status fetch error');
    });
  });

  describe('Repository Integration', () => {
    // Debería buscar estado READ primero
    it('should fetch READ status first', async () => {
      // Arrange
      mockNotificationStatusRepository.findByName.mockResolvedValue(mockReadStatus);
      mockNotificationRepository.findByUserId.mockResolvedValue([]);

      // Act
      await useCase.execute(validUserId);

      // Assert
      expect(mockNotificationStatusRepository.findByName).toHaveBeenCalledWith(NotificationStatusEnum.READ);
    });

    // Debería llamar al repository con userId correcto
    it('should call repository with correct userId', async () => {
      // Arrange
      mockNotificationStatusRepository.findByName.mockResolvedValue(mockReadStatus);
      mockNotificationRepository.findByUserId.mockResolvedValue([]);

      // Act
      await useCase.execute(validUserId);

      // Assert
      expect(mockNotificationRepository.findByUserId).toHaveBeenCalledWith(validUserId);
    });
  });

  describe('Return Format', () => {
    // Debería retornar objeto con propiedad unreadCount
    it('should return object with unreadCount property', async () => {
      // Arrange
      mockNotificationStatusRepository.findByName.mockResolvedValue(mockReadStatus);
      mockNotificationRepository.findByUserId.mockResolvedValue([]);

      // Act
      const result = await useCase.execute(validUserId);

      // Assert
      expect(result).toHaveProperty('unreadCount');
      expect(typeof result.unreadCount).toBe('number');
    });

    // Debería retornar número no negativo
    it('should return non-negative number', async () => {
      // Arrange
      mockNotificationStatusRepository.findByName.mockResolvedValue(mockReadStatus);
      mockNotificationRepository.findByUserId.mockResolvedValue([]);

      // Act
      const result = await useCase.execute(validUserId);

      // Assert
      expect(result.unreadCount).toBeGreaterThanOrEqual(0);
    });
  });
});
