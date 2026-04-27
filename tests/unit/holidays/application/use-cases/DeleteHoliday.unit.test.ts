import { DeleteHoliday } from '../../../../../src/modules/holidays/application/use-cases/DeleteHoliday';
import { IHolidayRepository } from '../../../../../src/modules/holidays/domain/repositories/IHolidayRepository';
import { IScheduleExceptionRepository } from '../../../../../src/modules/holidays/domain/repositories/IScheduleExceptionRepository';
import { Holiday } from '../../../../../src/modules/holidays/domain/entities/Holiday';

describe('DeleteHoliday Use Case', () => {
  let deleteHoliday: DeleteHoliday;
  let mockHolidayRepository: jest.Mocked<IHolidayRepository>;
  let mockScheduleExceptionRepository: jest.Mocked<IScheduleExceptionRepository>;

  const mockHoliday = new Holiday({
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Navidad',
    date: new Date('2025-12-25'),
    description: 'Día de Navidad',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
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

    deleteHoliday = new DeleteHoliday(mockHolidayRepository, mockScheduleExceptionRepository);
  });

  // Debería eliminar un feriado exitosamente
  it('should delete a holiday successfully', async () => {
    mockHolidayRepository.findById.mockResolvedValue(mockHoliday);
    mockScheduleExceptionRepository.deleteByHolidayId.mockResolvedValue(0);
    mockHolidayRepository.delete.mockResolvedValue(true);

    const result = await deleteHoliday.execute('123e4567-e89b-12d3-a456-426614174000');

    expect(result).toBe(true);
    expect(mockHolidayRepository.delete).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
  });

  // Debería eliminar excepciones asociadas antes de eliminar el feriado
  it('should delete associated exceptions before deleting holiday', async () => {
    mockHolidayRepository.findById.mockResolvedValue(mockHoliday);
    mockScheduleExceptionRepository.deleteByHolidayId.mockResolvedValue(2);
    mockHolidayRepository.delete.mockResolvedValue(true);

    await deleteHoliday.execute('123e4567-e89b-12d3-a456-426614174000');

    expect(mockScheduleExceptionRepository.deleteByHolidayId).toHaveBeenCalledWith(
      '123e4567-e89b-12d3-a456-426614174000',
    );
    expect(mockScheduleExceptionRepository.deleteByHolidayId).toHaveBeenCalledBefore(
      mockHolidayRepository.delete as jest.Mock,
    );
  });

  // Debería lanzar error si el feriado no existe
  it('should throw error if holiday not found', async () => {
    mockHolidayRepository.findById.mockResolvedValue(null);

    await expect(deleteHoliday.execute('non-existent-id')).rejects.toThrow(
      'Feriado no encontrado',
    );
    expect(mockHolidayRepository.delete).not.toHaveBeenCalled();
  });

  // Debería llamar al repositorio con el ID correcto
  it('should call repository with correct ID', async () => {
    const holidayId = '123e4567-e89b-12d3-a456-426614174000';
    mockHolidayRepository.findById.mockResolvedValue(mockHoliday);
    mockScheduleExceptionRepository.deleteByHolidayId.mockResolvedValue(0);
    mockHolidayRepository.delete.mockResolvedValue(true);

    await deleteHoliday.execute(holidayId);

    expect(mockHolidayRepository.findById).toHaveBeenCalledWith(holidayId);
    expect(mockHolidayRepository.delete).toHaveBeenCalledWith(holidayId);
  });
});
