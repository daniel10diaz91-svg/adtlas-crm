# Configuración en Vercel

Para que el CRM funcione en producción, revisa o ajusta lo siguiente en el [dashboard de Vercel](https://vercel.com).

---

## 1. Proyecto conectado a GitHub

- **Settings → Git:** Repositorio conectado (ej. `daniel10diaz91-svg/adtlas-crm`).
- **Production Branch:** `main` (o la rama desde la que quieras desplegar).
- Los deploys se disparan solos en cada push a esa rama.

---

## 2. Variables de entorno (obligatorias)

En **Settings → Environment Variables** añade estas variables y asígnalas al entorno **Production** (y a Preview si usas previews):

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon / public key de Supabase | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (secret) de Supabase | `eyJ...` |
| `NEXTAUTH_SECRET` | Clave secreta de al menos 32 caracteres | Generar con `openssl rand -base64 32` |
| `NEXTAUTH_URL` | URL pública de la app en producción | `https://adtlas-crm.vercel.app` o tu dominio |

**Importante:** En producción, `NEXTAUTH_URL` debe ser exactamente la URL que usan los usuarios (con `https://`). Si usas un dominio propio (ej. `https://crm.tudominio.com`), pon esa URL.

Después de añadir o cambiar variables, hay que **redeploy** (Deployments → ⋮ en el último deploy → Redeploy) para que se apliquen.

---

## 3. Build y salida

Por defecto Vercel detecta Next.js y usa:

- **Build Command:** `npm run build` (o `next build`)
- **Output Directory:** (automático para Next.js)
- **Install Command:** `npm install`

El proyecto incluye `vercel.json` con `buildCommand: "npm run build"` y región. No suele hacer falta cambiar nada más.

---

## 4. Dominio (opcional)

- **Settings → Domains:** Añade tu dominio (ej. `crm.tudominio.com`).
- En tu proveedor DNS crea el registro que Vercel indique (CNAME o A).
- Si usas ese dominio, actualiza `NEXTAUTH_URL` a esa URL.

---

## 5. Si el deploy falla

- **Deployments →** clic en el deploy fallido → **Building** o **Logs**: revisa el error (often falta una variable de entorno o fallo de TypeScript/lint).
- Comprueba que las 5 variables de la tabla anterior están definidas para Production.
- Build local: en tu máquina `npm run build` debe terminar sin errores.

---

## Resumen rápido

1. Conectar repo y rama `main`.
2. Añadir las 5 variables de entorno (sobre todo `NEXTAUTH_URL` con la URL de producción).
3. Redeploy si cambiaste variables.
4. (Opcional) Añadir dominio y actualizar `NEXTAUTH_URL`.
