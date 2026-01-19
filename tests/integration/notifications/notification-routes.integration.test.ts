import request from 'supertest';
import app from '../../../src/app';
import { loginAsAdmin, loginTestUser } from '../../setup/helpers';
import { testPrisma } from '../../setup/database';

describe('Notifications Integration Tests', () => {
  let adminToken: string;
  let userToken: string;
  let userId: string;

  beforeAll(async () => {
    // Login como admin
    adminToken = await loginAsAdmin();

    // Login como usuario normal
    const userData = await loginTestUser();
    userToken = userData.token;
    userId = userData.user.id;
  });

  describe('POST /api/v1/notifications - Create Notification (Admin Only)', () => {
    // Debería crear una notificación como admin
    it('should create a notification as admin', async () => {
      const response = await request(app)
        .post('/api/v1/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'APPOINTMENT_CONFIRMATION',
          message: 'Tu cita ha sido confirmada para mañana a las 10:00',
          userId: userId,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.type).toBe('APPOINTMENT_CONFIRMATION');
      expect(response.body.data.message).toBe('Tu cita ha sido confirmada para mañana a las 10:00');
      expect(response.body.data.userId).toBe(userId);
    });

    // Debería rechazar creación sin token de admin
    it('should reject creation without admin token', async () => {
      const response = await request(app)
        .post('/api/v1/notifications')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          type: 'SYSTEM',
          message: 'Mensaje de prueba',
          userId: userId,
        });

      // AuthMiddleware retorna 401 para cualquier error de autorización
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    // Debería rechazar creación sin autenticación
    it('should reject creation without authentication', async () => {
      const response = await request(app).post('/api/v1/notifications').send({
        type: 'SYSTEM',
        message: 'Mensaje de prueba',
        userId: userId,
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    // Debería validar tipo de notificación requerido
    it('should validate notification type is required', async () => {
      const response = await request(app)
        .post('/api/v1/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          message: 'Mensaje de prueba',
          userId: userId,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    // Debería validar mensaje requerido
    it('should validate message is required', async () => {
      const response = await request(app)
        .post('/api/v1/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'SYSTEM',
          userId: userId,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    // Debería validar userId requerido
    it('should validate userId is required', async () => {
      const response = await request(app)
        .post('/api/v1/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'SYSTEM',
          message: 'Mensaje de prueba',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    // Debería validar tipo de notificación válido
    it('should validate notification type is valid', async () => {
      const response = await request(app)
        .post('/api/v1/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'INVALID_TYPE',
          message: 'Mensaje de prueba',
          userId: userId,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    // Debería validar longitud máxima del mensaje
    it('should validate message max length', async () => {
      const response = await request(app)
        .post('/api/v1/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'SYSTEM',
          message: 'A'.repeat(1001),
          userId: userId,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    // Debería crear notificación de tipo PROMOTIONAL
    it('should create PROMOTIONAL notification', async () => {
      const response = await request(app)
        .post('/api/v1/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'PROMOTIONAL',
          message: '¡Aprovecha nuestra promoción de verano!',
          userId: userId,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.type).toBe('PROMOTIONAL');
    });

    // Debería crear notificación de tipo APPOINTMENT_REMINDER
    it('should create APPOINTMENT_REMINDER notification', async () => {
      const response = await request(app)
        .post('/api/v1/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'APPOINTMENT_REMINDER',
          message: 'Recordatorio: Tu cita es mañana',
          userId: userId,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.type).toBe('APPOINTMENT_REMINDER');
    });
  });

  describe('GET /api/v1/notifications - Get My Notifications', () => {
    // Debería obtener las notificaciones del usuario autenticado
    it('should get authenticated user notifications', async () => {
      const response = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('notifications');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('page');
      expect(response.body.data).toHaveProperty('limit');
      expect(response.body.data).toHaveProperty('totalPages');
      expect(response.body.data).toHaveProperty('hasNextPage');
      expect(response.body.data).toHaveProperty('hasPreviousPage');
      expect(Array.isArray(response.body.data.notifications)).toBe(true);
    });

    // Debería rechazar sin autenticación
    it('should reject without authentication', async () => {
      const response = await request(app).get('/api/v1/notifications');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    // Debería aceptar parámetros de paginación
    it('should accept pagination parameters', async () => {
      const response = await request(app)
        .get('/api/v1/notifications?page=1&limit=5')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(5);
    });

    // Debería filtrar por tipo de notificación
    it('should filter by notification type', async () => {
      const response = await request(app)
        .get('/api/v1/notifications?type=APPOINTMENT_CONFIRMATION')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      if (response.body.data.notifications.length > 0) {
        response.body.data.notifications.forEach((notification: any) => {
          expect(notification.type).toBe('APPOINTMENT_CONFIRMATION');
        });
      }
    });

    // Debería filtrar solo no leídas
    it('should filter only unread notifications', async () => {
      const response = await request(app)
        .get('/api/v1/notifications?unreadOnly=true')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/notifications/unread-count - Get Unread Count', () => {
    // Debería obtener el conteo de notificaciones no leídas
    it('should get unread notifications count', async () => {
      const response = await request(app)
        .get('/api/v1/notifications/unread-count')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('unreadCount');
      expect(typeof response.body.data.unreadCount).toBe('number');
      expect(response.body.data.unreadCount).toBeGreaterThanOrEqual(0);
    });

    // Debería rechazar sin autenticación
    it('should reject without authentication', async () => {
      const response = await request(app).get('/api/v1/notifications/unread-count');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/notifications/:id - Get Notification By ID', () => {
    // Debería obtener una notificación por ID
    it('should get notification by ID', async () => {
      // Primero creamos una notificación para el usuario
      const createResponse = await request(app)
        .post('/api/v1/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'SYSTEM',
          message: 'Notificación de prueba para obtener por ID',
          userId: userId,
        });

      const testNotificationId = createResponse.body.data.id;

      const response = await request(app)
        .get(`/api/v1/notifications/${testNotificationId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testNotificationId);
      expect(response.body.data.type).toBe('SYSTEM');
    });

    // Debería rechazar acceso a notificación de otro usuario
    it('should reject access to another user notification', async () => {
      // Obtener una notificación del admin (seed data)
      const adminNotification = await testPrisma.notification.findFirst({
        where: {
          user: {
            email: 'admin@turnity.com',
          },
        },
      });

      if (adminNotification) {
        const response = await request(app)
          .get(`/api/v1/notifications/${adminNotification.id}`)
          .set('Authorization', `Bearer ${userToken}`);

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
      }
    });

    // Debería retornar 404 para notificación inexistente
    it('should return 404 for non-existent notification', async () => {
      // UUID v4 válido que no existe en la base de datos
      const fakeId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      const response = await request(app)
        .get(`/api/v1/notifications/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    // Debería validar formato de UUID
    it('should validate UUID format', async () => {
      const response = await request(app)
        .get('/api/v1/notifications/invalid-uuid')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/notifications/:id/read - Mark Single as Read', () => {
    // Debería marcar una notificación como leída
    it('should mark notification as read', async () => {
      // Crear notificación para el test
      const createResponse = await request(app)
        .post('/api/v1/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'SYSTEM',
          message: 'Notificación para marcar como leída',
          userId: userId,
        });

      const testNotificationId = createResponse.body.data.id;

      const response = await request(app)
        .patch(`/api/v1/notifications/${testNotificationId}/read`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isRead).toBe(true);
    });

    // Debería rechazar marcar notificación de otro usuario
    it('should reject marking another user notification', async () => {
      const adminNotification = await testPrisma.notification.findFirst({
        where: {
          user: {
            email: 'admin@turnity.com',
          },
        },
      });

      if (adminNotification) {
        const response = await request(app)
          .patch(`/api/v1/notifications/${adminNotification.id}/read`)
          .set('Authorization', `Bearer ${userToken}`);

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
      }
    });
  });

  describe('POST /api/v1/notifications/mark-read - Mark Multiple as Read', () => {
    // Debería marcar múltiples notificaciones como leídas
    it('should mark multiple notifications as read', async () => {
      // Crear varias notificaciones
      const ids: string[] = [];
      for (let i = 0; i < 3; i++) {
        const createResponse = await request(app)
          .post('/api/v1/notifications')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            type: 'SYSTEM',
            message: `Notificación múltiple ${i + 1}`,
            userId: userId,
          });
        ids.push(createResponse.body.data.id);
      }

      const response = await request(app)
        .post('/api/v1/notifications/mark-read')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ notificationIds: ids });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('updatedCount');
      expect(response.body.data.updatedCount).toBe(3);
    });

    // Debería validar que se proporcionen IDs
    it('should validate notification IDs are provided', async () => {
      const response = await request(app)
        .post('/api/v1/notifications/mark-read')
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    // Debería validar formato de UUIDs
    it('should validate UUID format in array', async () => {
      const response = await request(app)
        .post('/api/v1/notifications/mark-read')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ notificationIds: ['invalid-uuid'] });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/notifications/mark-all-read - Mark All as Read', () => {
    // Debería marcar todas las notificaciones como leídas
    it('should mark all notifications as read', async () => {
      const response = await request(app)
        .post('/api/v1/notifications/mark-all-read')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('updatedCount');
      expect(typeof response.body.data.updatedCount).toBe('number');
    });

    // Debería rechazar sin autenticación
    it('should reject without authentication', async () => {
      const response = await request(app).post('/api/v1/notifications/mark-all-read');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    // Después de marcar todas, el conteo de no leídas debería ser 0
    it('should result in 0 unread count after marking all', async () => {
      // Marcar todas como leídas
      await request(app)
        .post('/api/v1/notifications/mark-all-read')
        .set('Authorization', `Bearer ${userToken}`);

      // Verificar conteo
      const countResponse = await request(app)
        .get('/api/v1/notifications/unread-count')
        .set('Authorization', `Bearer ${userToken}`);

      expect(countResponse.body.data.unreadCount).toBe(0);
    });
  });
});
