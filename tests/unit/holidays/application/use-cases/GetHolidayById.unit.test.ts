import { GetHolidayById } from '../../../../../src/modules/holidays/application/use-cases/GetHolidayById';
import { IHolidayRepository } from '../../../../../src/modules/holidays/domain/repositories/IHolidayRepository';
import { Holiday } from '../../../../../src/modules/holidays/domain/entities/Holiday';

describe('GetHolidayById Use Case', () => {
  let getHolidayById: GetHolidayById;
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

    getHolidayById = new GetHolidayById(mockHolidayRepository);
  });

  // Debería retornar un feriado por ID
  it('should return a holiday by ID', async () => {
    mockHolidayRepository.findById.mockResolvedValue(mockHoliday);

    const result = await getHolidayById.execute('123e4567-e89b-12d3-a456-426614174000');

    expect(result.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(result.name).toBe('Navidad');
    expect(mockHolidayRepository.findById).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
  });

  // Debería lanzar error si el feriado no existe
  it('should throw error if holiday not found', async () => {
    mockHolidayRepository.findById.mockResolvedValue(null);

    await expect(
      getHolidayById.execute('non-existent-id'),
    ).rejects.toThrow('Feriado no encontrado');
  });

  // Debería llamar al repositorio con el ID correcto
  it('should call repository with correct ID', async () => {
    const holidayId = '123e4567-e89b-12d3-a456-426614174000';
    mockHolidayRepository.findById.mockResolvedValue(mockHoliday);

    await getHolidayById.execute(holidayId);

    expect(mockHolidayRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockHolidayRepository.findById).toHaveBeenCalledWith(holidayId);
  });
});
