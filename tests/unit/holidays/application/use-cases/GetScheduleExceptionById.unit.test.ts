import { GetScheduleExceptionById } from '../../../../../src/modules/holidays/application/use-cases/GetScheduleExceptionById';
import { IScheduleExceptionRepository } from '../../../../../src/modules/holidays/domain/repositories/IScheduleExceptionRepository';
import { ScheduleException } from '../../../../../src/modules/holidays/domain/entities/ScheduleException';

describe('GetScheduleExceptionById Use Case', () => {
  let getScheduleExceptionById: GetScheduleExceptionById;
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

    getScheduleExceptionById = new GetScheduleExceptionById(mockRepository);
  });

  // Debería retornar una excepción por ID
  it('should return an exception by ID', async () => {
    mockRepository.findById.mockResolvedValue(mockException);

    const result = await getScheduleExceptionById.execute(
      '123e4567-e89b-12d3-a456-426614174000',
    );

    expect(result.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(result.startTimeException).toBe('09:00');
    expect(result.endTimeException).toBe('14:00');
  });

  // Debería lanzar error si la excepción no existe
  it('should throw error if exception not found', async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(
      getScheduleExceptionById.execute('non-existent-id'),
    ).rejects.toThrow('Excepción de horario no encontrada');
  });

  // Debería llamar al repositorio con el ID correcto
  it('should call repository with correct ID', async () => {
    const exceptionId = '123e4567-e89b-12d3-a456-426614174000';
    mockRepository.findById.mockResolvedValue(mockException);

    await getScheduleExceptionById.execute(exceptionId);

    expect(mockRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockRepository.findById).toHaveBeenCalledWith(exceptionId);
  });
});
