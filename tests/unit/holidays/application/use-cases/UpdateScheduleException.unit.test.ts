import { UpdateScheduleException } from '../../../../../src/modules/holidays/application/use-cases/UpdateScheduleException';
import { IScheduleExceptionRepository } from '../../../../../src/modules/holidays/domain/repositories/IScheduleExceptionRepository';
import { IHolidayRepository } from '../../../../../src/modules/holidays/domain/repositories/IHolidayRepository';
import { ScheduleException } from '../../../../../src/modules/holidays/domain/entities/ScheduleException';
import { Holiday } from '../../../../../src/modules/holidays/domain/entities/Holiday';

describe('UpdateScheduleException Use Case', () => {
  let updateScheduleException: UpdateScheduleException;
  let mockScheduleExceptionRepository: jest.Mocked<IScheduleExceptionRepository>;
  let mockHolidayRepository: jest.Mocked<IHolidayRepository>;

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

  const mockHoliday = new Holiday({
    id: '123e4567-e89b-12d3-a456-426614174001',
    name: 'Navidad',
    date: new Date('2025-12-25'),
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    mockScheduleExceptionRepository = {
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

    mockHolidayRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByYear: jest.fn(),
      findByDate: jest.fn(),
      findAll: jest.fn(),
      findByDateRange: jest.fn(),
      findUpcoming: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsByDate: jest.fn(),
      isHoliday: jest.fn(),
    };

    updateScheduleException = new UpdateScheduleException(
      mockScheduleExceptionRepository,
      mockHolidayRepository,
    );
  });

  // Debería actualizar los horarios de la excepción
  it('should update exception times', async () => {
    mockScheduleExceptionRepository.findById.mockResolvedValue(mockException);
    mockScheduleExceptionRepository.update.mockImplementation(
      async (exception: ScheduleException) => exception,
    );

    const result = await updateScheduleException.execute(
      '123e4567-e89b-12d3-a456-426614174000',
      {
        startTimeException: '10:00',
        endTimeException: '16:00',
      },
    );

    expect(result.startTimeException).toBe('10:00');
    expect(result.endTimeException).toBe('16:00');
  });

  // Debería actualizar la fecha de la excepción
  it('should update exception date', async () => {
    mockScheduleExceptionRepository.findById.mockResolvedValue(mockException);
    mockScheduleExceptionRepository.existsByDate.mockResolvedValue(false);
    mockScheduleExceptionRepository.update.mockImplementation(
      async (exception: ScheduleException) => exception,
    );

    await updateScheduleException.execute('123e4567-e89b-12d3-a456-426614174000', {
      exceptionDate: '2025-12-26',
    });

    expect(mockScheduleExceptionRepository.existsByDate).toHaveBeenCalled();
    expect(mockScheduleExceptionRepository.update).toHaveBeenCalledTimes(1);
  });

  // Debería lanzar error si la nueva fecha ya tiene una excepción
  it('should throw error if new date already has an exception', async () => {
    mockScheduleExceptionRepository.findById.mockResolvedValue(mockException);
    mockScheduleExceptionRepository.existsByDate.mockResolvedValue(true);

    await expect(
      updateScheduleException.execute('123e4567-e89b-12d3-a456-426614174000', {
        exceptionDate: '2025-12-26',
      }),
    ).rejects.toThrow('Ya existe una excepción de horario en la fecha especificada');
  });

  // Debería asociar la excepción a un feriado
  it('should associate exception to a holiday', async () => {
    mockScheduleExceptionRepository.findById.mockResolvedValue(mockException);
    mockHolidayRepository.findById.mockResolvedValue(mockHoliday);
    mockScheduleExceptionRepository.update.mockImplementation(
      async (exception: ScheduleException) => exception,
    );

    const result = await updateScheduleException.execute(
      '123e4567-e89b-12d3-a456-426614174000',
      {
        holidayId: '123e4567-e89b-12d3-a456-426614174001',
      },
    );

    expect(result.holidayId).toBe('123e4567-e89b-12d3-a456-426614174001');
  });

  // Debería desasociar la excepción de un feriado
  it('should disassociate exception from a holiday', async () => {
    const exceptionWithHoliday = new ScheduleException({
      ...mockException.toObject(),
      holidayId: '123e4567-e89b-12d3-a456-426614174001',
    });

    mockScheduleExceptionRepository.findById.mockResolvedValue(exceptionWithHoliday);
    mockScheduleExceptionRepository.update.mockImplementation(
      async (exception: ScheduleException) => exception,
    );

    const result = await updateScheduleException.execute(
      '123e4567-e89b-12d3-a456-426614174000',
      {
        holidayId: null,
      },
    );

    expect(result.holidayId).toBeNull();
  });

  // Debería lanzar error si el feriado no existe
  it('should throw error if holiday does not exist', async () => {
    mockScheduleExceptionRepository.findById.mockResolvedValue(mockException);
    mockHolidayRepository.findById.mockResolvedValue(null);

    await expect(
      updateScheduleException.execute('123e4567-e89b-12d3-a456-426614174000', {
        holidayId: 'non-existent-id',
      }),
    ).rejects.toThrow('El feriado especificado no existe');
  });

  // Debería lanzar error si la excepción no existe
  it('should throw error if exception not found', async () => {
    mockScheduleExceptionRepository.findById.mockResolvedValue(null);

    await expect(
      updateScheduleException.execute('non-existent-id', {
        reason: 'Nueva razón',
      }),
    ).rejects.toThrow('Excepción de horario no encontrada');
  });

  // Debería actualizar la razón
  it('should update reason', async () => {
    mockScheduleExceptionRepository.findById.mockResolvedValue(mockException);
    mockScheduleExceptionRepository.update.mockImplementation(
      async (exception: ScheduleException) => exception,
    );

    const result = await updateScheduleException.execute(
      '123e4567-e89b-12d3-a456-426614174000',
      {
        reason: 'Nueva razón',
      },
    );

    expect(result.reason).toBe('Nueva razón');
  });
});
