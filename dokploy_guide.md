# Guía de Despliegue en Dokploy (VPS)

Esta guía te ayudará a desplegar **CASINOENLINEA** en tu propio VPS utilizando Dokploy.

## Requisitos Previos

1. Un VPS con Docker y **Dokploy** instalado.
2. Acceso a tu repositorio de GitHub.

## Paso 1: Configurar la Base de Datos en Dokploy

Dokploy permite crear bases de datos fácilmente.

1. Ve a **Resources** -> **Create Resource** -> **Databases** -> **PostgreSQL** (o SQLite si prefieres algo más ligero).
2. Dale un nombre (ej: `casino-db`).
3. Una vez creada, copia la **Connection String** o las credenciales (Host, Port, User, Password, DB Name).

## Paso 2: Crear la Aplicación en Dokploy

1. Ve a **Applications** -> **Create Application**.
2. Selecciona **GitHub**.
3. Conecta tu repositorio `Superrifasglobal/CASINOENLINEA`.
4. Selecciona la rama `main`.

## Paso 3: Configurar Variables de Entorno

En la pestaña **Environment** de tu aplicación en Dokploy, añade las siguientes variables:

| Variable | Descripción |
| :--- | :--- |
| `DATABASE_URL` | La URL de conexión de la base de datos que creaste en el Paso 1. |
| `JWT_SECRET` | Una clave secreta para los tokens (puedes usar una cadena aleatoria). |
| `ETH_RPC_URL` | URL de tu proveedor de RPC de Ethereum/Polygon. |
| `ADMIN_PRIVATE_KEY` | Tu llave privada de administrador. |
| `CASINO_CONTRACT_ADDRESS` | La dirección del contrato inteligente. |
| `HOUSE_WALLET` | La dirección de la billetera de la casa. |

## Paso 4: Desplegar

1. Dokploy detectará automáticamente el `Dockerfile` que se encuentra en la raíz.
2. Haz clic en **Deploy**.
3. Dokploy construirá la imagen y levantará el contenedor.

## Notas Técnicas

- La aplicación ahora utiliza un servidor Node.js en lugar de Cloudflare Functions.
- El servidor maneja tanto el frontend (archivos estáticos) como el backend (API).
- Los logs se pueden ver directamente en el panel de Dokploy.
