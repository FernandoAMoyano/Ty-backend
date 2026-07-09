import { GetScheduleExceptionsByHoliday } from '../../../../../src/modules/holidays/application/use-cases/GetScheduleExceptionsByHoliday';
import { IScheduleExceptionRepository } from '../../../../../src/modules/holidays/domain/repositories/IScheduleExceptionRepository';
import { IHolidayRepository } from '../../../../../src/modules/holidays/domain/repositories/IHolidayRepository';
import { ScheduleException } from '../../../../../src/modules/holidays/domain/entities/ScheduleException';
import { Holiday } from '../../../../../src/modules/holidays/domain/entities/Holiday';
import { NotFoundError } from '../../../../../src/shared/exceptions/NotFoundError';

describe('GetScheduleExceptionsByHoliday Use Case', () => {
  let getScheduleExceptionsByHoliday: GetScheduleExceptionsByHoliday;
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

  const mockException = new ScheduleException({
    id: '123e4567-e89b-12d3-a456-426614174000',
    exceptionDate: new Date('2025-12-25'),
    startTimeException: '09:00',
    endTimeException: '14:00',
    reason: 'Horario reducido por feriado',
    holidayId: mockHoliday.id,
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

    getScheduleExceptionsByHoliday = new GetScheduleExceptionsByHoliday(
      mockScheduleExceptionRepository,
      mockHolidayRepository,
    );
  });

  // Debería retornar las excepciones asociadas a un feriado existente
  it('should return exceptions for an existing holiday', async () => {
    mockHolidayRepository.findById.mockResolvedValue(mockHoliday);
    mockScheduleExceptionRepository.findByHolidayId.mockResolvedValue([mockException]);

    const result = await getScheduleExceptionsByHoliday.execute(mockHoliday.id);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(mockException.id);
    expect(mockScheduleExceptionRepository.findByHolidayId).toHaveBeenCalledWith(mockHoliday.id);
  });

  // Debería lanzar NotFoundError (404) si el feriado no existe, no un Error genérico (500)
  it('should throw NotFoundError if holiday does not exist', async () => {
    mockHolidayRepository.findById.mockResolvedValue(null);

    await expect(
      getScheduleExceptionsByHoliday.execute('non-existent-id'),
    ).rejects.toThrow(NotFoundError);

    await expect(
      getScheduleExceptionsByHoliday.execute('non-existent-id'),
    ).rejects.toThrow('Holiday not found: non-existent-id');

    expect(mockScheduleExceptionRepository.findByHolidayId).not.toHaveBeenCalled();
  });
});
