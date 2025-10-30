# Sistema de Gestión Académica – Front + API

Este repositorio contiene:

- `sistema-horarios/` – Frontend React (Vite) para la asignación de Horarios, Aulas, Materias, Grupos y Asistencia Docente.
- `backend/` – API Laravel (Sanctum) con endpoints REST.

La app ya está funcional. A continuación tienes guías rápidas para desarrollo local y despliegue en AWS (frontend en S3+CloudFront, backend en EC2).

## 1) Desarrollo local

Requisitos: Node 18+ (recomendado 20), PHP 8.2, Composer, MySQL.

### Backend (Laravel)

```
cd backend
cp .env.example .env
composer install
php artisan key:generate

# Configura DB_* en .env y luego:
php artisan migrate --seed

# Servir API (http://localhost:8000)
php artisan serve
```

### Frontend (Vite)

```
cd sistema-horarios
cp .env.development .env  # o crea uno nuevo

# Para desarrollo con proxy (recomendado)
# .env (dev):
# VITE_API_URL=/api

npm install
npm run dev -- --port 5173
```

> Nota: El `vite.config.js` ya incluye proxy a `/api`; si el backend corre en `http://localhost:8000`, el front puede consumir `VITE_API_URL=/api` en dev sin CORS.

## 2) Build de producción (frontend)

```
cd sistema-horarios
cp .env.production.example .env.production

# Edita la API del backend (ej.)
# VITE_API_URL=https://api.tu-dominio.com/api

npm run build
# Artefacto: sistema-horarios/dist
```

## 3) Despliegue en AWS (recomendado)

Arquitectura sugerida:

- Frontend estático en S3 + CloudFront.
- Backend Laravel en EC2 (Ubuntu 22.04), con Nginx + PHP-FPM 8.2; base de datos en RDS MySQL.

### 3.1 Frontend → S3 + CloudFront

1. Crea un bucket S3 privado (ej. `spa-horarios-frontend`), habilita Bloqueo de acceso público (ON) y controla acceso vía CloudFront.
2. Sube el contenido de `sistema-horarios/dist/` al bucket.
3. Crea una distribución CloudFront apuntando al bucket S3 como origen. Activa:
   - Comportamiento: `Redirect HTTP to HTTPS`.
   - Política de acceso al bucket: “Origin access control (OAC)”.
4. Error/Index SPA: en `Custom error responses`, mapea 403/404 a `/index.html` con código 200 para soporte de rutas.
5. Configura tu dominio (Route 53) a la distribución (ACM para HTTPS en us-east-1).

### 3.2 Backend → EC2 (Nginx + PHP-FPM)

1. Lanza una instancia Ubuntu 22.04 (t3.small+), SG con puertos 22, 80, 443.
2. Instala dependencias:

```
sudo apt update && sudo apt install -y nginx php8.2 php8.2-fpm php8.2-mysql \
  php8.2-xml php8.2-curl php8.2-mbstring php8.2-zip git unzip
```

3. Clona el repo en `/var/www/gestion-academica` y prepara Laravel:

```
cd /var/www
sudo git clone <TU_REPO> gestion-academica
cd gestion-academica/backend
cp .env.example .env
composer install --no-dev --optimize-autoloader
php artisan key:generate

# .env producción (ejemplo):
# APP_ENV=production
# APP_URL=https://api.tu-dominio.com
# DB_CONNECTION=mysql
# DB_HOST=<rds-endpoint>
# DB_PORT=3306
# DB_DATABASE=<db>
# DB_USERNAME=<user>
# DB_PASSWORD=<pass>

php artisan migrate --force
php artisan storage:link
php artisan config:cache && php artisan route:cache && php artisan view:cache
```

4. Nginx host (ver `deploy/backend-nginx.conf`) y habilitarlo:

```
sudo cp ../deploy/backend-nginx.conf /etc/nginx/sites-available/gestion-api.conf
sudo ln -s /etc/nginx/sites-available/gestion-api.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

5. (Opcional) Supervisor para colas/cron.

## 4) Git y CI básico

### .gitignore

Incluye en raíz (o usa los de cada subproyecto):

```
node_modules/
dist/
.env*
backend/vendor/
backend/storage/logs/*
backend/storage/framework/*
```

### Publicar en GitHub

```
git init
git add .
git commit -m "feat: frontend + backend operativos"
git branch -M main
git remote add origin https://github.com/<tu-usuario>/<tu-repo>.git
git push -u origin main
```

## 5) Variables de entorno (resumen)

Frontend (Vite):

```
VITE_API_URL=https://api.tu-dominio.com/api
```

Backend (Laravel):

```
APP_ENV=production
APP_URL=https://api.tu-dominio.com
SANCTUM_STATEFUL_DOMAINS=tu-dominio.com,.tu-dominio.com
SESSION_DOMAIN=.tu-dominio.com
DB_*
```

## 6) Tips de operación

- Para invalidar caché del frontend: crea invalidación en CloudFront para `/*`.
- Revisa logs de Nginx y Laravel: `/var/log/nginx/error.log` y `backend/storage/logs/laravel.log`.
- Si cambias CORS/Sanctum: asegúrate de alinear `SANCTUM_STATEFUL_DOMAINS` y origenes del frontend.

---

Si quieres, puedo preparar un workflow de GitHub Actions para build del front y sincronización con S3, además de una receta de despliegue automatizado del backend vía SSH. 

