# Migraciones Supabase para producción (Fases 1–4)

Si tu proyecto en Supabase **aún no** tiene las tablas y columnas de las Fases 1 y 2, ejecuta en **Supabase → SQL Editor** (en este orden):

---

## 1. Migración Fase 1 (workspace, contacts, messages, cuotas)

Copia y ejecuta el contenido de:

**`supabase/migrations/20250219200000_workspace_contacts_messages.sql`**

Incluye: columnas `max_users` y `max_leads` en `tenants`, tabla `contacts`, tabla `messages`, columnas `contact_id`, `title`, `value` en `leads`, `color_hex` en `pipeline_stages`, RLS para `contacts` y `messages`.

---

## 2. Migración Fase 2 (WhatsApp)

Copia y ejecuta el contenido de:

**`supabase/migrations/20250219210000_whatsapp_workspaces.sql`**

Crea la tabla `whatsapp_workspaces` para mapear número de WhatsApp → tenant.

---

## 3. Realtime para Inbox (opcional)

Para que el **Inbox** reciba mensajes en vivo sin recargar:

- **Supabase Dashboard** → **Database** → **Replication**
- Activa la publicación (replication) para la tabla **`messages`**

---

## Comprobar

- En **Table Editor** deben existir: `contacts`, `messages`, `whatsapp_workspaces`.
- En **tenants** deben verse las columnas `max_users` y `max_leads`.
- En **leads** deben verse `contact_id`, `title`, `value`.
