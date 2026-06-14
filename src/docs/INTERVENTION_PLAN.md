# Plan de Intervención — Auditoría de Consistencia

> Fecha: 2026-06-14 | Versión: 1.0
> Alcance: 26 issues identificados cruzando los 9 documentos de business rules + código fuente
> Objetivo: Definir la acción concreta para cada inconsistencia antes de implementar

---

## Tipos de intervención

| Tipo | Significado |
|------|-------------|
| **FIX_CODE** | Requiere cambios en código fuente (use cases, entities, validations, routes) |
| **FIX_DOCS** | Requiere actualizar documentación de business rules para reflejar el estado real |
| **FIX_AMBOS** | Requiere cambios en código Y actualización de documentación |
| **DOCUMENTAR** | No requiere cambio de código; se documenta como limitación conocida o decisión de diseño |
| **DIFERIR** | Feature completa para una fase futura; se documenta la intención |

---

## Resumen ejecutivo

| Tipo | Cantidad | IDs |
|------|----------|-----|
| FIX_CODE | 12 | 01, 02, 03, 04, 05, 06, 07, 13, 14, 15, 19, 25 |
| FIX_DOCS | 4 | 08, 10, 11, 22 |
| FIX_AMBOS | 1 | 09 |
| DOCUMENTAR | 7 | 16, 17, 18, 20, 23, 24, 26 |
| DIFERIR | 2 | 12, 21 |
| **Total** | **26** | |

---

## Severidad

| Nivel | Significado |
|-------|-------------|
| **CRÍTICA** | Bloquea funcionalidad core o produce errores en runtime |
| **ALTA** | Permite estados de datos inconsistentes o viola lógica de negocio importante |
| **MEDIA** | Inconsistencia que no produce errores pero degrada la calidad del sistema |
| **BAJA** | Inconsistencia cosmética o de convenciones |

---

## Todos los issues

---

### ISSUE-01 — DeleteCategory no valida servicios asociados

| Campo | Valor |
|-------|-------|
| Origen | Session Handoff #1 |
| Archivo | `services/application/use-cases/DeleteCategory.ts` |
| Severidad | **MEDIA** |
| Intervención | **FIX_CODE** |
| Dependencias | Ninguna |

**Diagnóstico:** El use case solo verifica que la categoría exista (`existsById`) y la elimina. Si la categoría tiene servicios asociados, el FK constraint de Prisma produce un error 500 genérico en vez de un `BusinessRuleError` controlado.

**Acción:** Inyectar `IServiceRepository`, consultar si existen servicios con ese `categoryId`, y lanzar `BusinessRuleError('Cannot delete a category with associated services')` si los hay. Agregar test para el caso de rechazo.

---

### ISSUE-02 — DeleteService no valida citas activas

| Campo | Valor |
|-------|-------|
| Origen | Session Handoff #2 |
| Archivo | `services/application/use-cases/DeleteService.ts` |
| Severidad | **MEDIA** |
| Intervención | **FIX_CODE** |
| Dependencias | Ninguna |

**Diagnóstico:** Mismo patrón que ISSUE-01. Solo verifica existencia y elimina. Si el servicio tiene citas pendientes/confirmadas, la eliminación deja citas huérfanas o falla por FK.

**Acción:** Inyectar `IAppointmentRepository`, consultar citas no terminales (no COMPLETED, CANCELLED, NO_SHOW) que incluyan ese `serviceId`, y lanzar `BusinessRuleError('Cannot delete a service with active appointments')` si existen. Agregar test.

---

### ISSUE-03 — AssignServiceToStylist no valida isActive del servicio

| Campo | Valor |
|-------|-------|
| Origen | Session Handoff #3 |
| Archivo | `services/application/use-cases/AssignServiceToStylist.ts` |
| Severidad | **BAJA** |
| Intervención | **FIX_CODE** |
| Dependencias | Ninguna |

**Diagnóstico:** El use case verifica que el servicio exista (`findById`) pero no que esté activo. Permite asignar un servicio desactivado a un estilista.

**Acción:** Después de `findById`, agregar check `if (!service.isActive) throw new BusinessRuleError('Cannot assign an inactive service')`. Agregar test.

---

### ISSUE-04 — CreateAppointment acepta clientId ambiguo

| Campo | Valor |
|-------|-------|
| Origen | Session Handoff #4 |
| Archivo | `appointments/application/use-cases/CreateAppointment.ts` |
| Severidad | **MEDIA** |
| Intervención | **FIX_CODE** |
| Dependencias | Ninguna |

**Diagnóstico:** `validateRelatedEntitiesAndGetClientId()` intenta buscar por `Client.id` primero, y si no encuentra, busca por `User.id` via `findByUserId()`. Esto crea un contrato ambiguo: el consumidor de la API no sabe si debe enviar `Client.id` o `User.id`, y el comportamiento varía silenciosamente.

**Acción:** Definir un contrato claro. Recomendación: el `clientId` del DTO debe ser siempre el `User.id` (que es lo que el frontend conoce tras el login). El use case busca el Client por `findByUserId()` y si no existe lanza `NotFoundError`. Eliminar el fallback ambiguo. Actualizar business rules. Agregar/ajustar tests.

---

### ISSUE-05 — CreateNotification no verifica existencia del usuario

| Campo | Valor |
|-------|-------|
| Origen | Session Handoff #5 |
| Archivo | `notifications/application/use-cases/CreateNotification.ts` |
| Severidad | **BAJA** |
| Intervención | **FIX_CODE** |
| Dependencias | Ninguna |

**Diagnóstico:** Valida formato UUID del `userId` pero no verifica que el usuario exista en la BD. Crearía notificaciones huérfanas.

**Acción:** Inyectar `IUserRepository`, consultar `findById(dto.userId)`, lanzar `NotFoundError('User', dto.userId)` si no existe. Agregar test.

---

### ISSUE-06 — CreatePayment sin validación de cita (existencia ni estado)

| Campo | Valor |
|-------|-------|
| Origen | Session Handoff #6 + Auditoría B5 |
| Archivo | `payments/application/use-cases/CreatePayment.ts` |
| Severidad | **ALTA** |
| Intervención | **FIX_CODE** |
| Dependencias | Ninguna |

**Diagnóstico:** Dos problemas combinados. Primero, solo valida formato UUID del `appointmentId`, no verifica que la cita exista — permite pagos para citas inexistentes. Segundo, no verifica el estado de la cita — permite crear pagos para citas CANCELLED o PENDING. Además, no hay restricción de unicidad: se pueden crear múltiples pagos para la misma cita sin control.

**Acción (existencia):** Inyectar `IAppointmentRepository`, consultar `findById(dto.appointmentId)`, lanzar `NotFoundError('Appointment', dto.appointmentId)` si no existe. Agregar test.

**Acción (estado):** Decidir qué estados permiten pago. Se permite crear pagos solo para citas en estado CONFIRMED o COMPLETED. Lanzar `BusinessRuleError('Cannot create a payment for an appointment with status X')` si el estado no es válido. Agregar test.

**Acción (unicidad):** Documentar como decisión de diseño que se permiten múltiples pagos por cita (pagos parciales, split payments). No requiere código, solo documentación en `08-payments.md`.

> **Nota:** Las validaciones de estado requieren inyectar también `IAppointmentStatusRepository` para resolver el nombre del estado desde el `statusId`.

---

### ISSUE-07 — DeleteHoliday usa Error genérico

| Campo | Valor |
|-------|-------|
| Origen | Session Handoff #8 |
| Archivo | `holidays/application/use-cases/DeleteHoliday.ts` |
| Severidad | **BAJA** |
| Intervención | **FIX_CODE** |
| Dependencias | Ninguna |

**Diagnóstico:** Usa `throw new Error('Feriado no encontrado')` en vez de `throw new NotFoundError('Holiday', id)`. Rompe la convención de excepciones tipadas y el mensaje está en español (la convención de dominio es inglés).

**Acción:** Reemplazar por `throw new NotFoundError('Holiday', id)`. Ajustar import si no existe. Ajustar test existente si valida el mensaje exacto.

---

### ISSUE-08 — Precio en centavos (Services) vs float directo (Payments)

| Campo | Valor |
|-------|-------|
| Origen | Auditoría A1 |
| Archivos | `services/presentation/validations/ServiceValidations.ts`, `payments/presentation/validations/PaymentValidations.ts`, `payments/domain/entities/Payment.ts` |
| Severidad | **MEDIA** |
| Intervención | **FIX_DOCS** |
| Dependencias | Ninguna |

**Diagnóstico:** Services y StylistService almacenan precios en centavos (sanitizer `Math.round(value * 100)`). Payments almacena `amount` como float directo sin conversión. El consumidor de la API no tiene documentación que aclare esta diferencia.

El monto del pago es intencionalmente independiente del precio de los servicios (permite descuentos, propinas, cobros parciales), así que no es un bug — es una decisión de diseño no documentada.

**Acción:** Agregar sección en `08-payments.md` que documente explícitamente:
- El `amount` del pago se expresa en la unidad monetaria base (ej: pesos, dólares), NO en centavos
- El monto es independiente de los precios de servicios (permite flexibilidad operativa)
- La conversión entre precio-servicio (centavos) y monto-pago (moneda base) es responsabilidad del consumidor de la API

Agregar nota cruzada en `03-services.md` sección "Relaciones con Otros Módulos" explicando la diferencia de unidades.

---

### ISSUE-09 — Duración máxima inconsistente: 600 min (Services) vs 480 min (Appointments)

| Campo | Valor |
|-------|-------|
| Origen | Auditoría A2 |
| Archivos | `services/domain/entities/Service.ts`, `appointments/domain/entities/Appointment.ts`, `appointments/application/use-cases/GetAvailableSlots.ts` |
| Severidad | **ALTA** |
| Intervención | **FIX_AMBOS** |
| Dependencias | Ninguna |

**Diagnóstico:** Un servicio puede tener duración de hasta 600 minutos. Pero una cita tiene máximo 480 minutos, y GetAvailableSlots también limita a 480. Si se selecciona un servicio de 500 min al crear una cita, la duración auto-calculada sería 500, pero la validación de la entidad Appointment rechaza >480. Peor aún: la suma de múltiples servicios podría superar 480 fácilmente.

**Acción (código):** Reducir la duración máxima de Service de 600 a 480 minutos. Cambiar en:
- `Service.ts` → validación `this.duration > 600` → `this.duration > 480`
- `ServiceValidations.ts` → `isInt({ min: 1, max: 600 })` → `isInt({ min: 1, max: 480 })`

**Acción (docs):** Actualizar `03-services.md` → "Duración máxima: 480 minutos (8 horas)" en las secciones 2, 4.1 y 4.2.

**Alternativa descartada:** Subir el máximo de Appointment a 600 no tiene sentido porque GetAvailableSlots no genera slots para duraciones >480 min, así que la cita no tendría slot disponible de todas formas.

> **Nota:** Verificar si existen servicios en el seed/BD con duración >480 que necesiten ajuste.

---

### ISSUE-10 — Permisos de confirmación: tabla contradice regla textual y código

| Campo | Valor |
|-------|-------|
| Origen | Auditoría A3 |
| Archivo | `06-appointments.md`, `appointments/application/use-cases/ConfirmAppointment.ts` |
| Severidad | **MEDIA** |
| Intervención | **FIX_DOCS** |
| Dependencias | Ninguna |

**Diagnóstico:** Tres fuentes se contradicen:

| Fuente | ¿ADMIN puede? | ¿CLIENT puede? |
|--------|---------------|-----------------|
| Tabla de permisos (doc) | ✅ | ❌ |
| Regla 4.3 (doc) | No mencionado explícitamente | ✅ (como creador) |
| Código (`ConfirmAppointment.ts`) | ❌ (salvo que sea el creador) | ✅ (si es el creador) |

El modelo del código es **ownership-based**: puede confirmar quien creó la cita (`userId`) o el estilista asignado (`stylistId`). El rol es irrelevante. La tabla de permisos describe un modelo **role-based** que no está implementado.

**Acción:** Reescribir la tabla de permisos en `06-appointments.md` sección 3 para reflejar el modelo real (ownership-based). Cambiar la columna de la tabla de roles a entidades participantes. Actualizar regla 4.3 para ser explícita:
- Confirmar: El creador (`userId`) o el estilista asignado (`stylistId`). El rol no influye.
- Agregar nota: "ADMIN override no está implementado actualmente — los permisos son por participación en la cita, no por rol."

Repetir el mismo patrón para cancelación (regla 4.4), que tiene la misma discrepancia.

---

### ISSUE-11 — Permisos de consulta por estilista no restringidos

| Campo | Valor |
|-------|-------|
| Origen | Auditoría A4 |
| Archivo | `06-appointments.md`, `appointments/presentation/routes/AppointmentRoutes.ts` |
| Severidad | **BAJA** |
| Intervención | **FIX_DOCS** |
| Dependencias | ISSUE-10 |

**Diagnóstico:** La tabla dice CLIENT ❌ para "Ver citas por estilista", pero la ruta solo usa `authenticate` sin `authorize`. Cualquier autenticado puede acceder.

**Acción:** Actualizar tabla de permisos en `06-appointments.md` para reflejar que todas las rutas de consulta son accesibles por cualquier usuario autenticado (ADMIN ✅, STYLIST ✅, CLIENT ✅). Esto es consistente con el hecho de que las rutas no usan `authorize`.

**Alternativa (no recomendada ahora):** Agregar `authorize(['ADMIN', 'STYLIST'])` a la ruta. No se recomienda porque cambiaría el contrato actual sin necesidad funcional clara.

---

### ISSUE-12 — Feriados y excepciones no afectan disponibilidad ni creación de citas

| Campo | Valor |
|-------|-------|
| Origen | Auditoría B1 |
| Archivos | `appointments/application/use-cases/GetAvailableSlots.ts`, `appointments/application/use-cases/CreateAppointment.ts` |
| Severidad | **ALTA** |
| Intervención | **DIFERIR** |
| Dependencias | Ninguna |

**Diagnóstico:** `GetAvailableSlots` no inyecta ni consulta repositorios de holidays o schedule exceptions. Solo busca el `Schedule` por día de la semana. `CreateAppointment` tiene tres TODOs explícitos reconociendo la carencia:
```
// TODO: Validar horarios de trabajo del estilista
// TODO: Validar días festivos
// TODO: Validar horarios de la tienda
```
El documento `09-holidays.md` también reconoce: "Esta integración debe implementarse en el módulo de Appointments".

**Razón para diferir:** Implementar esta integración requiere:
1. Inyectar `IHolidayRepository` y `IScheduleExceptionRepository` en `GetAvailableSlots` y `CreateAppointment`
2. Definir la lógica de prioridad: Schedule Exception > Holiday > Schedule regular
3. Definir qué significa un Holiday sin ScheduleException (¿cerrado por defecto?)
4. Ajustar tests existentes que mockean estos use cases
5. Potencialmente re-diseñar el DI container de appointments

Es una feature completa que afecta múltiples capas, no un fix puntual.

**Acción:** Documentar como limitación conocida en `05-schedules.md` y `06-appointments.md`. Mantener los TODOs en el código. Agregar ticket/nota en el README como mejora planificada.

---

### ISSUE-13 — CreateAppointment no valida que los servicios estén activos

| Campo | Valor |
|-------|-------|
| Origen | Auditoría B2 |
| Archivo | `appointments/application/use-cases/CreateAppointment.ts` |
| Severidad | **ALTA** |
| Intervención | **FIX_CODE** |
| Dependencias | Ninguna |

**Diagnóstico:** En `validateRelatedEntitiesAndGetClientId()`, el loop de servicios solo verifica existencia (`findById`). No verifica `service.isActive`. Una cita puede incluir servicios desactivados.

**Acción:** En el loop de servicios, después de `findById`, agregar:
```typescript
if (!service.isActive) {
  throw new BusinessRuleError(`Service '${service.name}' is not currently active`);
}
```
Agregar test para el caso de rechazo.

---

### ISSUE-14 — CreateAppointment no valida que el estilista ofrezca los servicios

| Campo | Valor |
|-------|-------|
| Origen | Auditoría B3 |
| Archivo | `appointments/application/use-cases/CreateAppointment.ts` |
| Severidad | **ALTA** |
| Intervención | **FIX_CODE** |
| Dependencias | Ninguna |

**Diagnóstico:** Cuando se crea una cita con `stylistId`, no se verifica que ese estilista tenga asignados los servicios seleccionados ni que los esté ofreciendo (`isOffering = true`). Se puede asignar un estilista a una cita con servicios que no ofrece.

**Acción:** Inyectar `IStylistServiceRepository` en `CreateAppointment`. Cuando `stylistId` está presente, para cada `serviceId`:
```typescript
const assignment = await this.stylistServiceRepository.findByStylistAndService(stylistId, serviceId);
if (!assignment) {
  throw new BusinessRuleError(`Stylist does not offer service '${service.name}'`);
}
if (!assignment.isOffering) {
  throw new BusinessRuleError(`Stylist is not currently offering service '${service.name}'`);
}
```
Agregar tests. Actualizar `06-appointments.md` regla 4.1.

> **Nota:** Requiere verificar que `IStylistServiceRepository` tenga el método `findByStylistAndService` o agregarlo.

---

### ISSUE-15 — CreateAppointment no valida que la hora esté dentro del horario laboral

| Campo | Valor |
|-------|-------|
| Origen | Auditoría B4 |
| Archivo | `appointments/application/use-cases/CreateAppointment.ts` |
| Severidad | **ALTA** |
| Intervención | **FIX_CODE** |
| Dependencias | Ninguna |

**Diagnóstico:** `getAppropriateSchedule()` obtiene el Schedule del día y lo usa para `scheduleId`, pero nunca valida que la hora de la cita caiga dentro de `startTime`-`endTime`. Una cita a las 3:00 AM de un lunes con horario 9:00-18:00 sería aceptada.

**Acción:** En `validateAvailability()` o en un nuevo método, comparar la hora de la cita contra `schedule.startTime` y `schedule.endTime`. Verificar también que la cita completa (inicio + duración) termine antes de `endTime`:
```typescript
if (appointmentTime < schedule.startTime || appointmentEndTime > schedule.endTime) {
  throw new BusinessRuleError('Appointment must be within working hours');
}
```
Agregar test. Actualizar `06-appointments.md` regla 4.1.

---

### ISSUE-16 — Datos de cancelación, confirmación y reembolso se validan pero no se almacenan

| Campo | Valor |
|-------|-------|
| Origen | Auditoría B6 + Session Handoff #7 |
| Archivos | `CancelAppointment.ts`, `ConfirmAppointment.ts`, `RefundPayment.ts`, entidades `Appointment` y `Payment` |
| Severidad | **MEDIA** |
| Intervención | **DOCUMENTAR** |
| Dependencias | Ninguna |

**Diagnóstico:** Tres campos pasan por validación en la capa de presentación (express-validator) pero se descartan en la capa de aplicación:

| Use Case | Campo validado | Qué pasa |
|----------|---------------|----------|
| CancelAppointment | `reason` (máx 500), `cancelledBy` (enum) | `addCancellationReason()` solo actualiza `updatedAt` |
| ConfirmAppointment | `notes` (máx 500) | `addConfirmationNotes()` solo actualiza `updatedAt` |
| RefundPayment | `reason` (máx 500) | El use case ignora el campo completamente |

Las entidades Appointment y Payment no tienen campos para almacenar esta información.

**Razón para no arreglar ahora:** Agregar campos requiere:
1. Modificar las entidades de dominio
2. Crear migración Prisma para nuevas columnas
3. Actualizar mappers de infraestructura
4. Actualizar DTOs de respuesta
5. Ajustar tests existentes

Es un cambio transversal que aporta valor pero no es crítico para la integridad del sistema.

**Acción:** Documentar en `06-appointments.md` y `08-payments.md` como limitación conocida:
> "Los campos `reason`, `cancelledBy` y `notes` son aceptados y validados por la API pero no se persisten actualmente. Serán almacenados en una futura iteración."

---

### ISSUE-17 — Desactivación de usuario estilista sin efecto cascada

| Campo | Valor |
|-------|-------|
| Origen | Auditoría B7 |
| Archivos | `01-auth.md`, `04-stylists.md`, `06-appointments.md` |
| Severidad | **MEDIA** |
| Intervención | **DOCUMENTAR** |
| Dependencias | Ninguna |

**Diagnóstico:** Si se desactiva un User con rol STYLIST (`isActive = false`):
- No puede loguearse (correcto)
- Sus asignaciones StylistService permanecen activas
- Sus citas pendientes/confirmadas siguen vigentes
- Sigue apareciendo en consultas de estilistas por servicio

No hay documentación de este escenario ni del comportamiento esperado.

**Acción:** Documentar en `01-auth.md` sección "Relaciones con Otros Módulos" y en `04-stylists.md`:
> "La desactivación de un usuario no tiene efecto cascada sobre sus entidades asociadas (StylistService, Appointments). Las citas existentes permanecen en su estado actual. Se recomienda cancelar manualmente las citas pendientes antes de desactivar un estilista."

---

### ISSUE-18 — Desactivación de categoría sin impacto coherente en servicios

| Campo | Valor |
|-------|-------|
| Origen | Auditoría B8 |
| Archivo | `02-categories.md` |
| Severidad | **BAJA** |
| Intervención | **DOCUMENTAR** |
| Dependencias | Ninguna |

**Diagnóstico:** Al desactivar una categoría, sus servicios siguen activos. El servicio es reservable pero su categoría no aparece en listados públicos. Es una decisión de diseño válida pero no documentada como intencional.

**Acción:** Agregar nota explícita en `02-categories.md` sección 4.4:
> "Decisión de diseño: los servicios de una categoría inactiva permanecen accesibles individualmente (por ID, búsqueda, listado general). Solo la navegación por categoría se ve afectada."

---

### ISSUE-19 — Entidad Appointment valida fecha pasada en constructor (afecta fromPersistence)

| Campo | Valor |
|-------|-------|
| Origen | Auditoría B9 |
| Archivo | `appointments/domain/entities/Appointment.ts` |
| Severidad | **CRÍTICA** |
| Intervención | **FIX_CODE** |
| Dependencias | Ninguna |

**Diagnóstico:** El constructor de Appointment llama `this.validate()` → `validateDateTime()` → `if (this.dateTime < new Date()) throw ValidationError`. El método `fromPersistence()` usa el mismo constructor. Reconstruir una cita pasada desde la base de datos lanzaría un `ValidationError`, lo cual impediría listar o consultar citas históricas.

> **Nota:** Es posible que los tests pasen porque los mocks del repositorio devuelven objetos planos o entidades pre-construidas sin pasar por `fromPersistence()`, enmascarando el bug.

**Acción:** Mover la validación de fecha pasada FUERA del constructor. Solo debe ejecutarse en el factory method `create()` (nuevas citas), no en `fromPersistence()` (reconstrucción). Opciones:
- Opción A: `fromPersistence()` llama al constructor sin validación (crear un flag interno o un constructor separado)
- Opción B (recomendada): Separar `validate()` en `validateForCreation()` (incluye fecha futura) y `validateForPersistence()` (solo formato). `create()` llama a la primera, `fromPersistence()` a la segunda.

Agregar test que verifique que `fromPersistence()` funciona con fechas pasadas.

---

### ISSUE-20 — No hay límite de citas por cliente por día

| Campo | Valor |
|-------|-------|
| Origen | Auditoría C1 |
| Archivo | `06-appointments.md` |
| Severidad | **BAJA** |
| Intervención | **DOCUMENTAR** |
| Dependencias | Ninguna |

**Diagnóstico:** Un cliente puede crear citas ilimitadas para el mismo día. No hay validación de cantidad.

**Acción:** Documentar en `06-appointments.md` sección 4.1 como limitación conocida:
> "No existe actualmente un límite de citas por cliente por día. La protección contra abuso depende de la validación de conflictos de horario."

---

### ISSUE-21 — No hay cancelación automática de citas al crear feriado

| Campo | Valor |
|-------|-------|
| Origen | Auditoría C2 |
| Archivos | `holidays/application/use-cases/CreateHoliday.ts`, `06-appointments.md` |
| Severidad | **MEDIA** |
| Intervención | **DIFERIR** |
| Dependencias | ISSUE-12 |

**Diagnóstico:** Si se crea un feriado para una fecha que ya tiene citas pendientes, esas citas no se cancelan automáticamente. Requiere integración entre módulos Holidays y Appointments.

**Razón para diferir:** Depende de ISSUE-12 (integración holidays-appointments). Una vez que los feriados afecten la disponibilidad, la cancelación automática sería el siguiente paso lógico. Implementarlo antes no tiene sentido sin la base.

**Acción:** Documentar en `09-holidays.md` como feature planificada:
> "Actualmente, crear un feriado no afecta las citas existentes para esa fecha. En una futura iteración, se implementará notificación y/o cancelación automática de citas afectadas."

---

### ISSUE-22 — Feriado sin excepción: comportamiento indefinido

| Campo | Valor |
|-------|-------|
| Origen | Auditoría C3 |
| Archivo | `09-holidays.md` |
| Severidad | **MEDIA** |
| Intervención | **FIX_DOCS** |
| Dependencias | ISSUE-12 |

**Diagnóstico:** Un feriado puede existir sin una ScheduleException asociada. En ese caso, no está definido si el salón está cerrado, tiene horario normal, o tiene horario reducido. Como la integración holidays-appointments no está implementada (ISSUE-12), este vacío no tiene efecto en runtime ahora, pero debe documentarse para cuando se implemente.

**Acción:** Agregar en `09-holidays.md` sección 4 una regla que defina la intención:
> "Un feriado sin excepción de horario asociada se interpreta como día cerrado (sin disponibilidad). Si el salón opera en un feriado con horario especial, se debe crear una ScheduleException vinculada."

---

### ISSUE-23 — ScheduleException permite fechas pasadas

| Campo | Valor |
|-------|-------|
| Origen | Auditoría C4 |
| Archivo | `09-holidays.md` |
| Severidad | **BAJA** |
| Intervención | **DOCUMENTAR** |
| Dependencias | Ninguna |

**Diagnóstico:** No hay validación que impida crear una ScheduleException para una fecha pasada. Tampoco para Holiday.

**Acción:** Documentar como decisión de diseño en `09-holidays.md`:
> "Se permite crear feriados y excepciones para fechas pasadas para mantener un registro histórico. Las propiedades computadas `isPast`, `isToday` y `isFuture` permiten filtrar según necesidad."

---

### ISSUE-24 — Monto de pago no vinculado a precios de servicios

| Campo | Valor |
|-------|-------|
| Origen | Auditoría C5 |
| Archivo | `08-payments.md` |
| Severidad | **BAJA** |
| Intervención | **DOCUMENTAR** |
| Dependencias | ISSUE-08 |

**Diagnóstico:** El `amount` del pago es completamente arbitrario. No hay validación que lo vincule con la suma de precios de los servicios de la cita. Se pueden crear pagos con montos que no corresponden al costo real del servicio.

**Acción:** Documentar en `08-payments.md` como decisión de diseño (complementa ISSUE-08):
> "El monto del pago es definido por el operador (Admin o Stylist) y no se valida automáticamente contra los precios de los servicios de la cita. Esto permite flexibilidad para descuentos, propinas, pagos parciales y ajustes manuales."

---

### ISSUE-25 — Idioma mixto en mensajes de validación (presentation layer)

| Campo | Valor |
|-------|-------|
| Origen | Auditoría D1 |
| Archivo | `payments/presentation/validations/PaymentValidations.ts` |
| Severidad | **BAJA** |
| Intervención | **FIX_CODE** |
| Dependencias | Ninguna |

**Diagnóstico:** Los mensajes de validación de `PaymentValidations.ts` están en español ("El monto es requerido", "El ID de la cita debe ser un UUID válido"), mientras que todos los demás módulos usan inglés. La convención establecida es mensajes en inglés en todo el código.

**Acción:** Traducir todos los mensajes de `PaymentValidations.ts` a inglés para alinear con la convención del proyecto. No afecta lógica, solo strings.

---

### ISSUE-26 — Paginación con defaults inconsistentes entre módulos

| Campo | Valor |
|-------|-------|
| Origen | Auditoría D2 |
| Archivos | `07-notifications.md`, `08-payments.md`, `09-holidays.md` |
| Severidad | **BAJA** |
| Intervención | **DOCUMENTAR** |
| Dependencias | Ninguna |

**Diagnóstico:**

| Módulo | Default limit | Max limit |
|--------|--------------|-----------|
| Payments | 20 | 100 |
| Holidays | 10 | 100 |
| Exceptions | 10 | 100 |
| Notifications | 20 | No documentado |

**Acción:** Documentar en cada archivo de business rules los defaults reales. Agregar nota al SKILL.md:
> "Los defaults de paginación varían por módulo según el volumen esperado de datos. Holidays usa 10 por defecto por bajo volumen; Payments y Notifications usan 20."

No amerita estandarización forzada — los defaults diferentes están justificados por el uso de cada módulo.

---

## Dependencias entre issues

```
ISSUE-12 (Holidays ↔ Appointments)
    ├── ISSUE-21 depende de 12 (auto-cancel al crear feriado)
    └── ISSUE-22 complementa a 12 (definir holiday sin exception)

ISSUE-08 (Precio centavos/float)
    └── ISSUE-24 complementa a 08 (monto desvinculado)

ISSUE-10 (Permisos confirmación)
    └── ISSUE-11 sigue el mismo patrón (permisos consulta)
```

Todos los demás issues son independientes y pueden ejecutarse en cualquier orden.

---

## Orden de ejecución recomendado

### Fase 1 — Fixes de código críticos y altos (7 items)

Estos son los que más impactan la integridad del sistema.

| Orden | Issue | Severidad | Estimación |
|-------|-------|-----------|------------|
| 1 | ISSUE-19 | CRÍTICA | Refactor entity, 2 archivos, +1 test |
| 2 | ISSUE-09 | ALTA | 2 archivos código + 1 doc |
| 3 | ISSUE-13 | ALTA | 1 archivo + 1 test |
| 4 | ISSUE-14 | ALTA | 1 archivo + inyección + 2 tests |
| 5 | ISSUE-15 | ALTA | 1 archivo + 1 test |
| 6 | ISSUE-06 | ALTA | 1 archivo + inyección + 3 tests |
| 7 | ISSUE-04 | MEDIA | 1 archivo + ajuste tests |

### Fase 2 — Fixes de código medios y bajos (5 items)

| Orden | Issue | Severidad | Estimación |
|-------|-------|-----------|------------|
| 8 | ISSUE-01 | MEDIA | 1 archivo + inyección + 1 test |
| 9 | ISSUE-02 | MEDIA | 1 archivo + inyección + 1 test |
| 10 | ISSUE-05 | BAJA | 1 archivo + inyección + 1 test |
| 11 | ISSUE-03 | BAJA | 1 archivo + 1 test |
| 12 | ISSUE-07 | BAJA | 1 línea + ajuste test |

### Fase 3 — Fix de idioma (1 item)

| Orden | Issue | Severidad | Estimación |
|-------|-------|-----------|------------|
| 13 | ISSUE-25 | BAJA | 1 archivo, solo strings |

### Fase 4 — Actualización de documentación (11 items)

Después de los fixes de código, actualizar todos los documentos de business rules en una sola pasada:

| Issue | Doc afectado |
|-------|-------------|
| ISSUE-08 | `03-services.md`, `08-payments.md` |
| ISSUE-10 | `06-appointments.md` (permisos) |
| ISSUE-11 | `06-appointments.md` (permisos consulta) |
| ISSUE-22 | `09-holidays.md` (holiday sin excepción) |
| ISSUE-16 | `06-appointments.md`, `08-payments.md` (datos no almacenados) |
| ISSUE-17 | `01-auth.md`, `04-stylists.md` (cascade) |
| ISSUE-18 | `02-categories.md` (desactivación) |
| ISSUE-20 | `06-appointments.md` (límite citas) |
| ISSUE-23 | `09-holidays.md` (fechas pasadas) |
| ISSUE-24 | `08-payments.md` (monto desvinculado) |
| ISSUE-26 | `07-notifications.md`, `08-payments.md`, `09-holidays.md` (paginación) |

### Fase 5 — Documentar diferidos (2 items)

| Issue | Doc afectado |
|-------|-------------|
| ISSUE-12 | `05-schedules.md`, `06-appointments.md`, README |
| ISSUE-21 | `09-holidays.md` |

---

## Commits sugeridos

Cada fix de código es un commit individual con conventional commit:

```
fix(services): validate associated services before deleting category (ISSUE-01)
fix(services): validate active appointments before deleting service (ISSUE-02)
fix(services): validate service isActive in AssignServiceToStylist (ISSUE-03)
fix(appointments): normalize clientId to always use User.id (ISSUE-04)
fix(notifications): validate user existence in CreateNotification (ISSUE-05)
fix(payments): validate appointment existence and status in CreatePayment (ISSUE-06)
fix(holidays): use NotFoundError in DeleteHoliday (ISSUE-07)
fix(services): align max duration with appointments limit (ISSUE-09)
fix(appointments): validate service isActive in CreateAppointment (ISSUE-13)
fix(appointments): validate stylist offers selected services (ISSUE-14)
fix(appointments): validate appointment time within working hours (ISSUE-15)
fix(appointments): separate creation and persistence validation in entity (ISSUE-19)
fix(payments): standardize validation messages to English (ISSUE-25)
docs(business-rules): update all modules to v2.2 (ISSUE-08,10,11,16-18,20,22-24,26)
docs(business-rules): document deferred features (ISSUE-12,21)
```
