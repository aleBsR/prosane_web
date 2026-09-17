# PROSANE Web (Frontend)

Aplicación web construida en **React + TypeScript (Vite)** que replica las funciones de la app móvil [`prosane_app`](https://github.com/aleBsR/prosane_app) para el circuito del Programa Nacional de Salud Escolar (PROSANE).

Requiere el backend [`prosane_api`](https://github.com/aleBsR/prosane_api) corriendo para funcionar.

> A diferencia de la app móvil (offline-first con SQLite), la versión web consulta siempre a la API: necesita conexión permanente al servidor durante su uso.

---

## Requisitos

- **Node.js 20+** y **npm 10+**
- Verificar con: `node --version` y `npm --version`
- Un navegador actualizado (Chrome, Edge o Firefox)

### Dependencias principales

| Paquete | Propósito |
|---------|-----------|
| `react-router-dom` | Navegación con guardias de autenticación |
| `axios` | Cliente HTTP con interceptores |
| `@vitejs/plugin-react` | Integración React + Vite |

---

## Instalación y ejecución

### 1. Clonar y entrar

```bash
git clone <repo-url> prosane_web
cd prosane_web
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar la URL del backend (`.env`)

La URL del backend se configura con la variable `VITE_API_AUTH_URL`. Copiá el ejemplo:

```bash
cp .env.example .env
```

| Dónde corre el backend | `VITE_API_AUTH_URL` |
|---|---|
| Misma PC | `http://localhost:8000/api/v1/auth` |
| Otra PC de la red local | `http://<IP-LAN-del-backend>:8000/api/v1/auth` |

Para obtener tu IP en la red local (Windows):

```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' }
```

### 4. Correr la app

```bash
npm run dev              # solo esta PC (http://localhost:5173)
npm run dev -- --host    # accesible desde otras PCs de la red (http://<IP>:5173)
npm run build            # compilar a producción (sale en dist/)
```

> El `VITE_API_AUTH_URL` queda fijo al iniciar Vite: si cambiás de red, actualizalo y reiniciá el servidor de desarrollo.

---

## Exponer en la red local (otra computadora)

1. Backend accesible desde la red:
   ```bash
   cd prosane_api
   python manage.py runserver 0.0.0.0:8000
   ```
2. Web con la IP del backend y expuesta:
   ```powershell
   cd prosane_web
   $env:VITE_API_AUTH_URL="http://<IP-PC-backend>:8000/api/v1/auth"
   npm run dev -- --host --port 5173
   ```
3. Aceptar el permiso del Firewall de Windows para Node.js (puertos 5173 y 8000).
4. Abrir en la otra PC (mismo WiFi): `http://<IP-PC-web>:5173/`

---

## Backend (`prosane_api`)

La app depende del backend para autenticación y datos. Ver [`prosane_api/README.md`](https://github.com/aleBsR/prosane_api) para instrucciones completas.

### Resumen rápido

```bash
# 1. Activar entorno virtual y arrancar Django
cd prosane_api
source venv/bin/activate
python manage.py migrate
python manage.py loaddata actions users roles

# 2. Iniciar servidor (accesible desde la red local)
python manage.py runserver 0.0.0.0:8000
```

### Usuarios de prueba (password: `prosane123`)

| Email | Rol |
|-------|-----|
| `superadmin@prosane.test` | Superadmin — acceso total |
| `medico@prosane.test` | Médico |
| `odontologo@prosane.test` | Odontólogo |
| `ayudante@prosane.test` | Ayudante — gestión de operativos |
| `tutor@prosane.test` | Tutor — registro de hijos |

Cada rol ve sus propias acciones en el menú, definidas por el sistema de permisos data-driven.

---

## Type-check y build

```bash
npx tsc --noEmit   # chequeo de tipos (debe dar limpio)
npm run build      # tsc + build de producción
```

---

## Arquitectura

El proyecto replica la estructura de la app móvil (rutas, guardias y design system), adaptada a React:

```
src/
├── config.ts          → URL del backend (VITE_API_AUTH_URL)
├── api/client.ts      → Clientes axios (auth + api/v1), interceptores JWT/refresh
├── auth/              → AuthContext: sesión, permisos, login/logout
├── components/        → Layout (barra superior), design system (botones,
│                          tarjetas, modales, post, íconos Material)
├── pendientes/        → Hook usePendientes (conteo + lista, espejo del provider)
├── pages/             → Pantallas
│   ├── Login, ForceChangePassword, ForgotPassword, ResetPassword
│   ├── Acciones (inicio por rol), Pendientes, Perfil, Configuracion
│   ├── Operativos, OperativoDetail, AlumnoDetail
│   ├── EvaluacionMedica, EvaluacionOdontologica (con odontograma SVG),
│   │   SeccionEscuela, EscuelaDatos (ficha completa), Constancia
│   ├── Escuelas, EscuelaDetail (post), Cursos, MiEscuela, AlumnosEscuela
│   └── Profesionales, Usuarios (escuela/ayudantes), Altas
└── App.tsx            → Router con guardias (RequireAuth/RequireChangePassword)
```

### Notas de paridad con `prosane_app`

- Mismas rutas y guardias que `app_router.dart` (`must_change_password` bloquea todo salvo el cambio).
- Mismo design system: violeta `#7C5CFC`, Nunito/Rubik, íconos Material outline, modales anchos unificados.
- El perfil tutor está fuera del alcance de esta etapa (igual que en la guía de pruebas de la app).
