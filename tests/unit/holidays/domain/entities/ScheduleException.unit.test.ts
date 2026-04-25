import {
  ScheduleException,
  ScheduleExceptionProps,
} from '../../../../../src/modules/holidays/domain/entities/ScheduleException';

describe('ScheduleException Entity', () => {
  // Datos de prueba base
  const validExceptionProps: ScheduleExceptionProps = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    exceptionDate: new Date('2025-12-24'),
    startTimeException: '09:00',
    endTimeException: '14:00',
    reason: 'Horario reducido de Nochebuena',
    holidayId: null,
    createdAt: new Date('2025-01-01T10:00:00Z'),
    updatedAt: new Date('2025-01-01T10:00:00Z'),
  };

  describe('Constructor y Getters', () => {
    // Debería crear una entidad ScheduleException con todas las propiedades
    it('should create a ScheduleException entity with all properties', () => {
      const exception = new ScheduleException(validExceptionProps);

      expect(exception.id).toBe(validExceptionProps.id);
      expect(exception.exceptionDate).toEqual(validExceptionProps.exceptionDate);
      expect(exception.startTimeException).toBe('09:00');
      expect(exception.endTimeException).toBe('14:00');
      expect(exception.reason).toBe('Horario reducido de Nochebuena');
      expect(exception.holidayId).toBeNull();
      expect(exception.createdAt).toEqual(validExceptionProps.createdAt);
      expect(exception.updatedAt).toEqual(validExceptionProps.updatedAt);
    });

    // Debería crear una entidad con holidayId asociado
    it('should create an entity with associated holidayId', () => {
      const propsWithHoliday: ScheduleExceptionProps = {
        ...validExceptionProps,
        holidayId: '123e4567-e89b-12d3-a456-426614174001',
      };

      const exception = new ScheduleException(propsWithHoliday);

      expect(exception.holidayId).toBe('123e4567-e89b-12d3-a456-426614174001');
      expect(exception.isHolidayRelated).toBe(true);
    });

    // Debería crear una entidad sin razón
    it('should create an entity without reason', () => {
      const propsWithoutReason: ScheduleExceptionProps = {
        ...validExceptionProps,
        reason: null,
      };

      const exception = new ScheduleException(propsWithoutReason);

      expect(exception.reason).toBeNull();
    });
  });

  describe('isHolidayRelated', () => {
    // Debería retornar false cuando no hay holidayId
    it('should return false when there is no holidayId', () => {
      const exception = new ScheduleException(validExceptionProps);

      expect(exception.isHolidayRelated).toBe(false);
    });

    // Debería retornar true cuando hay holidayId
    it('should return true when there is holidayId', () => {
      const exception = new ScheduleException({
        ...validExceptionProps,
        holidayId: '123e4567-e89b-12d3-a456-426614174001',
      });

      expect(exception.isHolidayRelated).toBe(true);
    });
  });

  describe('isOnDate', () => {
    // Debería retornar true cuando la fecha coincide
    it('should return true when date matches', () => {
      const exception = new ScheduleException(validExceptionProps);

      expect(exception.isOnDate(new Date('2025-12-24'))).toBe(true);
    });

    // Debería retornar false cuando la fecha no coincide
    it('should return false when date does not match', () => {
      const exception = new ScheduleException(validExceptionProps);

      expect(exception.isOnDate(new Date('2025-12-25'))).toBe(false);
    });

    // Debería ignorar la hora al comparar fechas
    it('should ignore time when comparing dates', () => {
      const exception = new ScheduleException(validExceptionProps);

      expect(exception.isOnDate(new Date('2025-12-24T23:59:59Z'))).toBe(true);
    });
  });

  describe('isPast, isToday, isFuture', () => {
    // Debería retornar isPast true para excepciones pasadas
    it('should return isPast true for past exceptions', () => {
      const pastException = new ScheduleException({
        ...validExceptionProps,
        exceptionDate: new Date('2020-01-01'),
      });

      expect(pastException.isPast).toBe(true);
      expect(pastException.isToday).toBe(false);
      expect(pastException.isFuture).toBe(false);
    });

    // Debería retornar isToday true para excepciones de hoy
    it('should return isToday true for today exceptions', () => {
      const today = new Date();
      const todayException = new ScheduleException({
        ...validExceptionProps,
        exceptionDate: today,
      });

      expect(todayException.isPast).toBe(false);
      expect(todayException.isToday).toBe(true);
      expect(todayException.isFuture).toBe(false);
    });

    // Debería retornar isFuture true para excepciones futuras
    it('should return isFuture true for future exceptions', () => {
      const futureException = new ScheduleException({
        ...validExceptionProps,
        exceptionDate: new Date('2099-12-24'),
      });

      expect(futureException.isPast).toBe(false);
      expect(futureException.isToday).toBe(false);
      expect(futureException.isFuture).toBe(true);
    });
  });

  describe('durationInMinutes', () => {
    // Debería calcular la duración correctamente
    it('should calculate duration correctly', () => {
      const exception = new ScheduleException(validExceptionProps);

      // 09:00 a 14:00 = 5 horas = 300 minutos
      expect(exception.durationInMinutes).toBe(300);
    });

    // Debería manejar duraciones parciales
    it('should handle partial durations', () => {
      const exception = new ScheduleException({
        ...validExceptionProps,
        startTimeException: '09:30',
        endTimeException: '12:45',
      });

      // 09:30 a 12:45 = 3h 15m = 195 minutos
      expect(exception.durationInMinutes).toBe(195);
    });
  });

  describe('updateTimes', () => {
    // Debería actualizar los horarios correctamente
    it('should update times correctly', () => {
      const exception = new ScheduleException(validExceptionProps);
      const originalUpdatedAt = exception.updatedAt;

      exception.updateTimes('10:00', '16:00');

      expect(exception.startTimeException).toBe('10:00');
      expect(exception.endTimeException).toBe('16:00');
      expect(exception.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });

    // Debería lanzar error con formato de hora inválido
    it('should throw error with invalid time format', () => {
      const exception = new ScheduleException(validExceptionProps);

      expect(() => exception.updateTimes('25:00', '14:00')).toThrow(
        'Formato de hora inválido: 25:00. Use HH:MM',
      );
    });

    // Debería lanzar error si la hora de fin es anterior a la de inicio
    it('should throw error if end time is before start time', () => {
      const exception = new ScheduleException(validExceptionProps);

      expect(() => exception.updateTimes('14:00', '09:00')).toThrow(
        'La hora de fin debe ser posterior a la hora de inicio',
      );
    });

    // Debería lanzar error si las horas son iguales
    it('should throw error if times are equal', () => {
      const exception = new ScheduleException(validExceptionProps);

      expect(() => exception.updateTimes('10:00', '10:00')).toThrow(
        'La hora de fin debe ser posterior a la hora de inicio',
      );
    });

    // Debería aceptar formato de hora con un dígito
    it('should accept single digit hour format', () => {
      const exception = new ScheduleException(validExceptionProps);

      exception.updateTimes('9:00', '14:00');

      expect(exception.startTimeException).toBe('9:00');
    });
  });

  describe('updateDate', () => {
    // Debería actualizar la fecha correctamente
    it('should update date correctly', () => {
      const exception = new ScheduleException(validExceptionProps);
      const newDate = new Date('2025-12-31');

      exception.updateDate(newDate);

      expect(exception.exceptionDate).toEqual(newDate);
    });

    // Debería actualizar updatedAt
    it('should update updatedAt', () => {
      const exception = new ScheduleException(validExceptionProps);
      const originalUpdatedAt = exception.updatedAt;

      exception.updateDate(new Date('2025-12-31'));

      expect(exception.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });
  });

  describe('updateReason', () => {
    // Debería actualizar la razón correctamente
    it('should update reason correctly', () => {
      const exception = new ScheduleException(validExceptionProps);

      exception.updateReason('Nueva razón');

      expect(exception.reason).toBe('Nueva razón');
    });

    // Debería hacer trim de la razón
    it('should trim the reason', () => {
      const exception = new ScheduleException(validExceptionProps);

      exception.updateReason('  Nueva razón  ');

      expect(exception.reason).toBe('Nueva razón');
    });

    // Debería permitir null como razón
    it('should allow null as reason', () => {
      const exception = new ScheduleException(validExceptionProps);

      exception.updateReason(null);

      expect(exception.reason).toBeNull();
    });

    // Debería convertir string vacío a null
    it('should convert empty string to null', () => {
      const exception = new ScheduleException(validExceptionProps);

      exception.updateReason('');

      expect(exception.reason).toBeNull();
    });
  });

  describe('associateToHoliday y disassociateFromHoliday', () => {
    // Debería asociar la excepción a un feriado
    it('should associate exception to a holiday', () => {
      const exception = new ScheduleException(validExceptionProps);

      exception.associateToHoliday('123e4567-e89b-12d3-a456-426614174001');

      expect(exception.holidayId).toBe('123e4567-e89b-12d3-a456-426614174001');
      expect(exception.isHolidayRelated).toBe(true);
    });

    // Debería desasociar la excepción de un feriado
    it('should disassociate exception from a holiday', () => {
      const exception = new ScheduleException({
        ...validExceptionProps,
        holidayId: '123e4567-e89b-12d3-a456-426614174001',
      });

      exception.disassociateFromHoliday();

      expect(exception.holidayId).toBeNull();
      expect(exception.isHolidayRelated).toBe(false);
    });
  });

  describe('toObject', () => {
    // Debería convertir la entidad a un objeto plano
    it('should convert entity to plain object', () => {
      const exception = new ScheduleException(validExceptionProps);
      const obj = exception.toObject();

      expect(obj).toEqual({
        id: validExceptionProps.id,
        exceptionDate: validExceptionProps.exceptionDate,
        startTimeException: validExceptionProps.startTimeException,
        endTimeException: validExceptionProps.endTimeException,
        reason: validExceptionProps.reason,
        holidayId: validExceptionProps.holidayId,
        createdAt: validExceptionProps.createdAt,
        updatedAt: validExceptionProps.updatedAt,
      });
    });
  });

  describe('Factory method create', () => {
    // Debería crear una nueva excepción con los datos básicos
    it('should create a new exception with basic data', () => {
      const exception = ScheduleException.create(
        '123e4567-e89b-12d3-a456-426614174000',
        new Date('2025-12-24'),
        '09:00',
        '14:00',
      );

      expect(exception.id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(exception.exceptionDate).toEqual(new Date('2025-12-24'));
      expect(exception.startTimeException).toBe('09:00');
      expect(exception.endTimeException).toBe('14:00');
      expect(exception.reason).toBeNull();
      expect(exception.holidayId).toBeNull();
      expect(exception.createdAt).toBeInstanceOf(Date);
      expect(exception.updatedAt).toBeInstanceOf(Date);
    });

    // Debería crear una excepción con razón y holidayId
    it('should create an exception with reason and holidayId', () => {
      const exception = ScheduleException.create(
        '123e4567-e89b-12d3-a456-426614174000',
        new Date('2025-12-24'),
        '09:00',
        '14:00',
        'Horario especial',
        '123e4567-e89b-12d3-a456-426614174001',
      );

      expect(exception.reason).toBe('Horario especial');
      expect(exception.holidayId).toBe('123e4567-e89b-12d3-a456-426614174001');
    });

    // Debería hacer trim de la razón
    it('should trim the reason', () => {
      const exception = ScheduleException.create(
        '123e4567-e89b-12d3-a456-426614174000',
        new Date('2025-12-24'),
        '09:00',
        '14:00',
        '  Razón con espacios  ',
      );

      expect(exception.reason).toBe('Razón con espacios');
    });

    // Debería lanzar error con formato de hora inválido
    it('should throw error with invalid time format', () => {
      expect(() =>
        ScheduleException.create(
          '123e4567-e89b-12d3-a456-426614174000',
          new Date('2025-12-24'),
          'invalid',
          '14:00',
        ),
      ).toThrow('Formato de hora inválido');
    });

    // Debería lanzar error si la hora de fin es anterior a la de inicio
    it('should throw error if end time is before start time', () => {
      expect(() =>
        ScheduleException.create(
          '123e4567-e89b-12d3-a456-426614174000',
          new Date('2025-12-24'),
          '14:00',
          '09:00',
        ),
      ).toThrow('La hora de fin debe ser posterior a la hora de inicio');
    });
  });
});
