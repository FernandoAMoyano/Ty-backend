import request from 'supertest';
import app from '../../src/app';
import { loginAsAdmin, loginTestUser } from '../setup/helpers';

describe('Notifications Complete Flow E2E Tests', () => {
  let adminToken: string;
  let userToken: string;
  let userId: string;

  beforeAll(async () => {
    // Login como admin
    adminToken = await loginAsAdmin();

    // Crear y loguear usuario de prueba
    const userData = await loginTestUser();
    userToken = userData.token;
    userId = userData.user.id;
  });

  /**
   * FLUJO COMPLETO: Ciclo de vida de notificaciones
   * 
   * Este test simula el flujo completo desde la perspectiva del usuario:
   * 1. Admin crea notificaciones para el usuario
   * 2. Usuario consulta sus notificaciones
   * 3. Usuario verifica conteo de no leídas
   * 4. Usuario marca notificaciones como leídas
   * 5. Usuario verifica que el conteo se actualiza
   */
  it('should complete full notification lifecycle flow', async () => {
    // ==========================================
    // FASE 1: ESTADO INICIAL
    // ==========================================

    // 1.1 Verificar conteo inicial de no leídas
    const initialCountResponse = await request(app)
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', `Bearer ${userToken}`);

    expect(initialCountResponse.status).toBe(200);
    const initialUnreadCount = initialCountResponse.body.data.unreadCount;

    // ==========================================
    // FASE 2: ADMIN CREA NOTIFICACIONES
    // ==========================================

    // 2.1 Admin crea notificación de confirmación de cita
    const notification1Response = await request(app)
      .post('/api/v1/notifications')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        type: 'APPOINTMENT_CONFIRMATION',
        message: 'Tu cita ha sido confirmada para el 15 de enero a las 10:00',
        userId: userId,
      });

    expect(notification1Response.status).toBe(201);
    expect(notification1Response.body.success).toBe(true);
    const notification1Id = notification1Response.body.data.id;

    // 2.2 Admin crea notificación de recordatorio
    const notification2Response = await request(app)
      .post('/api/v1/notifications')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        type: 'APPOINTMENT_REMINDER',
        message: 'Recordatorio: Tu cita es mañana a las 10:00',
        userId: userId,
      });

    expect(notification2Response.status).toBe(201);
    const notification2Id = notification2Response.body.data.id;

    // 2.3 Admin crea notificación promocional
    const notification3Response = await request(app)
      .post('/api/v1/notifications')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        type: 'PROMOTIONAL',
        message: '¡20% de descuento en cortes este fin de semana!',
        userId: userId,
      });

    expect(notification3Response.status).toBe(201);
    const notification3Id = notification3Response.body.data.id;

    // ==========================================
    // FASE 3: USUARIO CONSULTA NOTIFICACIONES
    // ==========================================

    // 3.1 Verificar que el conteo aumentó en 3
    const afterCreateCountResponse = await request(app)
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', `Bearer ${userToken}`);

    expect(afterCreateCountResponse.status).toBe(200);
    expect(afterCreateCountResponse.body.data.unreadCount).toBe(initialUnreadCount + 3);

    // 3.2 Obtener lista de notificaciones
    const notificationsListResponse = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${userToken}`);

    expect(notificationsListResponse.status).toBe(200);
    expect(notificationsListResponse.body.data.notifications.length).toBeGreaterThanOrEqual(3);
    expect(notificationsListResponse.body.data.total).toBeGreaterThanOrEqual(3);

    // 3.3 Verificar paginación
    const paginatedResponse = await request(app)
      .get('/api/v1/notifications?page=1&limit=2')
      .set('Authorization', `Bearer ${userToken}`);

    expect(paginatedResponse.status).toBe(200);
    expect(paginatedResponse.body.data.notifications.length).toBeLessThanOrEqual(2);
    expect(paginatedResponse.body.data.page).toBe(1);
    expect(paginatedResponse.body.data.limit).toBe(2);

    // 3.4 Filtrar por tipo
    const filteredResponse = await request(app)
      .get('/api/v1/notifications?type=PROMOTIONAL')
      .set('Authorization', `Bearer ${userToken}`);

    expect(filteredResponse.status).toBe(200);
    filteredResponse.body.data.notifications.forEach((n: any) => {
      expect(n.type).toBe('PROMOTIONAL');
    });

    // 3.5 Obtener notificación específica por ID
    const singleNotificationResponse = await request(app)
      .get(`/api/v1/notifications/${notification1Id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(singleNotificationResponse.status).toBe(200);
    expect(singleNotificationResponse.body.data.id).toBe(notification1Id);
    expect(singleNotificationResponse.body.data.type).toBe('APPOINTMENT_CONFIRMATION');

    // ==========================================
    // FASE 4: USUARIO MARCA COMO LEÍDAS
    // ==========================================

    // 4.1 Marcar una notificación individual como leída
    const markSingleResponse = await request(app)
      .patch(`/api/v1/notifications/${notification1Id}/read`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(markSingleResponse.status).toBe(200);
    expect(markSingleResponse.body.data.isRead).toBe(true);

    // 4.2 Verificar que el conteo bajó en 1
    const afterMarkSingleCountResponse = await request(app)
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', `Bearer ${userToken}`);

    expect(afterMarkSingleCountResponse.body.data.unreadCount).toBe(initialUnreadCount + 2);

    // 4.3 Marcar múltiples notificaciones como leídas
    const markMultipleResponse = await request(app)
      .post('/api/v1/notifications/mark-read')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        notificationIds: [notification2Id, notification3Id],
      });

    expect(markMultipleResponse.status).toBe(200);
    expect(markMultipleResponse.body.data.updatedCount).toBe(2);

    // 4.4 Verificar que el conteo volvió al inicial
    const afterMarkMultipleCountResponse = await request(app)
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', `Bearer ${userToken}`);

    expect(afterMarkMultipleCountResponse.body.data.unreadCount).toBe(initialUnreadCount);

    // ==========================================
    // FASE 5: FILTRO UNREAD ONLY
    // ==========================================

    // 5.1 Crear una nueva notificación para probar filtro
    const notification4Response = await request(app)
      .post('/api/v1/notifications')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        type: 'SYSTEM',
        message: 'Notificación del sistema para probar filtro',
        userId: userId,
      });

    expect(notification4Response.status).toBe(201);

    // 5.2 Filtrar solo no leídas
    const unreadOnlyResponse = await request(app)
      .get('/api/v1/notifications?unreadOnly=true')
      .set('Authorization', `Bearer ${userToken}`);

    expect(unreadOnlyResponse.status).toBe(200);
    expect(unreadOnlyResponse.body.data.notifications.length).toBeGreaterThanOrEqual(1);

    // ==========================================
    // FASE 6: MARCAR TODAS COMO LEÍDAS
    // ==========================================

    // 6.1 Marcar todas como leídas
    const markAllResponse = await request(app)
      .post('/api/v1/notifications/mark-all-read')
      .set('Authorization', `Bearer ${userToken}`);

    expect(markAllResponse.status).toBe(200);
    expect(markAllResponse.body.data.updatedCount).toBeGreaterThanOrEqual(0);

    // 6.2 Verificar que el conteo es 0
    const finalCountResponse = await request(app)
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', `Bearer ${userToken}`);

    expect(finalCountResponse.status).toBe(200);
    expect(finalCountResponse.body.data.unreadCount).toBe(0);

    // 6.3 Verificar que filtro unreadOnly retorna vacío
    const emptyUnreadResponse = await request(app)
      .get('/api/v1/notifications?unreadOnly=true')
      .set('Authorization', `Bearer ${userToken}`);

    expect(emptyUnreadResponse.status).toBe(200);
    expect(emptyUnreadResponse.body.data.notifications.length).toBe(0);
  });

  /**
   * FLUJO DE SEGURIDAD: Verificar aislamiento entre usuarios
   * 
   * Este test verifica que un usuario no puede:
   * - Ver notificaciones de otro usuario
   * - Marcar notificaciones de otro usuario como leídas
   */
  it('should enforce user isolation and security', async () => {
    // Crear segundo usuario
    const secondUserData = await loginTestUser();
    const secondUserToken = secondUserData.token;

    // Admin crea notificación para el primer usuario
    const notificationResponse = await request(app)
      .post('/api/v1/notifications')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        type: 'SYSTEM',
        message: 'Notificación privada para usuario 1',
        userId: userId,
      });

    expect(notificationResponse.status).toBe(201);
    const privateNotificationId = notificationResponse.body.data.id;

    // Segundo usuario intenta ver la notificación del primero
    // El API retorna 422 (Unprocessable Entity) para acceso no autorizado a recursos
    const accessAttemptResponse = await request(app)
      .get(`/api/v1/notifications/${privateNotificationId}`)
      .set('Authorization', `Bearer ${secondUserToken}`);

    expect([403, 422]).toContain(accessAttemptResponse.status);
    expect(accessAttemptResponse.body.success).toBe(false);

    // Segundo usuario intenta marcar como leída la notificación del primero
    const markAttemptResponse = await request(app)
      .patch(`/api/v1/notifications/${privateNotificationId}/read`)
      .set('Authorization', `Bearer ${secondUserToken}`);

    expect([403, 422]).toContain(markAttemptResponse.status);
    expect(markAttemptResponse.body.success).toBe(false);

    // Verificar que el primer usuario sí puede acceder
    const ownerAccessResponse = await request(app)
      .get(`/api/v1/notifications/${privateNotificationId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(ownerAccessResponse.status).toBe(200);
    expect(ownerAccessResponse.body.data.id).toBe(privateNotificationId);
  });

  /**
   * FLUJO DE PERMISOS: Solo admin puede crear notificaciones
   */
  it('should restrict notification creation to admin only', async () => {
    // Usuario normal intenta crear notificación
    const userCreateAttempt = await request(app)
      .post('/api/v1/notifications')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'SYSTEM',
        message: 'Intento de crear notificación como usuario',
        userId: userId,
      });

    // Debería ser rechazado (401 por el middleware de autorización)
    expect(userCreateAttempt.status).toBe(401);
    expect(userCreateAttempt.body.success).toBe(false);

    // Sin autenticación
    const noAuthAttempt = await request(app)
      .post('/api/v1/notifications')
      .send({
        type: 'SYSTEM',
        message: 'Intento sin autenticación',
        userId: userId,
      });

    expect(noAuthAttempt.status).toBe(401);
    expect(noAuthAttempt.body.success).toBe(false);
  });

  /**
   * FLUJO DE TIPOS: Verificar todos los tipos de notificación
   */
  it('should support all notification types', async () => {
    const notificationTypes = [
      'APPOINTMENT_CONFIRMATION',
      'APPOINTMENT_REMINDER',
      'APPOINTMENT_CANCELLATION',
      'PROMOTIONAL',
      'SYSTEM',
    ];

    for (const type of notificationTypes) {
      const response = await request(app)
        .post('/api/v1/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: type,
          message: `Notificación de prueba tipo ${type}`,
          userId: userId,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.type).toBe(type);
    }

    // Verificar que se pueden filtrar por cada tipo
    for (const type of notificationTypes) {
      const filterResponse = await request(app)
        .get(`/api/v1/notifications?type=${type}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(filterResponse.status).toBe(200);
      if (filterResponse.body.data.notifications.length > 0) {
        filterResponse.body.data.notifications.forEach((n: any) => {
          expect(n.type).toBe(type);
        });
      }
    }
  });
});
