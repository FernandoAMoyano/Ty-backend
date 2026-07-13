import { MarkAllNotificationsAsRead } from '../../../../../src/modules/notifications/application/use-cases/MarkAllNotificationsAsRead';
import { INotificationRepository } from '../../../../../src/modules/notifications/domain/repositories/INotificationRepository';
import { INotificationStatusRepository } from '../../../../../src/modules/notifications/domain/repositories/INotificationStatusRepository';
import { NotificationStatus, NotificationStatusEnum } from '../../../../../src/modules/notifications/domain/entities/NotificationStatus';
import { ValidationError } from '../../../../../src/shared/exceptions/ValidationError';
import { NotFoundError } from '../../../../../src/shared/exceptions/NotFoundError';
import { generateUuid } from '../../../../../src/shared/utils/uuid';

describe('MarkAllNotificationsAsRead Use Case (F10)', () => {
  let useCase: MarkAllNotificationsAsRead;
  let mockNotificationRepository: jest.Mocked<INotificationRepository>;
  let mockNotificationStatusRepository: jest.Mocked<INotificationStatusRepository>;

  const validUserId = generateUuid();
  const readStatusId = generateUuid();

  const mockReadStatus = NotificationStatus.fromPersistence(
    readStatusId,
    NotificationStatusEnum.READ,
    'Notificación leída',
  );

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
      findByUserIdFiltered: jest.fn(),
      countByUserIdFiltered: jest.fn(),
      updateStatusByUserId: jest.fn(),
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

    useCase = new MarkAllNotificationsAsRead(
      mockNotificationRepository,
      mockNotificationStatusRepository,
    );
  });

  // Debería marcar todas las notificaciones del usuario como leídas y devolver el conteo
  it('should mark all notifications as read and return the updated count', async () => {
    mockNotificationStatusRepository.findByName.mockResolvedValue(mockReadStatus);
    mockNotificationRepository.updateStatusByUserId.mockResolvedValue(5);

    const result = await useCase.execute(validUserId);

    expect(result).toEqual({ updatedCount: 5 });
    expect(mockNotificationRepository.updateStatusByUserId).toHaveBeenCalledWith(
      validUserId,
      readStatusId,
      readStatusId,
    );
  });

  // Debería funcionar sin límite de cantidad (a diferencia del enfoque anterior con limit: 1000)
  it('should not cap the updated count at 1000', async () => {
    mockNotificationStatusRepository.findByName.mockResolvedValue(mockReadStatus);
    mockNotificationRepository.updateStatusByUserId.mockResolvedValue(1500);

    const result = await useCase.execute(validUserId);

    expect(result.updatedCount).toBe(1500);
  });

  // Debería devolver updatedCount 0 si el usuario no tiene notificaciones sin leer
  it('should return updatedCount 0 when the user has no unread notifications', async () => {
    mockNotificationStatusRepository.findByName.mockResolvedValue(mockReadStatus);
    mockNotificationRepository.updateStatusByUserId.mockResolvedValue(0);

    const result = await useCase.execute(validUserId);

    expect(result).toEqual({ updatedCount: 0 });
  });

  // Debería lanzar NotFoundError (404) si el estado READ no existe, no un Error genérico
  it('should throw NotFoundError if READ status does not exist', async () => {
    mockNotificationStatusRepository.findByName.mockResolvedValue(null);

    await expect(useCase.execute(validUserId)).rejects.toThrow(NotFoundError);
    expect(mockNotificationRepository.updateStatusByUserId).not.toHaveBeenCalled();
  });

  // Debería lanzar ValidationError si el requesterId está vacío
  it('should throw ValidationError if requesterId is empty', async () => {
    await expect(useCase.execute('')).rejects.toThrow(ValidationError);
    expect(mockNotificationStatusRepository.findByName).not.toHaveBeenCalled();
  });

  // Debería lanzar ValidationError si el requesterId no es un UUID válido
  it('should throw ValidationError if requesterId is not a valid UUID', async () => {
    await expect(useCase.execute('not-a-uuid')).rejects.toThrow(ValidationError);
    expect(mockNotificationStatusRepository.findByName).not.toHaveBeenCalled();
  });
});
