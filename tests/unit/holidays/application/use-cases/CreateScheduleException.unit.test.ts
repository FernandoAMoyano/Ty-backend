import { CreateScheduleException } from '../../../../../src/modules/holidays/application/use-cases/CreateScheduleException';
import { IScheduleExceptionRepository } from '../../../../../src/modules/holidays/domain/repositories/IScheduleExceptionRepository';
import { IHolidayRepository } from '../../../../../src/modules/holidays/domain/repositories/IHolidayRepository';
import { ScheduleException } from '../../../../../src/modules/holidays/domain/entities/ScheduleException';
import { Holiday } from '../../../../../src/modules/holidays/domain/entities/Holiday';

describe('CreateScheduleException Use Case', () => {
  let createScheduleException: CreateScheduleException;
  let mockScheduleExceptionRepository: jest.Mocked<IScheduleExceptionRepository>;
  let mockHolidayRepository: jest.Mocked<IHolidayRepository>;

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

    createScheduleException = new CreateScheduleException(
      mockScheduleExceptionRepository,
      mockHolidayRepository,
    );
  });

  // Debería crear una excepción exitosamente
  it('should create a schedule exception successfully', async () => {
    const dto = {
      exceptionDate: '2025-12-24',
      startTimeException: '09:00',
      endTimeException: '14:00',
      reason: 'Horario reducido de Nochebuena',
    };

    mockScheduleExceptionRepository.existsByDate.mockResolvedValue(false);
    mockScheduleExceptionRepository.save.mockImplementation(
      async (exception: ScheduleException) => exception,
    );

    const result = await createScheduleException.execute(dto);

    expect(result.startTimeException).toBe('09:00');
    expect(result.endTimeException).toBe('14:00');
    expect(result.reason).toBe('Horario reducido de Nochebuena');
    expect(mockScheduleExceptionRepository.save).toHaveBeenCalledTimes(1);
  });

  // Debería crear una excepción asociada a un feriado
  it('should create an exception associated with a holiday', async () => {
    const dto = {
      exceptionDate: '2025-12-25',
      startTimeException: '09:00',
      endTimeException: '14:00',
      holidayId: '123e4567-e89b-12d3-a456-426614174001',
    };

    mockScheduleExceptionRepository.existsByDate.mockResolvedValue(false);
    mockHolidayRepository.findById.mockResolvedValue(mockHoliday);
    mockScheduleExceptionRepository.save.mockImplementation(
      async (exception: ScheduleException) => exception,
    );

    const result = await createScheduleException.execute(dto);

    expect(result.holidayId).toBe('123e4567-e89b-12d3-a456-426614174001');
    expect(mockHolidayRepository.findById).toHaveBeenCalledWith(
      '123e4567-e89b-12d3-a456-426614174001',
    );
  });

  // Debería lanzar error si ya existe una excepción en la fecha
  it('should throw error if exception already exists on date', async () => {
    const dto = {
      exceptionDate: '2025-12-24',
      startTimeException: '09:00',
      endTimeException: '14:00',
    };

    mockScheduleExceptionRepository.existsByDate.mockResolvedValue(true);

    await expect(createScheduleException.execute(dto)).rejects.toThrow(
      'Ya existe una excepción de horario en la fecha especificada',
    );
    expect(mockScheduleExceptionRepository.save).not.toHaveBeenCalled();
  });

  // Debería lanzar error si el feriado no existe
  it('should throw error if holiday does not exist', async () => {
    const dto = {
      exceptionDate: '2025-12-25',
      startTimeException: '09:00',
      endTimeException: '14:00',
      holidayId: 'non-existent-id',
    };

    mockScheduleExceptionRepository.existsByDate.mockResolvedValue(false);
    mockHolidayRepository.findById.mockResolvedValue(null);

    await expect(createScheduleException.execute(dto)).rejects.toThrow(
      'El feriado especificado no existe',
    );
    expect(mockScheduleExceptionRepository.save).not.toHaveBeenCalled();
  });

  // Debería generar un ID único
  it('should generate a unique ID', async () => {
    const dto = {
      exceptionDate: '2025-12-24',
      startTimeException: '09:00',
      endTimeException: '14:00',
    };

    mockScheduleExceptionRepository.existsByDate.mockResolvedValue(false);
    mockScheduleExceptionRepository.save.mockImplementation(
      async (exception: ScheduleException) => exception,
    );

    const result = await createScheduleException.execute(dto);

    expect(result.id).toBeDefined();
    expect(result.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });
});
