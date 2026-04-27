import { UpdateHoliday } from '../../../../../src/modules/holidays/application/use-cases/UpdateHoliday';
import { IHolidayRepository } from '../../../../../src/modules/holidays/domain/repositories/IHolidayRepository';
import { Holiday } from '../../../../../src/modules/holidays/domain/entities/Holiday';

describe('UpdateHoliday Use Case', () => {
  let updateHoliday: UpdateHoliday;
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

    updateHoliday = new UpdateHoliday(mockHolidayRepository);
  });

  // Debería actualizar el nombre del feriado
  it('should update holiday name', async () => {
    mockHolidayRepository.findById.mockResolvedValue(mockHoliday);
    mockHolidayRepository.update.mockImplementation(async (holiday: Holiday) => holiday);

    const result = await updateHoliday.execute('123e4567-e89b-12d3-a456-426614174000', {
      name: 'Nochebuena',
    });

    expect(result.name).toBe('Nochebuena');
    expect(mockHolidayRepository.update).toHaveBeenCalledTimes(1);
  });

  // Debería actualizar la fecha del feriado
  it('should update holiday date', async () => {
    mockHolidayRepository.findById.mockResolvedValue(mockHoliday);
    mockHolidayRepository.existsByDate.mockResolvedValue(false);
    mockHolidayRepository.update.mockImplementation(async (holiday: Holiday) => holiday);

    await updateHoliday.execute('123e4567-e89b-12d3-a456-426614174000', {
      date: '2025-12-24',
    });

    expect(mockHolidayRepository.existsByDate).toHaveBeenCalled();
    expect(mockHolidayRepository.update).toHaveBeenCalledTimes(1);
  });

  // Debería lanzar error si la nueva fecha ya tiene un feriado
  it('should throw error if new date already has a holiday', async () => {
    mockHolidayRepository.findById.mockResolvedValue(mockHoliday);
    mockHolidayRepository.existsByDate.mockResolvedValue(true);

    await expect(
      updateHoliday.execute('123e4567-e89b-12d3-a456-426614174000', {
        date: '2025-12-24',
      }),
    ).rejects.toThrow('Ya existe un feriado en la fecha especificada');
  });

  // Debería actualizar la descripción del feriado
  it('should update holiday description', async () => {
    mockHolidayRepository.findById.mockResolvedValue(mockHoliday);
    mockHolidayRepository.update.mockImplementation(async (holiday: Holiday) => holiday);

    const result = await updateHoliday.execute('123e4567-e89b-12d3-a456-426614174000', {
      description: 'Nueva descripción',
    });

    expect(result.description).toBe('Nueva descripción');
  });

  // Debería permitir eliminar la descripción
  it('should allow removing description', async () => {
    mockHolidayRepository.findById.mockResolvedValue(mockHoliday);
    mockHolidayRepository.update.mockImplementation(async (holiday: Holiday) => holiday);

    const result = await updateHoliday.execute('123e4567-e89b-12d3-a456-426614174000', {
      description: null,
    });

    expect(result.description).toBeNull();
  });

  // Debería lanzar error si el feriado no existe
  it('should throw error if holiday not found', async () => {
    mockHolidayRepository.findById.mockResolvedValue(null);

    await expect(
      updateHoliday.execute('non-existent-id', { name: 'Test' }),
    ).rejects.toThrow('Feriado no encontrado');
  });

  // Debería actualizar múltiples campos a la vez
  it('should update multiple fields at once', async () => {
    mockHolidayRepository.findById.mockResolvedValue(mockHoliday);
    mockHolidayRepository.existsByDate.mockResolvedValue(false);
    mockHolidayRepository.update.mockImplementation(async (holiday: Holiday) => holiday);

    const result = await updateHoliday.execute('123e4567-e89b-12d3-a456-426614174000', {
      name: 'Nuevo nombre',
      date: '2025-12-26',
      description: 'Nueva descripción',
    });

    expect(result.name).toBe('Nuevo nombre');
    expect(result.description).toBe('Nueva descripción');
  });
});
