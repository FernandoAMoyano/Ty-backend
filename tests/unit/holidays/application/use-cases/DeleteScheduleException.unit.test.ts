import { DeleteScheduleException } from '../../../../../src/modules/holidays/application/use-cases/DeleteScheduleException';
import { IScheduleExceptionRepository } from '../../../../../src/modules/holidays/domain/repositories/IScheduleExceptionRepository';
import { ScheduleException } from '../../../../../src/modules/holidays/domain/entities/ScheduleException';

describe('DeleteScheduleException Use Case', () => {
  let deleteScheduleException: DeleteScheduleException;
  let mockRepository: jest.Mocked<IScheduleExceptionRepository>;

  const mockException = new ScheduleException({
    id: '123e4567-e89b-12d3-a456-426614174000',
    exceptionDate: new Date('2025-12-24'),
    startTimeException: '09:00',
    endTimeException: '14:00',
    reason: 'Horario reducido',
    holidayId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByDate: jest.fn(),
      findByHolidayId: jest.fn(),
      findAll: jest.fn(),
      findByDateRange: jest.fn(),
      findUpcoming: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteByHolidayId: jest.fn(),
      existsByDate: jest.fn(),
      getExceptionForDate: jest.fn(),
    };

    deleteScheduleException = new DeleteScheduleException(mockRepository);
  });

  // Debería eliminar una excepción exitosamente
  it('should delete an exception successfully', async () => {
    mockRepository.findById.mockResolvedValue(mockException);
    mockRepository.delete.mockResolvedValue(true);

    const result = await deleteScheduleException.execute(
      '123e4567-e89b-12d3-a456-426614174000',
    );

    expect(result).toBe(true);
    expect(mockRepository.delete).toHaveBeenCalledWith(
      '123e4567-e89b-12d3-a456-426614174000',
    );
  });

  // Debería lanzar error si la excepción no existe
  it('should throw error if exception not found', async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(
      deleteScheduleException.execute('non-existent-id'),
    ).rejects.toThrow('Excepción de horario no encontrada');
    expect(mockRepository.delete).not.toHaveBeenCalled();
  });

  // Debería llamar al repositorio con el ID correcto
  it('should call repository with correct ID', async () => {
    const exceptionId = '123e4567-e89b-12d3-a456-426614174000';
    mockRepository.findById.mockResolvedValue(mockException);
    mockRepository.delete.mockResolvedValue(true);

    await deleteScheduleException.execute(exceptionId);

    expect(mockRepository.findById).toHaveBeenCalledWith(exceptionId);
    expect(mockRepository.delete).toHaveBeenCalledWith(exceptionId);
  });
});
