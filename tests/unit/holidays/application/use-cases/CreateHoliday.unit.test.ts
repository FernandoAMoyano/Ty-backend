import { CreateHoliday } from '../../../../../src/modules/holidays/application/use-cases/CreateHoliday';
import { IHolidayRepository } from '../../../../../src/modules/holidays/domain/repositories/IHolidayRepository';
import { Holiday } from '../../../../../src/modules/holidays/domain/entities/Holiday';

describe('CreateHoliday Use Case', () => {
  let createHoliday: CreateHoliday;
  let mockHolidayRepository: jest.Mocked<IHolidayRepository>;

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

    createHoliday = new CreateHoliday(mockHolidayRepository);
  });

  // Debería crear un feriado exitosamente
  it('should create a holiday successfully', async () => {
    const dto = {
      name: 'Navidad',
      date: '2025-12-25',
      description: 'Día de Navidad',
    };

    mockHolidayRepository.existsByDate.mockResolvedValue(false);
    mockHolidayRepository.save.mockImplementation(async (holiday: Holiday) => holiday);

    const result = await createHoliday.execute(dto);

    expect(result.name).toBe('Navidad');
    expect(result.description).toBe('Día de Navidad');
    expect(mockHolidayRepository.existsByDate).toHaveBeenCalledTimes(1);
    expect(mockHolidayRepository.save).toHaveBeenCalledTimes(1);
  });

  // Debería crear un feriado sin descripción
  it('should create a holiday without description', async () => {
    const dto = {
      name: 'Año Nuevo',
      date: '2025-01-01',
    };

    mockHolidayRepository.existsByDate.mockResolvedValue(false);
    mockHolidayRepository.save.mockImplementation(async (holiday: Holiday) => holiday);

    const result = await createHoliday.execute(dto);

    expect(result.name).toBe('Año Nuevo');
    expect(result.description).toBeNull();
  });

  // Debería lanzar error si ya existe un feriado en la fecha
  it('should throw error if holiday already exists on date', async () => {
    const dto = {
      name: 'Navidad',
      date: '2025-12-25',
    };

    mockHolidayRepository.existsByDate.mockResolvedValue(true);

    await expect(createHoliday.execute(dto)).rejects.toThrow(
      'Ya existe un feriado en la fecha especificada',
    );
    expect(mockHolidayRepository.save).not.toHaveBeenCalled();
  });

  // Debería generar un ID único para el feriado
  it('should generate a unique ID for the holiday', async () => {
    const dto = {
      name: 'Navidad',
      date: '2025-12-25',
    };

    mockHolidayRepository.existsByDate.mockResolvedValue(false);
    mockHolidayRepository.save.mockImplementation(async (holiday: Holiday) => holiday);

    const result = await createHoliday.execute(dto);

    expect(result.id).toBeDefined();
    expect(result.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  // Debería establecer createdAt y updatedAt
  it('should set createdAt and updatedAt', async () => {
    const dto = {
      name: 'Navidad',
      date: '2025-12-25',
    };

    mockHolidayRepository.existsByDate.mockResolvedValue(false);
    mockHolidayRepository.save.mockImplementation(async (holiday: Holiday) => holiday);

    const result = await createHoliday.execute(dto);

    expect(result.createdAt).toBeDefined();
    expect(result.updatedAt).toBeDefined();
  });
});
