import { GetUserNotifications } from '../../../../../src/modules/notifications/application/use-cases/GetUserNotifications';
import { NotificationRepository } from '../../../../../src/modules/notifications/domain/repositories/NotificationRepository';
import { NotificationStatusRepository } from '../../../../../src/modules/notifications/domain/repositories/NotificationStatusRepository';
import { Notification, NotificationTypeEnum } from '../../../../../src/modules/notifications/domain/entities/Notification';
import { NotificationStatus, NotificationStatusEnum } from '../../../../../src/modules/notifications/domain/entities/NotificationStatus';
import { ValidationError } from '../../../../../src/shared/exceptions/ValidationError';
import { generateUuid } from '../../../../../src/shared/utils/uuid';

describe('GetUserNotifications Use Case', () => {
  let useCase: GetUserNotifications;
  let mockNotificationRepository: jest.Mocked<NotificationRepository>;
  let mockNotificationStatusRepository: jest.Mocked<NotificationStatusRepository>;

  const validUserId = generateUuid();
  const readStatusId = generateUuid();
  const pendingStatusId = generateUuid();

  const mockReadStatus = NotificationStatus.fromPersistence(
    readStatusId,
    NotificationStatusEnum.READ,
    'Notificación leída',
  );

  const createMockNotification = (overrides: Partial<{
    id: string;
    type: NotificationTypeEnum;
    statusId: string;
    createdAt: Date;
  }> = {}): Notification => {
    return Notification.fromPersistence({
      id: overrides.id || generateUuid(),
      type: overrides.type || NotificationTypeEnum.APPOINTMENT_CONFIRMATION,
      message: 'Test notification',
      userId: validUserId,
      statusId: overrides.statusId || pendingStatusId,
      sentAt: null,
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

    useCase = new GetUserNotifications(
      mockNotificationRepository,
      mockNotificationStatusRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful Execution', () => {
    // Debería obtener notificaciones del usuario con paginación por defecto
    it('should get user notifications with default pagination', async () => {
      // Arrange
      const notifications = [
        createMockNotification(),
        createMockNotification(),
        createMockNotification(),
      ];
      mockNotificationStatusRepository.findByName.mockResolvedValue(mockReadStatus);
      mockNotificationRepository.findByUserIdPaginated.mockResolvedValue(notifications);
      mockNotificationRepository.countByUserId.mockResolvedValue(3);

      // Act
      const result = await useCase.execute(validUserId);

      // Assert
      expect(result.notifications).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(1);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPreviousPage).toBe(false);
    });

    // Debería respetar parámetros de paginación personalizados
    it('should respect custom pagination parameters', async () => {
      // Arrange
      const notifications = [createMockNotification(), createMockNotification()];
      mockNotificationStatusRepository.findByName.mockResolvedValue(mockReadStatus);
      mockNotificationRepository.findByUserIdPaginated.mockResolvedValue(notifications);
      mockNotificationRepository.countByUserId.mockResolvedValue(10);

      // Act
      const result = await useCase.execute(validUserId, { page: 2, limit: 2 });

      // Assert
      expect(result.page).toBe(2);
      expect(result.limit).toBe(2);
      expect(result.total).toBe(10);
      expect(result.totalPages).toBe(5);
      expect(result.hasNextPage).toBe(true);
      expect(result.hasPreviousPage).toBe(true);
      // limit=2, offset=(2-1)*2=2
      expect(mockNotificationRepository.findByUserIdPaginated).toHaveBeenCalledWith(validUserId, 2, 2);
    });

    // Debería filtrar por tipo de notificación
    it('should filter by notification type', async () => {
      // Arrange
      const notifications = [
        createMockNotification({ type: NotificationTypeEnum.PROMOTIONAL }),
      ];
      mockNotificationStatusRepository.findByName.mockResolvedValue(mockReadStatus);
      mockNotificationRepository.findByUserIdAndType.mockResolvedValue(notifications);
      mockNotificationRepository.countByUserId.mockResolvedValue(1);

      // Act
      const result = await useCase.execute(validUserId, { type: NotificationTypeEnum.PROMOTIONAL });

      // Assert
      expect(mockNotificationRepository.findByUserIdAndType).toHaveBeenCalledWith(
        validUserId,
        NotificationTypeEnum.PROMOTIONAL,
      );
      expect(result.notifications[0].type).toBe(NotificationTypeEnum.PROMOTIONAL);
    });

    // Debería filtrar solo notificaciones no leídas
    it('should filter only unread notifications', async () => {
      // Arrange
      const notifications = [
        createMockNotification({ statusId: pendingStatusId }),
        createMockNotification({ statusId: readStatusId }),
        createMockNotification({ statusId: pendingStatusId }),
      ];
      mockNotificationStatusRepository.findByName.mockResolvedValue(mockReadStatus);
      mockNotificationRepository.findByUserId.mockResolvedValue(notifications);
      mockNotificationRepository.countByUserId.mockResolvedValue(3);

      // Act
      const result = await useCase.execute(validUserId, { unreadOnly: true });

      // Assert
      expect(result.notifications).toHaveLength(2);
      result.notifications.forEach(n => {
        expect(n.statusId).not.toBe(readStatusId);
      });
    });

    // Debería incluir indicador isRead en las notificaciones
    it('should include isRead indicator in notifications', async () => {
      // Arrange
      const notifications = [
        createMockNotification({ statusId: readStatusId }),
        createMockNotification({ statusId: pendingStatusId }),
      ];
      mockNotificationStatusRepository.findByName.mockResolvedValue(mockReadStatus);
      mockNotificationRepository.findByUserIdPaginated.mockResolvedValue(notifications);
      mockNotificationRepository.countByUserId.mockResolvedValue(2);

      // Act
      const result = await useCase.execute(validUserId);

      // Assert
      expect(result.notifications[0].isRead).toBe(true);
      expect(result.notifications[1].isRead).toBe(false);
    });

    // Debería retornar lista vacía si no hay notificaciones
    it('should return empty list if no notifications', async () => {
      // Arrange
      mockNotificationStatusRepository.findByName.mockResolvedValue(mockReadStatus);
      mockNotificationRepository.findByUserIdPaginated.mockResolvedValue([]);
      mockNotificationRepository.countByUserId.mockResolvedValue(0);

      // Act
      const result = await useCase.execute(validUserId);

      // Assert
      expect(result.notifications).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    // Debería manejar unreadOnly cuando no existe estado READ
    it('should handle unreadOnly when READ status does not exist', async () => {
      // Arrange
      const notifications = [createMockNotification()];
      mockNotificationStatusRepository.findByName.mockResolvedValue(null);
      mockNotificationRepository.findByUserId.mockResolvedValue(notifications);
      mockNotificationRepository.countByUserId.mockResolvedValue(1);

      // Act
      const result = await useCase.execute(validUserId, { unreadOnly: true });

      // Assert
      expect(result.notifications).toHaveLength(1);
    });
  });

  describe('Pagination Calculations', () => {
    // Debería calcular hasNextPage correctamente
    it('should calculate hasNextPage correctly', async () => {
      // Arrange
      mockNotificationStatusRepository.findByName.mockResolvedValue(mockReadStatus);
      mockNotificationRepository.findByUserIdPaginated.mockResolvedValue([createMockNotification()]);
      mockNotificationRepository.countByUserId.mockResolvedValue(25);

      // Act
      const result = await useCase.execute(validUserId, { page: 1, limit: 10 });

      // Assert
      expect(result.hasNextPage).toBe(true);
      expect(result.totalPages).toBe(3);
    });

    // Debería calcular hasPreviousPage correctamente
    it('should calculate hasPreviousPage correctly', async () => {
      // Arrange
      mockNotificationStatusRepository.findByName.mockResolvedValue(mockReadStatus);
      mockNotificationRepository.findByUserIdPaginated.mockResolvedValue([createMockNotification()]);
      mockNotificationRepository.countByUserId.mockResolvedValue(25);

      // Act
      const result = await useCase.execute(validUserId, { page: 2, limit: 10 });

      // Assert
      expect(result.hasPreviousPage).toBe(true);
    });

    // Debería manejar última página correctamente
    it('should handle last page correctly', async () => {
      // Arrange
      mockNotificationStatusRepository.findByName.mockResolvedValue(mockReadStatus);
      mockNotificationRepository.findByUserIdPaginated.mockResolvedValue([createMockNotification()]);
      mockNotificationRepository.countByUserId.mockResolvedValue(25);

      // Act
      const result = await useCase.execute(validUserId, { page: 3, limit: 10 });

      // Assert
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPreviousPage).toBe(true);
    });

    // Debería calcular offset correctamente
    it('should calculate offset correctly', async () => {
      // Arrange
      mockNotificationStatusRepository.findByName.mockResolvedValue(mockReadStatus);
      mockNotificationRepository.findByUserIdPaginated.mockResolvedValue([]);
      mockNotificationRepository.countByUserId.mockResolvedValue(0);

      // Act
      await useCase.execute(validUserId, { page: 3, limit: 10 });

      // Assert
      // offset = (page - 1) * limit = (3 - 1) * 10 = 20
      expect(mockNotificationRepository.findByUserIdPaginated).toHaveBeenCalledWith(validUserId, 10, 20);
    });
  });

  describe('Input Validation', () => {
    // Debería lanzar error para userId vacío
    it('should throw error for empty userId', async () => {
      // Act & Assert
      await expect(useCase.execute('')).rejects.toThrow(ValidationError);
      await expect(useCase.execute('')).rejects.toThrow('User ID is required');
    });

    // Debería lanzar error para userId con espacios
    it('should throw error for whitespace-only userId', async () => {
      // Act & Assert
      await expect(useCase.execute('   ')).rejects.toThrow(ValidationError);
      await expect(useCase.execute('   ')).rejects.toThrow('User ID is required');
    });

    // Debería lanzar error para userId con formato UUID inválido
    it('should throw error for invalid UUID format userId', async () => {
      // Act & Assert
      await expect(useCase.execute('invalid-uuid')).rejects.toThrow(ValidationError);
      await expect(useCase.execute('invalid-uuid')).rejects.toThrow('User ID must be a valid UUID');
    });

    // Debería aceptar UUID válido
    it('should accept valid UUID', async () => {
      // Arrange
      mockNotificationStatusRepository.findByName.mockResolvedValue(mockReadStatus);
      mockNotificationRepository.findByUserIdPaginated.mockResolvedValue([]);
      mockNotificationRepository.countByUserId.mockResolvedValue(0);

      // Act & Assert
      await expect(useCase.execute(validUserId)).resolves.not.toThrow();
    });
  });

  describe('Error Handling', () => {
    // Debería propagar errores del repository
    it('should propagate repository errors', async () => {
      // Arrange
      mockNotificationStatusRepository.findByName.mockResolvedValue(mockReadStatus);
      mockNotificationRepository.findByUserIdPaginated.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(useCase.execute(validUserId)).rejects.toThrow('Database error');
    });

    // Debería propagar errores del status repository
    it('should propagate status repository errors', async () => {
      // Arrange
      mockNotificationRepository.findByUserIdPaginated.mockResolvedValue([]);
      mockNotificationRepository.countByUserId.mockResolvedValue(0);
      mockNotificationStatusRepository.findByName.mockRejectedValue(new Error('Status error'));

      // Act & Assert
      await expect(useCase.execute(validUserId)).rejects.toThrow('Status error');
    });
  });

  describe('Repository Integration', () => {
    // Debería llamar al repository con parámetros correctos (limit, offset)
    it('should call repository with correct parameters (limit, offset)', async () => {
      // Arrange
      mockNotificationStatusRepository.findByName.mockResolvedValue(mockReadStatus);
      mockNotificationRepository.findByUserIdPaginated.mockResolvedValue([]);
      mockNotificationRepository.countByUserId.mockResolvedValue(0);

      // Act
      await useCase.execute(validUserId, { page: 2, limit: 15 });

      // Assert
      // offset = (2 - 1) * 15 = 15
      expect(mockNotificationRepository.findByUserIdPaginated).toHaveBeenCalledWith(validUserId, 15, 15);
      expect(mockNotificationRepository.countByUserId).toHaveBeenCalledWith(validUserId);
    });

    // Debería usar valores por defecto cuando no se proporcionan filtros
    it('should use default values when no filters provided', async () => {
      // Arrange
      mockNotificationStatusRepository.findByName.mockResolvedValue(mockReadStatus);
      mockNotificationRepository.findByUserIdPaginated.mockResolvedValue([]);
      mockNotificationRepository.countByUserId.mockResolvedValue(0);

      // Act
      await useCase.execute(validUserId);

      // Assert
      // default: page=1, limit=20, offset=0
      expect(mockNotificationRepository.findByUserIdPaginated).toHaveBeenCalledWith(validUserId, 20, 0);
    });

    // Debería buscar estado READ para determinar isRead
    it('should fetch READ status to determine isRead', async () => {
      // Arrange
      mockNotificationStatusRepository.findByName.mockResolvedValue(mockReadStatus);
      mockNotificationRepository.findByUserIdPaginated.mockResolvedValue([]);
      mockNotificationRepository.countByUserId.mockResolvedValue(0);

      // Act
      await useCase.execute(validUserId);

      // Assert
      expect(mockNotificationStatusRepository.findByName).toHaveBeenCalledWith(NotificationStatusEnum.READ);
    });

    // Debería usar findByUserId cuando unreadOnly es true
    it('should use findByUserId when unreadOnly is true', async () => {
      // Arrange
      mockNotificationStatusRepository.findByName.mockResolvedValue(mockReadStatus);
      mockNotificationRepository.findByUserId.mockResolvedValue([]);
      mockNotificationRepository.countByUserId.mockResolvedValue(0);

      // Act
      await useCase.execute(validUserId, { unreadOnly: true });

      // Assert
      expect(mockNotificationRepository.findByUserId).toHaveBeenCalledWith(validUserId);
      expect(mockNotificationRepository.findByUserIdPaginated).not.toHaveBeenCalled();
    });

    // Debería usar findByUserIdAndType cuando type está definido
    it('should use findByUserIdAndType when type is defined', async () => {
      // Arrange
      mockNotificationStatusRepository.findByName.mockResolvedValue(mockReadStatus);
      mockNotificationRepository.findByUserIdAndType.mockResolvedValue([]);
      mockNotificationRepository.countByUserId.mockResolvedValue(0);

      // Act
      await useCase.execute(validUserId, { type: NotificationTypeEnum.SYSTEM });

      // Assert
      expect(mockNotificationRepository.findByUserIdAndType).toHaveBeenCalledWith(
        validUserId,
        NotificationTypeEnum.SYSTEM,
      );
      expect(mockNotificationRepository.findByUserIdPaginated).not.toHaveBeenCalled();
    });
  });

  describe('Return Format', () => {
    // Debería retornar objeto con estructura de paginación completa
    it('should return object with complete pagination structure', async () => {
      // Arrange
      mockNotificationStatusRepository.findByName.mockResolvedValue(mockReadStatus);
      mockNotificationRepository.findByUserIdPaginated.mockResolvedValue([]);
      mockNotificationRepository.countByUserId.mockResolvedValue(0);

      // Act
      const result = await useCase.execute(validUserId);

      // Assert
      expect(result).toHaveProperty('notifications');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('limit');
      expect(result).toHaveProperty('totalPages');
      expect(result).toHaveProperty('hasNextPage');
      expect(result).toHaveProperty('hasPreviousPage');
    });

    // Debería mapear notificaciones a DTOs correctamente
    it('should map notifications to DTOs correctly', async () => {
      // Arrange
      const createdAt = new Date('2024-01-15T10:00:00.000Z');
      const notification = createMockNotification({ createdAt });
      mockNotificationStatusRepository.findByName.mockResolvedValue(mockReadStatus);
      mockNotificationRepository.findByUserIdPaginated.mockResolvedValue([notification]);
      mockNotificationRepository.countByUserId.mockResolvedValue(1);

      // Act
      const result = await useCase.execute(validUserId);

      // Assert
      expect(result.notifications[0]).toHaveProperty('id');
      expect(result.notifications[0]).toHaveProperty('type');
      expect(result.notifications[0]).toHaveProperty('message');
      expect(result.notifications[0]).toHaveProperty('userId');
      expect(result.notifications[0]).toHaveProperty('statusId');
      expect(result.notifications[0]).toHaveProperty('isRead');
      expect(result.notifications[0]).toHaveProperty('createdAt');
      expect(result.notifications[0].createdAt).toBe(createdAt.toISOString());
    });

    // Debería incluir isRead como undefined cuando no hay estado READ
    it('should include isRead as undefined when no READ status exists', async () => {
      // Arrange
      const notification = createMockNotification();
      mockNotificationStatusRepository.findByName.mockResolvedValue(null);
      mockNotificationRepository.findByUserIdPaginated.mockResolvedValue([notification]);
      mockNotificationRepository.countByUserId.mockResolvedValue(1);

      // Act
      const result = await useCase.execute(validUserId);

      // Assert
      expect(result.notifications[0].isRead).toBeUndefined();
    });
  });
});
