# Análisis Comparativo: Casos de Uso del Ciclo 1 vs Implementación Actual

**Fecha del Análisis:** 29 de Octubre de 2024
**Versión del Backend:** Laravel 11
**Versión del Frontend:** React 18 + Vite
**Estado del Proyecto:** En Desarrollo

---

## CU21 - Autenticación

### Descripción Original
Permitir que usuarios inicien sesión en el sistema con credenciales válidas, generando un token de autenticación.

### Funcionalidades Implementadas ✅

- **Login con Email y Contraseña:**
  - Validación de email y contraseña mínima de 6 caracteres
  - Búsqueda de usuario en tabla `usuario`
  - Verificación de hash de contraseña con `Hash::check()`
  - Generación de token JWT usando Laravel Sanctum
  - Validación de usuario activo antes de permitir acceso

- **Logout:**
  - Eliminación del token actual del usuario

- **Obtención de Datos del Usuario Autenticado:**
  - Endpoint `/api/user` que retorna datos del usuario
  - Carga de roles asociados
  - Información: ID, nombre completo, email, estado activo, roles

- **Protección de Endpoints:**
  - Rate limiting en login (5 intentos por minuto)
  - Middleware `auth:sanctum` en rutas protegidas

### Funcionalidades Pendientes ❌

- Recuperación de contraseña
- Cambio de contraseña por el usuario
- Validación de 2FA
- Cierre de sesión en todos los dispositivos
- Historial de intentos de login fallidos

### Recomendaciones de Mejora

1. Implementar endpoint para cambio de contraseña
2. Añadir endpoint de recuperación de contraseña
3. Implementar 2FA opcional
4. Mejorar auditoría de intentos fallidos
5. Agregar refresh token con rotación

---

## CU23 - Gestión de Usuarios

### Descripción Original
Gestionar usuarios del sistema (creación, lectura, actualización, eliminación).

### Funcionalidades Implementadas ✅

- **CRUD Completo:**
  - Listar usuarios con paginación (15 por página)
  - Crear usuarios con generación automática de contraseña
  - Ver detalles del usuario con roles
  - Actualizar datos del usuario
  - Eliminar usuario (con validación de último admin)

- **Validaciones:**
  - Email único
  - Cifrado de contraseña con bcrypt
  - Protección del último administrador
  - Transacciones de base de datos

- **Gestión de Roles:**
  - Asignar roles a usuarios
  - Revocar roles de usuarios
  - Obtener roles del usuario

### Funcionalidades Pendientes ❌

- Filtrado avanzado (búsqueda por nombre, email, estado)
- Exportación de listado
- Importación masiva
- Historial de cambios del usuario
- Desactivación de usuario (soft delete)

### Recomendaciones de Mejora

1. Implementar filtros: `GET /api/usuarios?search=nombre&status=activo&role=docente`
2. Agregar búsqueda por email
3. Implementar soft delete con restauración
4. Agregar endpoint de restablecimiento de contraseña
5. Registrar quién y cuándo cambió datos del usuario

---

## CU25/CU26 - Gestión de Roles

### Descripción Original
Crear y gestionar roles del sistema con permisos asociados.

### Funcionalidades Implementadas ✅

- **CRUD de Roles:**
  - Listar roles con paginación
  - Crear rol con nombre único
  - Ver rol específico
  - Actualizar rol
  - Eliminar rol

- **Roles Predefinidos:**
  - administrador_academico
  - docente
  - estudiante

### Funcionalidades Pendientes ❌ (CRÍTICA)

- Sistema de permisos granulares
- Asignación de permisos a roles
- Validación al eliminar roles con usuarios
- Permisos específicos por recurso (CRUD)
- Heredencia de roles
- Auditoría de cambios en roles

### Recomendaciones de Mejora

1. **CRÍTICA:** Implementar tabla de permisos
2. Crear tabla intermedia `rol_permiso`
3. Validar eliminación de roles con usuarios
4. Agregar middleware de autorización: `Route::middleware('can:crear_docente')`
5. Endpoint para obtener permisos del rol

---

## CU01 - Gestión de Docentes

### Descripción Original
Gestionar información de docentes.

### Funcionalidades Implementadas ✅

- **CRUD Completo:**
  - Listar docentes con relaciones
  - Crear docente (Usuario + Persona + Docente)
  - Ver docente con detalles
  - Actualizar información
  - Eliminar en cascada

- **Validaciones:**
  - Email único
  - CI (Cédula) único
  - Código docente único
  - Generación de contraseña temporal
  - Asignación automática de rol "docente"

- **Información Capturada:**
  - Nombre completo
  - Email
  - CI
  - Código docente
  - Teléfono
  - Dirección

### Funcionalidades Pendientes ❌

- Especialidades/áreas de conocimiento
- Historial de carga académica
- Asignación de departamentos
- Validación de horario disponible
- Filtrado por área
- Estado de docente (activo, licencia, jubilado)
- Información de titulación

### Recomendaciones de Mejora

1. Agregar tabla `area_academica`
2. Implementar filtrado por área: `GET /api/docentes?area=Matemáticas`
3. Agregar especialidades del docente
4. Validar disponibilidad en asignación
5. Mantener histórico de cambios

---

## CU02 - Gestión de Materias

### Descripción Original
Gestionar información de materias.

### Funcionalidades Implementadas ✅

- **CRUD Completo:**
  - Listar materias
  - Crear materia
  - Ver materia
  - Actualizar materia
  - Eliminar (validando sin grupos activos)

- **Información Capturada:**
  - Código único
  - Nombre
  - Créditos (1-20)
  - Horas teóricas

- **Validaciones:**
  - Código único
  - Nombre requerido
  - No eliminar si tiene grupos

### Funcionalidades Pendientes ❌

- Prerrequisitos
- Equivalencias
- Tipo de materia (teórica, práctica, mixta)
- Créditos prácticos
- Semestre/nivel
- Programa académico
- Contenido temático

### Recomendaciones de Mejora

1. Agregar campos: tipo, créditos_prácticos, semestre
2. Tabla de prerrequisitos
3. Tabla de equivalencias
4. Filtrado: `GET /api/materias?tipo=Teórica&semestre=3`
5. Programa y contenido temático

---

## CU03 - Gestión de Aulas

### Descripción Original
Gestionar información de aulas.

### Funcionalidades Implementadas ✅

- **CRUD Completo:**
  - Listar aulas
  - Crear aula
  - Ver aula
  - Actualizar aula
  - Eliminar (validando sin horarios)

- **Información Capturada:**
  - Nombre (código del aula)
  - Capacidad (1-200)
  - Ubicación
  - Piso (por defecto 1)

- **Validaciones:**
  - Nombre único
  - Capacidad requerida
  - No eliminar si tiene horarios

### Funcionalidades Pendientes ❌

- Tipo de aula (Teoría, Lab, Taller, Auditorio)
- Equipamiento (proyector, computadora, etc.)
- Disponibilidad/estado
- Información de accesibilidad
- Ubicación con edificio/coordenadas
- Capacidad de grupos de trabajo
- Registro fotográfico

### Recomendaciones de Mejora

1. Agregar tabla `tipo_aula`
2. Tabla de equipamiento del aula
3. Campos de accesibilidad
4. Agregar información de edificio
5. Endpoint de disponibilidad: `GET /api/aulas/{aula}/disponibilidad`

