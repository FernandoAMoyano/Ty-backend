import { Appointment } from '../../../../../src/modules/appointments/domain/entities/Appointment';
import { generateUuid } from '../../../../../src/shared/utils/uuid';

describe('Appointment Entity', () => {
  // Generar fechas futuras dinámicamente para evitar problemas de tiempo
  const getFutureDate = (daysFromNow: number = 30): Date => {
    const future = new Date();
    future.setDate(future.getDate() + daysFromNow);
    return future;
  };

  const validAppointmentData = {
    id: generateUuid(),
    dateTime: getFutureDate(30), // 30 días en el futuro
    duration: 60,
    userId: generateUuid(),
    clientId: generateUuid(),
    scheduleId: generateUuid(),
    statusId: generateUuid(),
    stylistId: generateUuid(),
    serviceIds: [generateUuid(), generateUuid()],
  };

  describe('Appointment Creation', () => {
    // Debería crear una cita con datos válidos
    it('should create appointment with valid data', () => {
      const appointment = new Appointment(
        validAppointmentData.id,
        validAppointmentData.dateTime,
        validAppointmentData.duration,
        validAppointmentData.userId,
        validAppointmentData.clientId,
        validAppointmentData.scheduleId,
        validAppointmentData.statusId,
        validAppointmentData.stylistId,
        undefined,
        validAppointmentData.serviceIds,
      );

      expect(appointment.id).toBe(validAppointmentData.id);
      expect(appointment.dateTime).toBe(validAppointmentData.dateTime);
      expect(appointment.duration).toBe(validAppointmentData.duration);
      expect(appointment.userId).toBe(validAppointmentData.userId);
      expect(appointment.clientId).toBe(validAppointmentData.clientId);
      expect(appointment.scheduleId).toBe(validAppointmentData.scheduleId);
      expect(appointment.statusId).toBe(validAppointmentData.statusId);
      expect(appointment.stylistId).toBe(validAppointmentData.stylistId);
      expect(appointment.serviceIds).toEqual(validAppointmentData.serviceIds);
      expect(appointment.confirmedAt).toBeUndefined();
      expect(appointment.createdAt).toBeInstanceOf(Date);
      expect(appointment.updatedAt).toBeInstanceOf(Date);
    });

    // Debería crear una cita usando el método estático create
    it('should create appointment with static create method', () => {
      const futureDate = getFutureDate(15); // 15 días en el futuro

      const appointment = Appointment.create(
        futureDate,
        validAppointmentData.duration,
        validAppointmentData.userId,
        validAppointmentData.clientId,
        validAppointmentData.scheduleId,
        validAppointmentData.statusId,
        validAppointmentData.stylistId,
        validAppointmentData.serviceIds,
      );

      expect(appointment.id).toBeDefined();
      expect(appointment.dateTime).toBe(futureDate);
      expect(appointment.duration).toBe(validAppointmentData.duration);
      expect(appointment.confirmedAt).toBeUndefined();
      expect(appointment.serviceIds).toEqual(validAppointmentData.serviceIds);
    });

    // Debería crear una cita desde datos de persistencia
    it('should create appointment from persistence data', () => {
      const futureDate = getFutureDate(20);
      const confirmedAt = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 día atrás
      const createdAt = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 día atrás
      const updatedAt = new Date(Date.now() - 12 * 60 * 60 * 1000); // 12 horas atrás

      const appointment = Appointment.fromPersistence(
        validAppointmentData.id,
        futureDate,
        validAppointmentData.duration,
        validAppointmentData.userId,
        validAppointmentData.clientId,
        validAppointmentData.scheduleId,
        validAppointmentData.statusId,
        validAppointmentData.stylistId,
        confirmedAt,
        validAppointmentData.serviceIds,
        createdAt,
        updatedAt,
      );

      expect(appointment.confirmedAt).toBe(confirmedAt);
      expect(appointment.createdAt).toBe(createdAt);
      expect(appointment.updatedAt).toBe(updatedAt);
    });
  });

  describe('Appointment Validation', () => {
    // Debería lanzar error para fecha en el pasado
    it('should throw error for past date', () => {
      const pastDate = new Date('2020-01-01T10:00:00.000Z');

      expect(() => {
        new Appointment(
          validAppointmentData.id,
          pastDate,
          validAppointmentData.duration,
          validAppointmentData.userId,
          validAppointmentData.clientId,
          validAppointmentData.scheduleId,
          validAppointmentData.statusId,
        );
      }).toThrow('Appointment cannot be scheduled in the past');
    });

    // Debería lanzar error para duración cero
    it('should throw error for zero duration', () => {
      expect(() => {
        new Appointment(
          validAppointmentData.id,
          getFutureDate(30),
          0, // duración cero
          validAppointmentData.userId,
          validAppointmentData.clientId,
          validAppointmentData.scheduleId,
          validAppointmentData.statusId,
        );
      }).toThrow('Duration must be greater than 0');
    });

    // Debería lanzar error para duración menor a 15 minutos
    it('should throw error for duration less than 15 minutes', () => {
      expect(() => {
        new Appointment(
          validAppointmentData.id,
          getFutureDate(30),
          10, // menos de 15 minutos
          validAppointmentData.userId,
          validAppointmentData.clientId,
          validAppointmentData.scheduleId,
          validAppointmentData.statusId,
        );
      }).toThrow('Minimum appointment duration is 15 minutes');
    });

    // Debería lanzar error para duración mayor a 8 horas
    it('should throw error for duration more than 8 hours', () => {
      expect(() => {
        new Appointment(
          validAppointmentData.id,
          getFutureDate(30),
          500, // más de 8 horas (480 minutos)
          validAppointmentData.userId,
          validAppointmentData.clientId,
          validAppointmentData.scheduleId,
          validAppointmentData.statusId,
        );
      }).toThrow('Maximum appointment duration is 8 hours');
    });

    // Debería lanzar error para duración que no sea múltiplo de 15 minutos
    it('should throw error for duration not in 15-minute increments', () => {
      expect(() => {
        new Appointment(
          validAppointmentData.id,
          getFutureDate(30),
          37, // no es múltiplo de 15
          validAppointmentData.userId,
          validAppointmentData.clientId,
          validAppointmentData.scheduleId,
          validAppointmentData.statusId,
        );
      }).toThrow('Duration must be in 15-minute increments');
    });

    // Debería lanzar error para userId vacío
    it('should throw error for empty userId', () => {
      expect(() => {
        new Appointment(
          validAppointmentData.id,
          getFutureDate(30),
          validAppointmentData.duration,
          '', // userId vacío
          validAppointmentData.clientId,
          validAppointmentData.scheduleId,
          validAppointmentData.statusId,
        );
      }).toThrow('userId is required');
    });

    // Debería lanzar error para clientId vacío
    it('should throw error for empty clientId', () => {
      expect(() => {
        new Appointment(
          validAppointmentData.id,
          getFutureDate(30),
          validAppointmentData.duration,
          validAppointmentData.userId,
          '', // clientId vacío
          validAppointmentData.scheduleId,
          validAppointmentData.statusId,
        );
      }).toThrow('clientId is required');
    });
  });

  describe('Appointment Business Logic', () => {
    let appointment: Appointment;

    beforeEach(() => {
      appointment = new Appointment(
        validAppointmentData.id,
        getFutureDate(30), // Usar fecha futura dinámica
        validAppointmentData.duration,
        validAppointmentData.userId,
        validAppointmentData.clientId,
        validAppointmentData.scheduleId,
        validAppointmentData.statusId,
        validAppointmentData.stylistId,
        undefined,
        [...validAppointmentData.serviceIds],
      );
    });

    describe('Confirmation', () => {
      // Debería confirmar la cita
      it('should confirm appointment', () => {
        expect(appointment.isConfirmed()).toBe(false);

        appointment.confirm();

        expect(appointment.isConfirmed()).toBe(true);
        expect(appointment.confirmedAt).toBeInstanceOf(Date);
        expect(appointment.confirmedAt!.getTime()).toBeCloseTo(Date.now(), -3);
      });

      // Debería lanzar error al confirmar una cita ya confirmada
      it('should throw error when confirming already confirmed appointment', () => {
        appointment.confirm();

        expect(() => {
          appointment.confirm();
        }).toThrow('Appointment is already confirmed');
      });
    });

    describe('Rescheduling', () => {
      // Debería reprogramar la cita a una fecha futura
      it('should reschedule appointment to future date', () => {
        const newDate = getFutureDate(60); // 60 días en el futuro
        const originalUpdatedAt = appointment.updatedAt;

        appointment.reschedule(newDate);

        expect(appointment.dateTime).toBe(newDate);
        // Verificar que updatedAt es igual o posterior al original
        expect(appointment.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
      });

      // Debería reprogramar la cita con nueva duración
      it('should reschedule appointment with new duration', () => {
        const newDate = getFutureDate(45); // 45 días en el futuro
        const newDuration = 90;

        appointment.reschedule(newDate, newDuration);

        expect(appointment.dateTime).toBe(newDate);
        expect(appointment.duration).toBe(newDuration);
      });

      // Debería lanzar error al reprogramar a fecha pasada
      it('should throw error when rescheduling to past date', () => {
        const pastDate = new Date('2020-01-01T10:00:00.000Z');

        expect(() => {
          appointment.reschedule(pastDate);
        }).toThrow('Cannot reschedule to a past date');
      });
    });

    describe('Service Management', () => {
      // Debería agregar servicio a la cita
      it('should add service to appointment', () => {
        const newServiceId = generateUuid();
        const originalLength = appointment.serviceIds.length;

        appointment.addService(newServiceId);

        expect(appointment.serviceIds).toContain(newServiceId);
        expect(appointment.serviceIds.length).toBe(originalLength + 1);
      });

      // Debería lanzar error al agregar servicio duplicado
      it('should throw error when adding duplicate service', () => {
        const existingServiceId = appointment.serviceIds[0];

        expect(() => {
          appointment.addService(existingServiceId);
        }).toThrow('Service is already added to this appointment');
      });

      // Debería lanzar error al agregar servicio con ID vacío
      it('should throw error when adding empty service ID', () => {
        expect(() => {
          appointment.addService('');
        }).toThrow('Service ID is required');
      });

      // Debería remover servicio de la cita
      it('should remove service from appointment', () => {
        const serviceToRemove = appointment.serviceIds[0];
        const originalLength = appointment.serviceIds.length;

        appointment.removeService(serviceToRemove);

        expect(appointment.serviceIds).not.toContain(serviceToRemove);
        expect(appointment.serviceIds.length).toBe(originalLength - 1);
      });

      // Debería lanzar error al remover servicio inexistente
      it('should throw error when removing non-existent service', () => {
        const nonExistentServiceId = generateUuid();

        expect(() => {
          appointment.removeService(nonExistentServiceId);
        }).toThrow('Service not found in this appointment');
      });
    });

    describe('Stylist Management', () => {
      // Debería actualizar el estilista
      it('should update stylist', () => {
        const newStylistId = generateUuid();

        appointment.updateStylist(newStylistId);

        expect(appointment.stylistId).toBe(newStylistId);
      });

      // Debería lanzar error al actualizar con ID de estilista vacío
      it('should throw error when updating with empty stylist ID', () => {
        expect(() => {
          appointment.updateStylist('');
        }).toThrow('Stylist ID is required');
      });
    });

    describe('Time Calculations', () => {
      // Debería calcular la hora de finalización correcta
      it('should calculate correct end time', () => {
        const expectedEndTime = new Date(
          appointment.dateTime.getTime() + appointment.duration * 60000,
        );

        const endTime = appointment.getEndTime();

        expect(endTime).toEqual(expectedEndTime);
      });

      // Debería detectar si la cita está en el pasado
      it('should detect if appointment is in past', () => {
        const pastAppointment = new Appointment(
          generateUuid(),
          getFutureDate(10), // Fecha futura para validación inicial
          60,
          validAppointmentData.userId,
          validAppointmentData.clientId,
          validAppointmentData.scheduleId,
          validAppointmentData.statusId,
        );

        // Cambiar a fecha pasada después de la validación inicial
        pastAppointment.dateTime = new Date('2020-01-01T10:00:00.000Z');

        expect(pastAppointment.isInPast()).toBe(true);
      });

      // Debería verificar si la cita puede ser modificada
      it('should check if appointment can be modified', () => {
        // Cita en más de 24 horas
        const futureAppointment = new Appointment(
          generateUuid(),
          new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 horas en el futuro
          60,
          validAppointmentData.userId,
          validAppointmentData.clientId,
          validAppointmentData.scheduleId,
          validAppointmentData.statusId,
        );

        expect(futureAppointment.canBeModified()).toBe(true);

        // Cita en menos de 24 horas
        const soonAppointment = new Appointment(
          generateUuid(),
          new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 horas en el futuro
          60,
          validAppointmentData.userId,
          validAppointmentData.clientId,
          validAppointmentData.scheduleId,
          validAppointmentData.statusId,
        );

        expect(soonAppointment.canBeModified()).toBe(false);
      });
    });

    describe('Conflict Detection', () => {
      // Debería detectar conflicto con cita superpuesta
      it('should detect conflict with overlapping appointment', () => {
        const conflictingAppointment = new Appointment(
          generateUuid(),
          new Date(appointment.dateTime.getTime() + 30 * 60000), // 30 minutos después del inicio
          60,
          validAppointmentData.userId,
          validAppointmentData.clientId,
          validAppointmentData.scheduleId,
          validAppointmentData.statusId,
        );

        expect(appointment.hasConflictWith(conflictingAppointment)).toBe(true);
      });

      // No debería detectar conflicto con cita no superpuesta
      it('should not detect conflict with non-overlapping appointment', () => {
        const nonConflictingAppointment = new Appointment(
          generateUuid(),
          new Date(appointment.dateTime.getTime() + 2 * 60 * 60000), // 2 horas después
          60,
          validAppointmentData.userId,
          validAppointmentData.clientId,
          validAppointmentData.scheduleId,
          validAppointmentData.statusId,
        );

        expect(appointment.hasConflictWith(nonConflictingAppointment)).toBe(false);
      });

      // No debería detectar conflicto con cita adyacente
      it('should not detect conflict with adjacent appointment', () => {
        const adjacentAppointment = new Appointment(
          generateUuid(),
          new Date(appointment.dateTime.getTime() + 60 * 60000), // Exactamente cuando termina
          60,
          validAppointmentData.userId,
          validAppointmentData.clientId,
          validAppointmentData.scheduleId,
          validAppointmentData.statusId,
        );

        expect(appointment.hasConflictWith(adjacentAppointment)).toBe(false);
      });
    });

    describe('Status Management', () => {
      // Debería cambiar el estado
      it('should change status', () => {
        const newStatusId = generateUuid();

        appointment.changeStatus(newStatusId);

        expect(appointment.statusId).toBe(newStatusId);
      });

      // Debería lanzar error al cambiar a estado vacío
      it('should throw error when changing to empty status', () => {
        expect(() => {
          appointment.changeStatus('');
        }).toThrow('Status ID is required');
      });

      // Debería marcar como confirmada con cambio de estado
      it('should mark as confirmed with status change', () => {
        const confirmedStatusId = generateUuid();

        appointment.markAsConfirmed(confirmedStatusId);

        expect(appointment.isConfirmed()).toBe(true);
        expect(appointment.statusId).toBe(confirmedStatusId);
      });

      // Debería marcar como cancelada
      it('should mark as cancelled', () => {
        const cancelledStatusId = generateUuid();

        appointment.markAsCancelled(cancelledStatusId);

        expect(appointment.statusId).toBe(cancelledStatusId);
      });

      // Debería marcar como completada
      it('should mark as completed', () => {
        const completedStatusId = generateUuid();

        appointment.markAsCompleted(completedStatusId);

        expect(appointment.statusId).toBe(completedStatusId);
      });

      // Debería marcar como en progreso
      it('should mark as in progress', () => {
        const inProgressStatusId = generateUuid();

        appointment.markAsInProgress(inProgressStatusId);

        expect(appointment.statusId).toBe(inProgressStatusId);
      });

      // Debería marcar como no show (cliente no se presentó)
      it('should mark as no show', () => {
        const noShowStatusId = generateUuid();

        appointment.markAsNoShow(noShowStatusId);

        expect(appointment.statusId).toBe(noShowStatusId);
      });
    });

    describe('Persistence Conversion', () => {
      // Debería convertir a formato de persistencia
      it('should convert to persistence format', () => {
        const persistenceData = appointment.toPersistence();

        expect(persistenceData).toEqual({
          id: appointment.id,
          dateTime: appointment.dateTime,
          duration: appointment.duration,
          userId: appointment.userId,
          clientId: appointment.clientId,
          scheduleId: appointment.scheduleId,
          statusId: appointment.statusId,
          stylistId: appointment.stylistId,
          confirmedAt: appointment.confirmedAt,
          serviceIds: appointment.serviceIds,
          createdAt: appointment.createdAt,
          updatedAt: appointment.updatedAt,
        });
      });
    });
  });
});
