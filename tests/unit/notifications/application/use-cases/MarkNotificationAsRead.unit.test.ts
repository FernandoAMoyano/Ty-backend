import { MarkNotificationAsRead } from '../../../../../src/modules/notifications/application/use-cases/MarkNotificationAsRead';
import { NotificationRepository } from '../../../../../src/modules/notifications/domain/repositories/NotificationRepository';
import { NotificationStatusRepository } from '../../../../../src/modules/notifications/domain/repositories/NotificationStatusRepository';
import { Notification, NotificationTypeEnum } from '../../../../../src/modules/notifications/domain/entities/Notification';
import { NotificationStatus, NotificationStatusEnum } from '../../../../../src/modules/notifications/domain/entities/NotificationStatus';
import { ValidationError } from '../../../../../src/shared/exceptions/ValidationError';
import { NotFoundError } from '../../../../../src/shared/exceptions/NotFoundError';
import { BusinessRuleError } from '../../../../../src/shared/exceptions/BusinessRuleError';
import { generateUuid } from '../../../../../src/shared/utils/uuid';

describe('MarkNotificationAsRead Use Case', () => {
  let useCase: MarkNotificationAsRead;
  let mockNotificationRepository: jest.Mocked<NotificationRepository>;
  let mockNotificationStatusRepository: jest.Mocked<NotificationStatusRepository>;

  const validUserId = generateUuid();
  const validNotificationId = generateUuid();
  const readStatusId = generateUuid();
  const pendingStatusId = generateUuid();

  const mockReadStatus = NotificationStatus.fromPersistence(
    readStatusId,
    NotificationStatusEnum.READ,
    'Notificación leída',
  );

  const createMockNotification = (overrides: Partial<{
    id: string;
    userId: string;
    statusId: string;
  }> = {}): Notification => {
    return Notification.fromPersistence({
      id: overrides.id || validNotificationId,
      type: NotificationTypeEnum.APPOINTMENT_CONFIRMATION,
      message: 'Test notification',
      userId: overrides.userId || validUserId,
      statusId: overrides.statusId || pendingStatusId,
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

    useCase = new MarkNotificationAsRead(
      mockNotificationRepository,
      mockNotificationStatusRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Execute - Bulk Update', () => {
    // Debería marcar una notificación como leída con notificationId
    it('should mark single notification as read with notificationId', async () => {
      // Arrange
      const notification = createMockNotification();
      mockNotificationStatusRepository.findByName.mockResolvedValue(mockReadStatus);
      mockNotificationRepository.findById.mockResolvedValue(notification);
      mockNotificationRepository.updateManyStatus.mockResolvedValue(1);

      // Act
      const result = await useCase.execute(
        { notificationId: validNotificationId },
        validUserId,
      );

      // Assert
      expect(result.updatedCount).toBe(1);
      expect(mockNotificationRepository.updateManyStatus).toHaveBeenCalledWith(
        [validNotificationId],
        readStatusId,
      );
    });

    // Debería marcar múltiples notificaciones como leídas
    it('should mark multiple notifications as read', async () => {
      // Arrange
      const notificationIds = [generateUuid(), generateUuid(), generateUuid()];
      const notifications = notificationIds.map(id => createMockNotification({ id }));
      
      mockNotificationStatusRepository.findByName.mockResolvedValue(mockReadStatus);
      notificationIds.forEach((id, index) => {
        mockNotificationRepository.findById.mockResolvedValueOnce(notifications[index]);
      });
      mockNotificationRepository.updateManyStatus.mockResolvedValue(3);

      // Act
      const result = await useCase.execute(
        { notificationIds },
        validUserId,
      );

      // Assert
      expect(result.updatedCount).toBe(3);
      expect(mockNotificationRepository.updateManyStatus).toHaveBeenCalledWith(
        notificationIds,
        readStatusId,
      );
    });
  });

  describe('ExecuteSingle', () => {
    // Debería marcar una notificación como leída y retornar DTO
    it('should mark single notification as read and return DTO', async () => {
      // Arrange
      const notification = createMockNotification();
      mockNotificationStatusRepository.findByName.mockResolvedValue(mockReadStatus);
      mockNotificationRepository.findById.mockResolvedValue(notification);
      mockNotificationRepository.update.mockImplementation(async (n) => n);

      // Act
      const result = await useCase.executeSingle(validNotificationId, validUserId);

      // Assert
      expect(result.id).toBe(validNotificationId);
      expect(result.isRead).toBe(true);
      expect(mockNotificationRepository.update).toHaveBeenCalled();
    });

    // Debería retornar sin cambios si ya está leída
    it('should return without changes if already read', async () => {
      // Arrange
      const notification = createMockNotification({ statusId: readStatusId });
      mockNotificationStatusRepository.findByName.mockResolvedValue(mockReadStatus);
      mockNotificationRepository.findById.mockResolvedValue(notification);

      // Act
      const result = await useCase.executeSingle(validNotificationId, validUserId);

      // Assert
      expect(result.isRead).toBe(true);
      expect(mockNotificationRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('Input Validation', () => {
    // Debería lanzar error si no se proporciona ningún ID
    it('should throw error if no IDs provided', async () => {
      // Act & Assert
      await expect(useCase.execute({}, validUserId)).rejects.toThrow(ValidationError);
      await expect(useCase.execute({}, validUserId)).rejects.toThrow('At least one notification ID is required');
    });

    // Debería lanzar error para requesterId vacío
    it('should throw error for empty requesterId', async () => {
      // Act & Assert
      await expect(useCase.execute({ notificationId: validNotificationId }, '')).rejects.toThrow(ValidationError);
      await expect(useCase.execute({ notificationId: validNotificationId }, '')).rejects.toThrow('Requester ID is required');
    });

    // Debería lanzar error para notificationId con formato UUID inválido
    it('should throw error for invalid UUID format notificationId', async () => {
      // Act & Assert
      await expect(useCase.execute({ notificationId: 'invalid-uuid' }, validUserId)).rejects.toThrow(ValidationError);
      await expect(useCase.execute({ notificationId: 'invalid-uuid' }, validUserId)).rejects.toThrow('Notification ID must be a valid UUID');
    });

    // Debería lanzar error para notificationIds con UUID inválido
    it('should throw error for invalid UUID in notificationIds array', async () => {
      // Act & Assert
      await expect(useCase.execute({ notificationIds: ['invalid-uuid'] }, validUserId)).rejects.toThrow(ValidationError);
    });

    // Debería lanzar error para requesterId con formato UUID inválido
    it('should throw error for invalid UUID format requesterId', async () => {
      // Act & Assert
      await expect(useCase.execute({ notificationId: validNotificationId }, 'invalid-uuid')).rejects.toThrow(ValidationError);
      await expect(useCase.execute({ notificationId: validNotificationId }, 'invalid-uuid')).rejects.toThrow('Requester ID must be a valid UUID');
    });
  });

  describe('Permission Validation', () => {
    // Debería lanzar BusinessRuleError si usuario no es propietario
    it('should throw BusinessRuleError if user is not owner', async () => {
      // Arrange
      const otherUserId = generateUuid();
      const notification = createMockNotification({ userId: otherUserId });
      mockNotificationStatusRepository.findByName.mockResolvedValue(mockReadStatus);
      mockNotificationRepository.findById.mockResolvedValue(notification);

      // Act & Assert
      await expect(useCase.execute({ notificationId: validNotificationId }, validUserId))
        .rejects.toThrow(BusinessRuleError);
    });

    // Debería lanzar BusinessRuleError en executeSingle si usuario no es propietario
    it('should throw BusinessRuleError in executeSingle if user is not owner', async () => {
      // Arrange
      const otherUserId = generateUuid();
      const notification = createMockNotification({ userId: otherUserId });
      mockNotificationStatusRepository.findByName.mockResolvedValue(mockReadStatus);
      mockNotificationRepository.findById.mockResolvedValue(notification);

      // Act & Assert
      await expect(useCase.executeSingle(validNotificationId, validUserId))
        .rejects.toThrow(BusinessRuleError);
    });
  });

  describe('Not Found Handling', () => {
    // Debería lanzar NotFoundError si notificación no existe
    it('should throw NotFoundError if notification does not exist', async () => {
      // Arrange
      mockNotificationStatusRepository.findByName.mockResolvedValue(mockReadStatus);
      mockNotificationRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute({ notificationId: validNotificationId }, validUserId))
        .rejects.toThrow(NotFoundError);
    });

    // Debería lanzar NotFoundError si estado READ no existe
    it('should throw NotFoundError if READ status does not exist', async () => {
      // Arrange
      mockNotificationStatusRepository.findByName.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute({ notificationId: validNotificationId }, validUserId))
        .rejects.toThrow(NotFoundError);
    });

    // Debería lanzar NotFoundError en executeSingle si notificación no existe
    it('should throw NotFoundError in executeSingle if notification does not exist', async () => {
      // Arrange
      mockNotificationRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.executeSingle(validNotificationId, validUserId))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('Error Handling', () => {
    // Debería propagar errores del repository
    it('should propagate repository errors', async () => {
      // Arrange
      mockNotificationStatusRepository.findByName.mockResolvedValue(mockReadStatus);
      mockNotificationRepository.findById.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(useCase.execute({ notificationId: validNotificationId }, validUserId))
        .rejects.toThrow('Database error');
    });

    // Debería propagar errores del status repository
    it('should propagate status repository errors', async () => {
      // Arrange
      mockNotificationStatusRepository.findByName.mockRejectedValue(new Error('Status error'));

      // Act & Assert
      await expect(useCase.execute({ notificationId: validNotificationId }, validUserId))
        .rejects.toThrow('Status error');
    });
  });

  describe('Repository Integration', () => {
    // Debería buscar estado READ primero
    it('should fetch READ status first', async () => {
      // Arrange
      const notification = createMockNotification();
      mockNotificationStatusRepository.findByName.mockResolvedValue(mockReadStatus);
      mockNotificationRepository.findById.mockResolvedValue(notification);
      mockNotificationRepository.updateManyStatus.mockResolvedValue(1);

      // Act
      await useCase.execute({ notificationId: validNotificationId }, validUserId);

      // Assert
      expect(mockNotificationStatusRepository.findByName).toHaveBeenCalledWith(NotificationStatusEnum.READ);
    });

    // Debería verificar propiedad de cada notificación
    it('should verify ownership of each notification', async () => {
      // Arrange
      const notificationIds = [generateUuid(), generateUuid()];
      const notifications = notificationIds.map(id => createMockNotification({ id }));
      
      mockNotificationStatusRepository.findByName.mockResolvedValue(mockReadStatus);
      mockNotificationRepository.findById
        .mockResolvedValueOnce(notifications[0])
        .mockResolvedValueOnce(notifications[1]);
      mockNotificationRepository.updateManyStatus.mockResolvedValue(2);

      // Act
      await useCase.execute({ notificationIds }, validUserId);

      // Assert
      expect(mockNotificationRepository.findById).toHaveBeenCalledTimes(2);
      expect(mockNotificationRepository.findById).toHaveBeenCalledWith(notificationIds[0]);
      expect(mockNotificationRepository.findById).toHaveBeenCalledWith(notificationIds[1]);
    });
  });
});
