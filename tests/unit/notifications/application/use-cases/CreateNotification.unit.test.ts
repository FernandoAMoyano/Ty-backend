import { CreateNotification } from '../../../../../src/modules/notifications/application/use-cases/CreateNotification';
import { NotificationRepository } from '../../../../../src/modules/notifications/domain/repositories/NotificationRepository';
import { NotificationStatusRepository } from '../../../../../src/modules/notifications/domain/repositories/NotificationStatusRepository';
import { Notification, NotificationTypeEnum } from '../../../../../src/modules/notifications/domain/entities/Notification';
import { NotificationStatus, NotificationStatusEnum } from '../../../../../src/modules/notifications/domain/entities/NotificationStatus';
import { ValidationError } from '../../../../../src/shared/exceptions/ValidationError';
import { NotFoundError } from '../../../../../src/shared/exceptions/NotFoundError';
import { generateUuid } from '../../../../../src/shared/utils/uuid';

describe('CreateNotification Use Case', () => {
  let useCase: CreateNotification;
  let mockNotificationRepository: jest.Mocked<NotificationRepository>;
  let mockNotificationStatusRepository: jest.Mocked<NotificationStatusRepository>;

  const validUserId = generateUuid();
  const validStatusId = generateUuid();

  const validCreateDto = {
    type: NotificationTypeEnum.APPOINTMENT_CONFIRMATION,
    message: 'Tu cita ha sido confirmada para mañana a las 10:00',
    userId: validUserId,
  };

  const mockPendingStatus = NotificationStatus.fromPersistence(
    validStatusId,
    NotificationStatusEnum.PENDING,
    'Notificación pendiente de envío',
  );

  beforeEach(() => {
    // Mock NotificationRepository
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

    // Mock NotificationStatusRepository
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

    useCase = new CreateNotification(
      mockNotificationRepository,
      mockNotificationStatusRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful Execution', () => {
    // Debería crear notificación exitosamente
    it('should create notification successfully', async () => {
      // Arrange
      mockNotificationStatusRepository.findByName.mockResolvedValue(mockPendingStatus);
      mockNotificationRepository.save.mockImplementation(async (notification) => notification);

      // Act
      const result = await useCase.execute(validCreateDto);

      // Assert
      expect(mockNotificationStatusRepository.findByName).toHaveBeenCalledWith(NotificationStatusEnum.PENDING);
      expect(mockNotificationRepository.save).toHaveBeenCalledTimes(1);
      expect(result.type).toBe(validCreateDto.type);
      expect(result.message).toBe(validCreateDto.message);
      expect(result.userId).toBe(validCreateDto.userId);
      expect(result.statusId).toBe(validStatusId);
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
    });

    // Debería crear notificación de tipo APPOINTMENT_REMINDER
    it('should create APPOINTMENT_REMINDER notification', async () => {
      // Arrange
      const dto = {
        ...validCreateDto,
        type: NotificationTypeEnum.APPOINTMENT_REMINDER,
        message: 'Recordatorio: Tu cita es mañana',
      };
      mockNotificationStatusRepository.findByName.mockResolvedValue(mockPendingStatus);
      mockNotificationRepository.save.mockImplementation(async (notification) => notification);

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.type).toBe(NotificationTypeEnum.APPOINTMENT_REMINDER);
    });

    // Debería crear notificación de tipo PROMOTIONAL
    it('should create PROMOTIONAL notification', async () => {
      // Arrange
      const dto = {
        ...validCreateDto,
        type: NotificationTypeEnum.PROMOTIONAL,
        message: '¡Aprovecha nuestra promoción de verano!',
      };
      mockNotificationStatusRepository.findByName.mockResolvedValue(mockPendingStatus);
      mockNotificationRepository.save.mockImplementation(async (notification) => notification);

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.type).toBe(NotificationTypeEnum.PROMOTIONAL);
    });

    // Debería crear notificación de tipo SYSTEM
    it('should create SYSTEM notification', async () => {
      // Arrange
      const dto = {
        ...validCreateDto,
        type: NotificationTypeEnum.SYSTEM,
        message: 'Actualización del sistema disponible',
      };
      mockNotificationStatusRepository.findByName.mockResolvedValue(mockPendingStatus);
      mockNotificationRepository.save.mockImplementation(async (notification) => notification);

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.type).toBe(NotificationTypeEnum.SYSTEM);
    });

    // Debería asignar estado PENDING automáticamente
    it('should assign PENDING status automatically', async () => {
      // Arrange
      mockNotificationStatusRepository.findByName.mockResolvedValue(mockPendingStatus);
      mockNotificationRepository.save.mockImplementation(async (notification) => notification);

      // Act
      const result = await useCase.execute(validCreateDto);

      // Assert
      expect(mockNotificationStatusRepository.findByName).toHaveBeenCalledWith(NotificationStatusEnum.PENDING);
      expect(result.statusId).toBe(validStatusId);
    });

    // Debería retornar DTO con formato correcto
    it('should return DTO with correct format', async () => {
      // Arrange
      mockNotificationStatusRepository.findByName.mockResolvedValue(mockPendingStatus);
      mockNotificationRepository.save.mockImplementation(async (notification) => notification);

      // Act
      const result = await useCase.execute(validCreateDto);

      // Assert
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('statusId');
      expect(result).toHaveProperty('createdAt');
      expect(typeof result.createdAt).toBe('string'); // ISO string
    });
  });

  describe('Input Validation', () => {
    // Debería lanzar error para tipo vacío
    it('should throw error for empty type', async () => {
      // Arrange
      const dto = { ...validCreateDto, type: '' as NotificationTypeEnum };

      // Act & Assert
      await expect(useCase.execute(dto)).rejects.toThrow(ValidationError);
      expect(mockNotificationRepository.save).not.toHaveBeenCalled();
    });

    // Debería lanzar error para tipo inválido
    it('should throw error for invalid type', async () => {
      // Arrange
      const dto = { ...validCreateDto, type: 'INVALID_TYPE' as NotificationTypeEnum };

      // Act & Assert
      await expect(useCase.execute(dto)).rejects.toThrow(ValidationError);
      await expect(useCase.execute(dto)).rejects.toThrow('Invalid notification type');
      expect(mockNotificationRepository.save).not.toHaveBeenCalled();
    });

    // Debería lanzar error para mensaje vacío
    it('should throw error for empty message', async () => {
      // Arrange
      const dto = { ...validCreateDto, message: '' };

      // Act & Assert
      await expect(useCase.execute(dto)).rejects.toThrow(ValidationError);
      await expect(useCase.execute(dto)).rejects.toThrow('Notification message is required');
      expect(mockNotificationRepository.save).not.toHaveBeenCalled();
    });

    // Debería lanzar error para mensaje solo con espacios
    it('should throw error for whitespace-only message', async () => {
      // Arrange
      const dto = { ...validCreateDto, message: '   ' };

      // Act & Assert
      await expect(useCase.execute(dto)).rejects.toThrow(ValidationError);
      expect(mockNotificationRepository.save).not.toHaveBeenCalled();
    });

    // Debería lanzar error para mensaje demasiado largo
    it('should throw error for message too long', async () => {
      // Arrange
      const dto = { ...validCreateDto, message: 'A'.repeat(1001) };

      // Act & Assert
      await expect(useCase.execute(dto)).rejects.toThrow(ValidationError);
      await expect(useCase.execute(dto)).rejects.toThrow('Notification message is too long');
      expect(mockNotificationRepository.save).not.toHaveBeenCalled();
    });

    // Debería lanzar error para userId vacío
    it('should throw error for empty userId', async () => {
      // Arrange
      const dto = { ...validCreateDto, userId: '' };

      // Act & Assert
      await expect(useCase.execute(dto)).rejects.toThrow(ValidationError);
      await expect(useCase.execute(dto)).rejects.toThrow('User ID is required');
      expect(mockNotificationRepository.save).not.toHaveBeenCalled();
    });

    // Debería lanzar error para userId con formato UUID inválido
    it('should throw error for invalid UUID format userId', async () => {
      // Arrange
      const dto = { ...validCreateDto, userId: 'invalid-uuid' };

      // Act & Assert
      await expect(useCase.execute(dto)).rejects.toThrow(ValidationError);
      await expect(useCase.execute(dto)).rejects.toThrow('User ID must be a valid UUID');
      expect(mockNotificationRepository.save).not.toHaveBeenCalled();
    });

    // Debería aceptar mensaje con exactamente 1000 caracteres
    it('should accept message with exactly 1000 characters', async () => {
      // Arrange
      const dto = { ...validCreateDto, message: 'A'.repeat(1000) };
      mockNotificationStatusRepository.findByName.mockResolvedValue(mockPendingStatus);
      mockNotificationRepository.save.mockImplementation(async (notification) => notification);

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.message).toBe(dto.message);
    });
  });

  describe('Status Not Found', () => {
    // Debería lanzar NotFoundError si estado PENDING no existe
    it('should throw NotFoundError if PENDING status does not exist', async () => {
      // Arrange
      mockNotificationStatusRepository.findByName.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(validCreateDto)).rejects.toThrow(NotFoundError);
      expect(mockNotificationRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    // Debería propagar errores del repository
    it('should propagate repository errors', async () => {
      // Arrange
      mockNotificationStatusRepository.findByName.mockResolvedValue(mockPendingStatus);
      mockNotificationRepository.save.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(useCase.execute(validCreateDto)).rejects.toThrow('Database error');
    });

    // Debería propagar errores del status repository
    it('should propagate status repository errors', async () => {
      // Arrange
      mockNotificationStatusRepository.findByName.mockRejectedValue(new Error('Status fetch error'));

      // Act & Assert
      await expect(useCase.execute(validCreateDto)).rejects.toThrow('Status fetch error');
      expect(mockNotificationRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('Repository Integration', () => {
    // Debería llamar al status repository primero
    it('should call status repository first', async () => {
      // Arrange
      const callOrder: string[] = [];
      mockNotificationStatusRepository.findByName.mockImplementation(async () => {
        callOrder.push('findByName');
        return mockPendingStatus;
      });
      mockNotificationRepository.save.mockImplementation(async (notification) => {
        callOrder.push('save');
        return notification;
      });

      // Act
      await useCase.execute(validCreateDto);

      // Assert
      expect(callOrder[0]).toBe('findByName');
      expect(callOrder[1]).toBe('save');
    });

    // Debería llamar save con entidad Notification
    it('should call save with Notification entity', async () => {
      // Arrange
      mockNotificationStatusRepository.findByName.mockResolvedValue(mockPendingStatus);
      mockNotificationRepository.save.mockImplementation(async (notification) => notification);

      // Act
      await useCase.execute(validCreateDto);

      // Assert
      expect(mockNotificationRepository.save).toHaveBeenCalledTimes(1);
      const savedNotification = mockNotificationRepository.save.mock.calls[0][0];
      expect(savedNotification).toBeInstanceOf(Notification);
      expect(savedNotification.type).toBe(validCreateDto.type);
      expect(savedNotification.message).toBe(validCreateDto.message);
      expect(savedNotification.userId).toBe(validCreateDto.userId);
      expect(savedNotification.statusId).toBe(validStatusId);
    });
  });
});
