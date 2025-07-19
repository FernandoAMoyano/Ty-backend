#!/bin/bash

echo "📚 Iniciando commit de actualización de documentación OpenAPI..."

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

# Crear commit
git commit -m "docs: Actualizar OpenAPI para coincidir con implementación real

Rutas corregidas:
- Categories: /services/categories → /categories  
- Stylist Services: /stylists/{id}/services → /services/stylists/{id}/services
- Agregadas rutas faltantes de stylist services

Appointments agregado:
- 10 endpoints de appointments documentados
- Schemas completos: Appointment, AppointmentStatus, Schedule, AvailableSlot
- Validaciones y ejemplos incluidos

Resultado:
- OpenAPI sincronizado con código real
- Documentación completa para todos los módulos
- Swagger UI funcional con ejemplos realistas

Estado: Documentación actualizada y consistente ✅"

# Push a develop
echo "⬆️ Subiendo cambios a develop..."
git push origin develop

if [ $? -eq 0 ]; then
    echo ""
    echo "📚 ¡DOCUMENTACIÓN ACTUALIZADA!"
    echo ""
    echo "✅ OpenAPI sincronizado con código"
    echo "✅ Esquemas de appointments agregados"
    echo "✅ Swagger UI actualizado"
    echo ""
    echo "🌐 Ver documentación: http://localhost:3000/api/v1/docs"
    echo ""
else
    echo "❌ Error durante el push. Verifica la conexión y permisos."
    exit 1
fi
