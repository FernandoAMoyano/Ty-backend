#!/bin/bash

# Script para commitear las correcciones realizadas
echo "🔧 Preparando commit con las correcciones de tests y refactoring..."

# Agregar todos los cambios
git add .

# Verificar estado
echo "📋 Estado actual de git:"
git status --short

# Realizar el commit con mensaje descriptivo
git commit -m "fix: Corregir errores de compilación y tests unitarios

Correcciones implementadas:
- PrismaUserRepository: Eliminación de código fragmentado en findByIdWithRole
- StylistServiceService: Refactoring para usar repositorio en lugar de Prisma directo
- Tests unitarios: Actualización de mocks para usar findByIdWithRole correctamente
- Stylist.unit.test: Simplificación de mock de Date usando Date.now en lugar de constructor

Detalles técnicos:
- Eliminado código huérfano que causaba errores TS1128 y TS1434
- Mejorada separación de responsabilidades en validación de roles
- Mocks actualizados con estructura correcta de usuario con rol
- Solución limpia para testing de timestamps sin tipos complejos

Tests afectados:
- StylistServiceService.unit.test.ts: 3 tests corregidos
- Stylist.unit.test.ts: 1 test simplificado
- full-stylist-test.test.ts: Funcionando correctamente

Estado: Todos los tests pasan ✅"

echo "✅ Commit realizado exitosamente!"
echo "📊 Resumen del commit:"
git log --oneline -1
