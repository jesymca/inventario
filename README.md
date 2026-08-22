# Sistema de Control de Inventarios Multi-Usuario

**Producción de Emprendimiento JOSE HERRERA**  
**Desarrollado para funcionar directamente desde GitHub Pages (HTML5 + JavaScript + Bootstrap 5.3 + Bootstrap Icons)**

---

## 🚀 Características Principales

1. **Host 100% Estático:** Diseñado para funcionar desde GitHub Pages sin necesidad de servidor Apache ni PHP.
2. **Base de Datos Remota con Turso (libSQL):** Persistencia en la nube vía REST API (`/v2/pipeline`), con respaldo automático en `localStorage` para pruebas inmediatas offline.
3. **Almacenamiento de Imágenes con Cloudflare R2:** Carga y optimización de logos de comercios y fotos de productos.
4. **Control de Membresía y 15 Días Gratis:**
   - 15 días de uso libre continuo tras el primer registro.
   - Membresía mensual a **$10.00 USD** (calculada a Tasa BCV oficial, editable desde el panel Admin).
   - Pasarelas de pago integradas en Bolívares (BDV Transferencia/PagoMóvil) y Dólares (Binance, USDT TRC20, ZINLI).
5. **Autenticación Dual:**
   - Registro e Ingreso tradicional (Nombre, Correo, Clave, Confirmación).
   - Ingreso con Google (Google Identity Services API / OAuth 2.0).
6. **Selector Multi-Cuenta / Administradores Delegados:**
   - Un propietario de negocio puede agregar a otros usuarios (por correo) como administradores secundarios de su comercio.
   - Si un usuario tiene su correo vinculado a 2 o más empresas/cuentas, al iniciar sesión el sistema despliega un **Modal Selector de Empresa** para elegir a cuál ingresar.
7. **Perfiles Precargados de Negocio:**
   - Presets configurables en 1 clic para: *Panadería, Zapatería, Librería, Farmacia, Tienda de Ropa, Tienda de Bolsos, Tienda de Víveres y Carnicería*.
   - **Switch Deslizante de Datos de Prueba:** Carga o borra datos demo para probar la aplicación al instante.
8. **Generación de Reportes PDF:** Exportación directa de tablas imprimibles en PDF para **Inventario**, **Clientes** y **Proveedores**.
9. **Importación Masiva (CSV):** Carga rápida de productos, clientes y proveedores con descarga de plantillas de ejemplo.
10. **Mapeo Automático de Stock y WhatsApp:**
    - **Compras:** Incrementan el stock del producto automáticamente.
    - **Ventas:** Substraen del stock del producto automáticamente y permiten enviar el recibo de compra directo al cliente vía WhatsApp.

---

## 🔑 Credenciales de Super Administrador

Para acceder a la **Sección A (Administración del Sistema)** con acceso total a verificación de pagos, creación de métodos de pago, métricas globales y prueba de conectividad API:

- **Correo SuperAdmin:** `herrejose@gmail.com`
- **Clave:** `MyJ01012023*`

---

## 📚 Guías de Configuración e Integración

### 1. ¿Cómo crear los accesos a las API de Google para Login / Registro desde Google en GitHub Pages?

Para habilitar el botón "Iniciar sesión con Google" en tu dominio de GitHub Pages (`https://<tu-usuario>.github.io/<tu-repositorio>/`):

1. **Ingresa a Google Cloud Console:**
   - Entra a [https://console.cloud.google.com/](https://console.cloud.google.com/) e inicia sesión con tu cuenta de Google.
2. **Crea un Nuevo Proyecto:**
   - Haz clic en el selector de proyectos (arriba a la izquierda) y presiona **"Nuevo Proyecto"**. Nómbralo: `Inventario-JoseHerrera`.
3. **Configura la Pantalla de Consentimiento OAuth:**
   - Ve a **APIs y Servicios** > **Pantalla de consentimiento OAuth**.
   - Selecciona Tipo de Usuario: **Externo** y haz clic en *Crear*.
   - Completa el Nombre de la app (`Control de Inventarios`), Correo de soporte (`herrejose@gmail.com`) y guarda.
4. **Crea las Credenciales (ID de Cliente OAuth 2.0):**
   - Ve a **APIs y Servicios** > **Credenciales**.
   - Haz clic en **+ Crear Credenciales** > **ID de cliente de OAuth**.
   - Selecciona *Tipo de aplicación*: **Aplicación web**.
   - En **Orígenes autorizados de JavaScript**, agrega:
     - `http://localhost` (para pruebas locales)
     - `http://127.0.0.1`
     - `https://<tu-usuario>.github.io` (Reemplaza con tu URL exacta de GitHub Pages)
   - En **URI de redireccionamiento autorizados**, agrega la misma URL de GitHub Pages.
   - Haz clic en *Crear*.
5. **Copia el Client ID en el Código:**
   - Copia el **Client ID** generado (ejemplo: `1234567890-abc123def456.apps.googleusercontent.com`).
   - Abre el archivo `js/config.js` y reemplaza el valor de `GOOGLE_CLIENT_ID`:
     ```javascript
     GOOGLE_CLIENT_ID: "TU_CLIENT_ID_GENERADO.apps.googleusercontent.com"
     ```

---

## 📧 Notificaciones por Correo a Clientes (A 2 Días de Vencer la Membresía desde GitHub Pages)

### ¿Se pueden enviar notificaciones por correo desde GitHub Pages?
**Sí, pero con una consideración importante:** GitHub Pages es un servidor **estático** (HTML/JS cliente) que no ejecuta código en segundo plano las 24 horas como un servidor Apache con PHP o Node.js.

Aquí te presento las **2 opciones más viables y recomendadas**:

### Opción 1: Notificación Automática con GitHub Actions (LA MÁS VIABLE Y GRATUITA) ⭐ RECOMENDADA
Como tu sistema está alojado en GitHub, puedes crear un **GitHub Action (Cron Job)** que se ejecute automáticamente **todos los días a las 8:00 AM**.

**¿Cómo funciona?**
1. Un pequeño script en Node.js o Python ubicado en tu repositorio consulta tu base de datos de Turso (`https://inventarios-herrejose.aws-ap-northeast-1.turso.io`).
2. Filtra todos los usuarios cuya membresía o período de prueba venza exactamente en **2 días**.
3. Envía un correo automático personalizado usando una API gratuita como **Resend** (`https://resend.com`) o **SendGrid** sin necesidad de pagar servidor.

### Opción 2: Envío Directo desde el Navegador (EmailJS / Resend REST API)
Cuando un usuario ingresa al sistema, el código JavaScript verifica si le quedan 2 días de prueba. Si es así, realiza una petición HTTP `fetch()` a la API de **EmailJS** o **Resend** para enviarle el correo de aviso de forma transparente desde el navegador.

---

## 🗄️ Esquema SQL de la Base de Datos (Turso / libSQL)

El archivo `schema.sql` contiene la estructura completa para Turso:

```bash
# Ejecutar en la CLI de Turso para crear las tablas
turso db shell inventarios-herrejose < schema.sql
```

---

## 🛠️ Tecnologías Utilizadas

- **Frontend:** HTML5, JavaScript (ES6+), Bootstrap 5.3 (CDN), Bootstrap Icons (CDN).
- **Reportes:** jsPDF & jspdf-autotable (CDN).
- **Backend Serverless / DB:** Turso (libSQL HTTP REST API `/v2/pipeline`).
- **Almacenamiento:** Cloudflare R2 Storage API.
- **Hosting:** GitHub Pages.

**Desarrollado con excelencia para Emprendimiento JOSE HERRERA.**
