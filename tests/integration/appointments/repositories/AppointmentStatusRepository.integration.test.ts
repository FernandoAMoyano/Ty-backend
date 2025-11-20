import { PrismaAppointmentStatusRepository } from '../../../../src/modules/appointments/infrastructure/persistence/PrismaAppointmentStatusRepository';
import { AppointmentStatus } from '../../../../src/modules/appointments/domain/entities/AppointmentStatus';
import { testPrisma } from '../../../setup/database';
import { generateUuid } from '../../../../src/shared/utils/uuid';

describe('AppointmentStatusRepository Integration Tests', () => {
  let repository: PrismaAppointmentStatusRepository;

  beforeAll(async () => {
    repository = new PrismaAppointmentStatusRepository(testPrisma);
  });

  beforeEach(async () => {
    // Limpiar estados de prueba creados por tests
    await testPrisma.appointmentStatus.deleteMany({
      where: {
        name: {
          startsWith: 'TEST_',
        },
      },
    });
  });

  describe('findAll', () => {
    it('should return all existing statuses including seed data', async () => {
      const statuses = await repository.findAll();

      expect(statuses.length).toBeGreaterThanOrEqual(3); // Mínimo los del seed

      // Verificar que incluye los estados principales del seed
      const statusNames = statuses.map((status) => status.name);
      expect(statusNames).toContain('Pendiente');
      expect(statusNames).toContain('Confirmada');
      expect(statusNames).toContain('Completada');

      // Verificar que todos tienen propiedades requeridas
      statuses.forEach((status) => {
        expect(status.id).toBeDefined();
        expect(status.name).toBeDefined();
        // description es opcional
      });
    });
  });

  describe('findById', () => {
    it('should find status by existing id', async () => {
      // Obtener un estado del seed
      const seedStatus = await testPrisma.appointmentStatus.findFirst({
        where: { name: 'Pendiente' },
      });

      expect(seedStatus).toBeDefined();

      const foundStatus = await repository.findById(seedStatus!.id);

      expect(foundStatus).toBeDefined();
      expect(foundStatus!.id).toBe(seedStatus!.id);
      expect(foundStatus!.name).toBe('Pendiente');
    });

    it('should return null for non-existing id', async () => {
      const nonExistingId = '00000000-0000-0000-0000-000000000000';

      const foundStatus = await repository.findById(nonExistingId);

      expect(foundStatus).toBeNull();
    });
  });

  describe('findByName', () => {
    it('should find status by existing name', async () => {
      const foundStatus = await repository.findByName('Pendiente');

      expect(foundStatus).toBeDefined();
      expect(foundStatus!.name).toBe('Pendiente');
      expect(foundStatus!.id).toBeDefined();
    });

    it('should return null for non-existing name', async () => {
      const foundStatus = await repository.findByName('ESTADO_INEXISTENTE');

      expect(foundStatus).toBeNull();
    });

    it('should be case-sensitive when finding by name', async () => {
      const foundStatus = await repository.findByName('pendiente'); // minúscula

      expect(foundStatus).toBeNull(); // No debería encontrar porque es case-sensitive
    });
  });

  describe('save', () => {
    it('should save new status successfully', async () => {
      const newStatus = new AppointmentStatus(
        generateUuid(),
        'TEST_NUEVO_ESTADO',
        'Estado de prueba para tests de integración',
      );

      const savedStatus = await repository.save(newStatus);

      expect(savedStatus.id).toBeDefined();
      expect(savedStatus.id).toMatch(/^[0-9a-f-]{36}$/); // UUID format
      expect(savedStatus.name).toBe('TEST_NUEVO_ESTADO');
      expect(savedStatus.description).toBe('Estado de prueba para tests de integración');
    });

    it('should save status using create method', async () => {
      const newStatus = AppointmentStatus.create(
        'TEST_CREATED_STATUS',
        'Status created using static method'
      );

      const savedStatus = await repository.save(newStatus);

      expect(savedStatus.id).toBeDefined();
      expect(savedStatus.name).toBe('TEST_CREATED_STATUS');
      expect(savedStatus.description).toBe('Status created using static method');
    });

    it('should allow duplicate names (no unique constraint)', async () => {
      // Crear primer estado
      const status1 = AppointmentStatus.create('TEST_DUPLICADO', 'Primer estado');
      const saved1 = await repository.save(status1);

      // Crear segundo estado con mismo nombre (debería funcionar)
      const status2 = AppointmentStatus.create('TEST_DUPLICADO', 'Segundo estado');
      const saved2 = await repository.save(status2);

      // Ambos deberían existir con IDs diferentes
      expect(saved1.id).not.toBe(saved2.id);
      expect(saved1.name).toBe(saved2.name);
      expect(saved1.description).toBe('Primer estado');
      expect(saved2.description).toBe('Segundo estado');
    });

    it('should preserve ID when provided', async () => {
      const customId = '12345678-1234-1234-1234-123456789012';
      const status = new AppointmentStatus(
        customId,
        'TEST_CUSTOM_ID',
        'Estado con ID personalizado',
      );

      const savedStatus = await repository.save(status);

      expect(savedStatus.id).toBe(customId);
      expect(savedStatus.name).toBe('TEST_CUSTOM_ID');
    });
  });

  describe('update', () => {
    it('should update existing status', async () => {
      // Crear estado inicial
      const originalStatus = AppointmentStatus.create(
        'TEST_PARA_ACTUALIZAR',
        'Descripción original',
      );

      const savedStatus = await repository.save(originalStatus);

      // Actualizar - crear nueva instancia con mismo ID pero datos diferentes
      const updatedStatus = new AppointmentStatus(
        savedStatus.id,
        'TEST_ACTUALIZADO',
        'Descripción actualizada',
      );

      const result = await repository.update(updatedStatus);

      expect(result.id).toBe(savedStatus.id);
      expect(result.name).toBe('TEST_ACTUALIZADO');
      expect(result.description).toBe('Descripción actualizada');
    });

    it('should throw error for non-existing id', async () => {
      const nonExistingId = '00000000-0000-0000-0000-000000000000';
      const status = new AppointmentStatus(nonExistingId, 'TEST_NO_EXISTE', 'Descripción');

      await expect(repository.update(status)).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete existing status', async () => {
      // Crear estado para eliminar
      const status = AppointmentStatus.create(
        'TEST_PARA_ELIMINAR',
        'Estado que será eliminado',
      );

      const savedStatus = await repository.save(status);

      // Eliminar
      await repository.delete(savedStatus.id);

      // Verificar que no existe
      const foundStatus = await repository.findById(savedStatus.id);
      expect(foundStatus).toBeNull();
    });

    it('should throw error when deleting non-existing status', async () => {
      const nonExistingId = '00000000-0000-0000-0000-000000000000';

      await expect(repository.delete(nonExistingId)).rejects.toThrow();
    });
  });

  describe('existsById', () => {
    it('should return true for existing id', async () => {
      // Usar estado del seed
      const seedStatus = await testPrisma.appointmentStatus.findFirst({
        where: { name: 'Pendiente' },
      });

      expect(seedStatus).toBeDefined();

      const exists = await repository.existsById(seedStatus!.id);
      expect(exists).toBe(true);
    });

    it('should return false for non-existing id', async () => {
      const nonExistingId = '00000000-0000-0000-0000-000000000000';

      const exists = await repository.existsById(nonExistingId);
      expect(exists).toBe(false);
    });
  });

  describe('existsByName', () => {
    it('should return true for existing name', async () => {
      const exists = await repository.existsByName('Pendiente');
      expect(exists).toBe(true);
    });

    it('should return false for non-existing name', async () => {
      const exists = await repository.existsByName('ESTADO_INEXISTENTE');
      expect(exists).toBe(false);
    });

    it('should be case-sensitive', async () => {
      const exists = await repository.existsByName('pendiente'); // minúscula
      expect(exists).toBe(false);
    });
  });

  describe('findTerminalStatuses', () => {
    it('should return terminal statuses', async () => {
      const terminalStatuses = await repository.findTerminalStatuses();

      // Los estados terminales típicamente incluyen Completada, Cancelada
      expect(terminalStatuses.length).toBeGreaterThanOrEqual(1);

      // Verificar que incluye estados esperados
      const statusNames = terminalStatuses.map((status) => status.name);
      expect(statusNames).toContain('Completada');
      expect(statusNames).toContain('Cancelada');
    });

    it('should not include non-terminal statuses', async () => {
      const terminalStatuses = await repository.findTerminalStatuses();

      const statusNames = terminalStatuses.map((status) => status.name);
      expect(statusNames).not.toContain('Pendiente');
      expect(statusNames).not.toContain('Confirmada');
    });
  });

  describe('findActiveStatuses', () => {
    it('should return active statuses', async () => {
      const activeStatuses = await repository.findActiveStatuses();

      // Los estados activos no incluyen Cancelada ni Completada
      expect(activeStatuses.length).toBeGreaterThanOrEqual(2);

      const statusNames = activeStatuses.map((status) => status.name);
      expect(statusNames).toContain('Pendiente');
      expect(statusNames).toContain('Confirmada');

      // No debería incluir estados terminales
      expect(statusNames).not.toContain('Completada');
      expect(statusNames).not.toContain('Cancelada');
    });
  });

  describe('Business Logic', () => {
    it('should validate status names correctly', async () => {
      // Test que verifica que el constructor valida correctamente
      expect(() => {
        new AppointmentStatus(generateUuid(), '', 'Empty name should fail');
      }).toThrow();
    });

    it('should handle status without description', async () => {
      const status = AppointmentStatus.create('TEST_NO_DESC');
      
      const savedStatus = await repository.save(status);
      
      expect(savedStatus.name).toBe('TEST_NO_DESC');
      expect(savedStatus.description).toBeUndefined();
    });

    it('should find status and preserve all properties', async () => {
      const originalStatus = AppointmentStatus.create(
        'TEST_FULL_PROPERTIES',
        'Status with full properties'
      );
      
      const savedStatus = await repository.save(originalStatus);
      const foundStatus = await repository.findById(savedStatus.id);
      
      expect(foundStatus).toBeDefined();
      expect(foundStatus!.id).toBe(savedStatus.id);
      expect(foundStatus!.name).toBe(savedStatus.name);
      expect(foundStatus!.description).toBe(savedStatus.description);
    });
  });
});
