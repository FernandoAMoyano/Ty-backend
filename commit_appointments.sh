#!/bin/bash

# Sincronizar con develop
git checkout develop
git pull origin develop --rebase

# Agregar todos los cambios
git add .

# Crear commit
git commit -m "feat: Implementar caso de uso CreateAppointment del módulo appointments

Funcionalidades implementadas:
- CreateAppointment use case con validaciones completas de negocio
- Repositorios de persistencia: PrismaAppointmentRepository, PrismaAppointmentStatusRepository, PrismaScheduleRepository
- Test unitario completo para CreateAppointment con múltiples escenarios
- Validaciones de disponibilidad y detección de conflictos de horario
- Integración con módulos existentes (services, auth, stylists)

Detalles técnicos:
- Validación de fechas (no pasado, máximo 6 meses futuro)
- Cálculo automático de duración basado en servicios
- Validación de entidades relacionadas (cliente, estilista, servicios)
- Detección de conflictos de horario entre citas
- Asignación automática de estado pendiente
- Mapeo correcto entre entidades y DTOs

Estructura creada:
- src/modules/appointments/application/use-cases/CreateAppointment.ts
- src/modules/appointments/infrastructure/persistence/PrismaAppointmentRepository.ts
- src/modules/appointments/infrastructure/persistence/PrismaAppointmentStatusRepository.ts
- src/modules/appointments/infrastructure/persistence/PrismaScheduleRepository.ts
- tests/unit/appointments/CreateAppointment.unit.test.ts

Estado: Base sólida para el módulo appointments completada ✅"

# Push a develop
git push origin develop

echo "✅ Commit y push completados!"
