# Adtlas CRM

CRM multi-tenant: cada cliente (tenant) tiene sus leads, pipeline y tareas. Los leads pueden llegar por Meta Lead Ads (webhook directo), Google o creación manual.

## Requisitos

- Node.js 18+
- Cuenta en [Supabase](https://supabase.com) (base de datos)
- (Opcional) Cuenta en Vercel para desplegar

## Configuración

### 1. Variables de entorno

Copia el ejemplo y rellena los valores:

```bash
cp .env.local.example .env.local
```

Edita `.env.local`:

- **NEXT_PUBLIC_SUPABASE_URL** y **NEXT_PUBLIC_SUPABASE_ANON_KEY**: en Supabase → tu proyecto → Settings → API.
- **SUPABASE_SERVICE_ROLE_KEY**: mismo sitio (Service role, secret).
- **NEXTAUTH_SECRET**: genera una clave aleatoria de al menos 32 caracteres (por ejemplo `openssl rand -base64 32`).
- **NEXTAUTH_URL**: en local `http://localhost:3000`; en producción la URL de tu app (ej. `https://app.adtlas.com`).

### 2. Base de datos en Supabase

1. Crea un proyecto en [Supabase](https://supabase.com/dashboard).
2. Ve a **SQL Editor** → **New query**.
3. Pega el contenido de `supabase/schema.sql` y ejecuta (Run).
4. En **Authentication** → **Providers** deja habilitado **Email** (para registro e inicio de sesión).

### 3. Arrancar en local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Puedes **Crear cuenta** (registro) y luego **Entrar**.

### 4. Conectar Meta Lead Ads

1. Entra al CRM → **Integraciones**.
2. Añade **Page ID** y **Form ID** de tu formulario de Lead Ads (desde Meta Business Suite o developers.facebook.com).
3. En tu app de Meta (developers.facebook.com), configura el webhook de Lead Ads con la URL:  
   `https://[TU-DOMINIO]/api/webhooks/meta/leads`  
   (en local puedes usar un túnel tipo ngrok para probar).
4. Cuando alguien envíe el formulario, Meta llamará a esa URL y el lead se creará en el CRM del tenant que tenga ese page_id + form_id registrado.

## Estructura

- **Leads**: listado, filtro por origen, creación manual.
- **Pipeline**: etapas por defecto (Lead, Contactado, Oferta, Ganado, Perdido); puedes cambiar la etapa de cada lead desde el desplegable.
- **Tareas**: listado (crear tareas desde la app en una siguiente iteración).
- **Integraciones**: registro de orígenes Meta (page_id + form_id) para el webhook.

## Despliegue (Vercel)

1. Sube el repo a GitHub y conéctalo a Vercel.
2. En Vercel añade las mismas variables de entorno que en `.env.local` (y **NEXTAUTH_URL** con la URL de producción).
3. Dominio: si compras el dominio en Hostinger, en el DNS crea un CNAME para `app` (o el subdominio que uses) apuntando a `cname.vercel-dns.com` (Vercel te indica el valor exacto al añadir el dominio).

## Licencia

Privado / Adtlas.
