import { Holiday, HolidayProps } from '../../../../../src/modules/holidays/domain/entities/Holiday';

describe('Holiday Entity', () => {
  // Datos de prueba base
  const validHolidayProps: HolidayProps = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Navidad',
    date: new Date('2025-12-25'),
    description: 'Día de Navidad',
    createdAt: new Date('2025-01-01T10:00:00Z'),
    updatedAt: new Date('2025-01-01T10:00:00Z'),
  };

  describe('Constructor y Getters', () => {
    // Debería crear una entidad Holiday con todas las propiedades
    it('should create a Holiday entity with all properties', () => {
      const holiday = new Holiday(validHolidayProps);

      expect(holiday.id).toBe(validHolidayProps.id);
      expect(holiday.name).toBe('Navidad');
      expect(holiday.date).toEqual(validHolidayProps.date);
      expect(holiday.description).toBe('Día de Navidad');
      expect(holiday.createdAt).toEqual(validHolidayProps.createdAt);
      expect(holiday.updatedAt).toEqual(validHolidayProps.updatedAt);
    });

    // Debería crear una entidad Holiday sin descripción
    it('should create a Holiday entity without description', () => {
      const propsWithoutDescription: HolidayProps = {
        ...validHolidayProps,
        description: null,
      };

      const holiday = new Holiday(propsWithoutDescription);

      expect(holiday.description).toBeNull();
    });
  });

  describe('Propiedades computadas de fecha', () => {
    // Debería retornar el año correcto
    it('should return correct year', () => {
      const holiday = new Holiday(validHolidayProps);

      expect(holiday.year).toBe(2025);
    });

    // Debería retornar el mes correcto (1-12)
    it('should return correct month (1-12)', () => {
      const holiday = new Holiday(validHolidayProps);

      expect(holiday.month).toBe(12);
    });

    // Debería retornar el día correcto
    it('should return correct day', () => {
      const holiday = new Holiday(validHolidayProps);

      expect(holiday.day).toBe(25);
    });
  });

  describe('isOnDate', () => {
    // Debería retornar true cuando la fecha coincide
    it('should return true when date matches', () => {
      const holiday = new Holiday(validHolidayProps);

      expect(holiday.isOnDate(new Date('2025-12-25'))).toBe(true);
    });

    // Debería retornar false cuando la fecha no coincide
    it('should return false when date does not match', () => {
      const holiday = new Holiday(validHolidayProps);

      expect(holiday.isOnDate(new Date('2025-12-26'))).toBe(false);
    });

    // Debería ignorar la hora al comparar fechas
    it('should ignore time when comparing dates', () => {
      const holiday = new Holiday(validHolidayProps);

      expect(holiday.isOnDate(new Date('2025-12-25T23:59:59Z'))).toBe(true);
    });
  });

  describe('isPast, isToday, isFuture', () => {
    // Debería retornar isPast true para feriados pasados
    it('should return isPast true for past holidays', () => {
      const pastHoliday = new Holiday({
        ...validHolidayProps,
        date: new Date('2020-01-01'),
      });

      expect(pastHoliday.isPast).toBe(true);
      expect(pastHoliday.isToday).toBe(false);
      expect(pastHoliday.isFuture).toBe(false);
    });

    // Debería retornar isToday true para feriados de hoy
    it('should return isToday true for today holidays', () => {
      const today = new Date();
      const todayHoliday = new Holiday({
        ...validHolidayProps,
        date: today,
      });

      expect(todayHoliday.isPast).toBe(false);
      expect(todayHoliday.isToday).toBe(true);
      expect(todayHoliday.isFuture).toBe(false);
    });

    // Debería retornar isFuture true para feriados futuros
    it('should return isFuture true for future holidays', () => {
      const futureHoliday = new Holiday({
        ...validHolidayProps,
        date: new Date('2099-12-25'),
      });

      expect(futureHoliday.isPast).toBe(false);
      expect(futureHoliday.isToday).toBe(false);
      expect(futureHoliday.isFuture).toBe(true);
    });
  });

  describe('updateName', () => {
    // Debería actualizar el nombre correctamente
    it('should update name correctly', () => {
      const holiday = new Holiday(validHolidayProps);
      const originalUpdatedAt = holiday.updatedAt;

      holiday.updateName('Nochebuena');

      expect(holiday.name).toBe('Nochebuena');
      expect(holiday.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });

    // Debería hacer trim del nombre
    it('should trim the name', () => {
      const holiday = new Holiday(validHolidayProps);

      holiday.updateName('  Nochebuena  ');

      expect(holiday.name).toBe('Nochebuena');
    });

    // Debería lanzar error si el nombre está vacío
    it('should throw error if name is empty', () => {
      const holiday = new Holiday(validHolidayProps);

      expect(() => holiday.updateName('')).toThrow('El nombre del feriado no puede estar vacío');
    });

    // Debería lanzar error si el nombre es solo espacios
    it('should throw error if name is only whitespace', () => {
      const holiday = new Holiday(validHolidayProps);

      expect(() => holiday.updateName('   ')).toThrow('El nombre del feriado no puede estar vacío');
    });
  });

  describe('updateDate', () => {
    // Debería actualizar la fecha correctamente
    it('should update date correctly', () => {
      const holiday = new Holiday(validHolidayProps);
      const newDate = new Date('2025-12-31');

      holiday.updateDate(newDate);

      expect(holiday.date).toEqual(newDate);
    });

    // Debería actualizar updatedAt
    it('should update updatedAt', () => {
      const holiday = new Holiday(validHolidayProps);
      const originalUpdatedAt = holiday.updatedAt;

      holiday.updateDate(new Date('2025-12-31'));

      expect(holiday.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });
  });

  describe('updateDescription', () => {
    // Debería actualizar la descripción correctamente
    it('should update description correctly', () => {
      const holiday = new Holiday(validHolidayProps);

      holiday.updateDescription('Nueva descripción');

      expect(holiday.description).toBe('Nueva descripción');
    });

    // Debería hacer trim de la descripción
    it('should trim the description', () => {
      const holiday = new Holiday(validHolidayProps);

      holiday.updateDescription('  Nueva descripción  ');

      expect(holiday.description).toBe('Nueva descripción');
    });

    // Debería permitir null como descripción
    it('should allow null as description', () => {
      const holiday = new Holiday(validHolidayProps);

      holiday.updateDescription(null);

      expect(holiday.description).toBeNull();
    });

    // Debería convertir string vacío a null
    it('should convert empty string to null', () => {
      const holiday = new Holiday(validHolidayProps);

      holiday.updateDescription('');

      expect(holiday.description).toBeNull();
    });
  });

  describe('toObject', () => {
    // Debería convertir la entidad a un objeto plano
    it('should convert entity to plain object', () => {
      const holiday = new Holiday(validHolidayProps);
      const obj = holiday.toObject();

      expect(obj).toEqual({
        id: validHolidayProps.id,
        name: validHolidayProps.name,
        date: validHolidayProps.date,
        description: validHolidayProps.description,
        createdAt: validHolidayProps.createdAt,
        updatedAt: validHolidayProps.updatedAt,
      });
    });
  });

  describe('Factory method create', () => {
    // Debería crear un nuevo feriado con nombre y fecha
    it('should create a new holiday with name and date', () => {
      const holiday = Holiday.create(
        '123e4567-e89b-12d3-a456-426614174000',
        'Año Nuevo',
        new Date('2025-01-01'),
      );

      expect(holiday.id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(holiday.name).toBe('Año Nuevo');
      expect(holiday.date).toEqual(new Date('2025-01-01'));
      expect(holiday.description).toBeNull();
      expect(holiday.createdAt).toBeInstanceOf(Date);
      expect(holiday.updatedAt).toBeInstanceOf(Date);
    });

    // Debería crear un nuevo feriado con descripción
    it('should create a new holiday with description', () => {
      const holiday = Holiday.create(
        '123e4567-e89b-12d3-a456-426614174000',
        'Año Nuevo',
        new Date('2025-01-01'),
        'Primer día del año',
      );

      expect(holiday.description).toBe('Primer día del año');
    });

    // Debería hacer trim del nombre y descripción
    it('should trim name and description', () => {
      const holiday = Holiday.create(
        '123e4567-e89b-12d3-a456-426614174000',
        '  Año Nuevo  ',
        new Date('2025-01-01'),
        '  Primer día del año  ',
      );

      expect(holiday.name).toBe('Año Nuevo');
      expect(holiday.description).toBe('Primer día del año');
    });

    // Debería lanzar error si el nombre está vacío
    it('should throw error if name is empty', () => {
      expect(() =>
        Holiday.create(
          '123e4567-e89b-12d3-a456-426614174000',
          '',
          new Date('2025-01-01'),
        ),
      ).toThrow('El nombre del feriado no puede estar vacío');
    });

    // Debería lanzar error si el nombre es solo espacios
    it('should throw error if name is only whitespace', () => {
      expect(() =>
        Holiday.create(
          '123e4567-e89b-12d3-a456-426614174000',
          '   ',
          new Date('2025-01-01'),
        ),
      ).toThrow('El nombre del feriado no puede estar vacío');
    });
  });
});
