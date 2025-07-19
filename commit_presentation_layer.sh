#!/bin/bash

echo "🚀 Iniciando commit de la capa de presentation del módulo appointments..."

# Sincronizar con develop
echo "📥 Sincronizando con develop..."
git checkout develop
git pull origin develop --rebase

# Agregar todos los cambios
echo "📦 Agregando cambios..."
git add .

# Verificar que hay cambios para commitear
if git diff --staged --quiet; then
    echo "❌ No hay cambios para commitear"
    exit 1
fi

echo "📝 Creando commit..."

# Crear commit detallado
git commit -m "feat: Implementar capa de presentation completa del módulo appointments

Infraestructura implementada:
- AppointmentController con 10 endpoints
- AppointmentRoutes con middleware y validaciones
- AppointmentValidations con reglas exhaustivas
- AppointmentContainer para inyección de dependencias
- Integración en app.ts

Endpoints:
- POST /appointments (implementado)
- 9 endpoints preparados para casos de uso
- Rutas públicas y protegidas configuradas

Características:
- Tipado extricto
- Clean Architecture mantenida
- Validaciones robustas de fechas y UUIDs
- Manejo de errores

Estado: Presentation layer funcional ✅"

# Push a develop
echo "⬆️ Subiendo cambios a develop..."
git push origin develop

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 ¡COMMIT Y PUSH COMPLETADOS!"
    echo ""
    echo "✅ Presentation layer completa"
    echo "✅ 1 endpoint funcional + 9 preparados"
    echo "✅ Arquitectura escalable lista"
    echo ""
    echo "🚀 Próximo: Implementar casos de uso adicionales"
    echo ""
else
    echo "❌ Error durante el push. Verifica la conexión y permisos."
    exit 1
fi
