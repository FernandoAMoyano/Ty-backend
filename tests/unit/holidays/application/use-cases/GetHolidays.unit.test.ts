import { GetHolidays } from '../../../../../src/modules/holidays/application/use-cases/GetHolidays';
import { IHolidayRepository } from '../../../../../src/modules/holidays/domain/repositories/IHolidayRepository';
import { Holiday } from '../../../../../src/modules/holidays/domain/entities/Holiday';

describe('GetHolidays Use Case', () => {
  let getHolidays: GetHolidays;
  let mockHolidayRepository: jest.Mocked<IHolidayRepository>;

  const mockHolidays = [
    new Holiday({
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Navidad',
      date: new Date('2025-12-25'),
      description: 'Día de Navidad',
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    new Holiday({
      id: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Año Nuevo',
      date: new Date('2025-01-01'),
      description: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  ];

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

    getHolidays = new GetHolidays(mockHolidayRepository);
  });

  // Debería retornar todos los feriados paginados
  it('should return all holidays paginated', async () => {
    mockHolidayRepository.findAll.mockResolvedValue({
      data: mockHolidays,
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });

    const result = await getHolidays.execute({});

    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
  });

  // Debería aplicar filtros correctamente
  it('should apply filters correctly', async () => {
    mockHolidayRepository.findAll.mockResolvedValue({
      data: [mockHolidays[0]],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });

    const filters = {
      year: 2025,
      month: 12,
      name: 'Navidad',
    };

    await getHolidays.execute(filters);

    expect(mockHolidayRepository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        year: 2025,
        month: 12,
        name: 'Navidad',
      }),
      expect.any(Object),
    );
  });

  // Debería usar paginación por defecto
  it('should use default pagination', async () => {
    mockHolidayRepository.findAll.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    });

    await getHolidays.execute({});

    expect(mockHolidayRepository.findAll).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        page: 1,
        limit: 10,
      }),
    );
  });

  // Debería respetar paginación personalizada
  it('should respect custom pagination', async () => {
    mockHolidayRepository.findAll.mockResolvedValue({
      data: [],
      total: 0,
      page: 2,
      limit: 5,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: true,
    });

    await getHolidays.execute({ page: 2, limit: 5 });

    expect(mockHolidayRepository.findAll).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        page: 2,
        limit: 5,
      }),
    );
  });
});
