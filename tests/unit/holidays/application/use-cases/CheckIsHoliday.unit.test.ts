import { CheckIsHoliday } from '../../../../../src/modules/holidays/application/use-cases/CheckIsHoliday';
import { IHolidayRepository } from '../../../../../src/modules/holidays/domain/repositories/IHolidayRepository';
import { Holiday } from '../../../../../src/modules/holidays/domain/entities/Holiday';

describe('CheckIsHoliday Use Case', () => {
  let checkIsHoliday: CheckIsHoliday;
  let mockHolidayRepository: jest.Mocked<IHolidayRepository>;

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

    checkIsHoliday = new CheckIsHoliday(mockHolidayRepository);
  });

  // Debería retornar true y el feriado cuando la fecha es feriado
  it('should return true and holiday when date is a holiday', async () => {
    mockHolidayRepository.findByDate.mockResolvedValue(mockHoliday);

    const result = await checkIsHoliday.execute('2025-12-25');

    expect(result.isHoliday).toBe(true);
    expect(result.holiday).toBeDefined();
    expect(result.holiday?.name).toBe('Navidad');
  });

  // Debería retornar false y null cuando la fecha no es feriado
  it('should return false and null when date is not a holiday', async () => {
    mockHolidayRepository.findByDate.mockResolvedValue(null);

    const result = await checkIsHoliday.execute('2025-12-26');

    expect(result.isHoliday).toBe(false);
    expect(result.holiday).toBeNull();
  });

  // Debería llamar al repositorio con la fecha correcta
  it('should call repository with correct date', async () => {
    mockHolidayRepository.findByDate.mockResolvedValue(null);

    await checkIsHoliday.execute('2025-12-25');

    expect(mockHolidayRepository.findByDate).toHaveBeenCalledTimes(1);
    expect(mockHolidayRepository.findByDate).toHaveBeenCalledWith(
      expect.any(Date),
    );
  });

  // Debería parsear la fecha correctamente
  it('should parse date correctly', async () => {
    mockHolidayRepository.findByDate.mockResolvedValue(mockHoliday);

    await checkIsHoliday.execute('2025-12-25');

    const calledDate = mockHolidayRepository.findByDate.mock.calls[0][0];
    expect(calledDate.getFullYear()).toBe(2025);
    expect(calledDate.getMonth()).toBe(11); // Diciembre es 11
    expect(calledDate.getDate()).toBe(25);
  });
});
