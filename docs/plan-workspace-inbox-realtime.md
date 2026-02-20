# Plan de implementación: Workspace, Inbox y Realtime

Este documento traduce el plan de mejora del CRM a fases ejecutables sobre la base actual (tenant_id, Next.js App Router, Supabase, Vercel) y manteniendo el Free Tier.

---

## 1. Estado actual vs plan propuesto

| Plan propuesto | Estado actual | Acción |
|----------------|---------------|--------|
| **workspaces** (max_users, max_leads) | `tenants` (name, slug, plan) | Añadir columnas `max_users`, `max_leads` a `tenants` o crear vista/alias "workspace". |
| **profiles** (workspace_id, role: ADMIN \| AGENT) | `users` (tenant_id, role: admin \| manager \| sales \| support \| readonly) | Mantener `users`; añadir lógica de cuotas. Opcional: mapear roles a ADMIN/AGENT en una capa. |
| **contacts** (workspace_id, phone UNIQUE por workspace) | No existe | **Nueva tabla** `contacts`. |
| **pipelines** (workspace_id, name) | No existe; solo `pipeline_stages` (tenant_id) | Opción A: Crear `pipelines`, migrar stages a pipeline_id. Opción B: Mantener stages por tenant y añadir `pipeline_id` nullable por compatibilidad. |
| **stages** (pipeline_id, name, order, color_hex) | `pipeline_stages` (tenant_id, name, order) | Añadir `color_hex`; opcionalmente `pipeline_id` si se crea `pipelines`. |
| **leads** (contact_id, pipeline_id, stage_id, title, value, status OPEN\|WON\|LOST) | `leads` (tenant_id, stage_id, name, email, phone, origin, status) | Migración progresiva: añadir `contact_id` (nullable), `pipeline_id` (nullable), `title`, `value`; enum `status` (open, won, lost). Mantener name/email/phone por compatibilidad con Meta Lead Ads. |
| **messages** (workspace_id, lead_id, content, type, is_read, created_at) | No existe | **Nueva tabla** `messages` + índices (lead_id, created_at). |
| RLS por workspace_id | RLS por tenant_id (users.tenant_id) | Mantener tenant_id; políticas ya filtran por `tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())`. Añadir RLS a `contacts` y `messages`. |
| Webhook WhatsApp (GET challenge, POST mensaje) | Webhook Meta Lead Ads en `/api/webhooks/meta/leads` | **Nueva ruta** `/api/webhooks/whatsapp/route.ts` (GET + POST). Buscar/crear contact por teléfono; COUNT leads antes de crear lead; insertar message. |
| Vista Inbox (3 paneles + Realtime) | No existe | **Nueva** `/dashboard/inbox`: lista conversaciones, feed mensajes, perfil lead. Supabase Realtime en `messages` (INSERT), límite ~50 mensajes. |
| Kanban con Optimistic UI | Kanban con dnd-kit, actualiza tras PATCH | Refactor: actualización optimista en cliente antes de `fetch` PATCH. |
| SLA: rojo si último mensaje INBOUND, no leído, >2h | SLA por created_at del lead (15min/1h) | Añadir regla: si existe `messages`, SLA = f(last message INBOUND + !is_read + >2h). Mantener o combinar con SLA actual. |

---

## 2. Decisiones de diseño (para no romper producción)

- **tenant_id = workspace_id**: No renombrar columnas a `workspace_id` en todas las tablas; se evita una migración masiva. En código y documentación se puede usar el término "workspace" y seguir leyendo `tenant_id`. Opcional: vista `workspaces AS SELECT id, name, ... FROM tenants` y añadir `max_users`, `max_leads` a `tenants`.
- **Roles**: Mantener admin/manager/sales/support/readonly en DB. El plan ADMIN/AGENT se puede mapear en permisos (admin/manager = ADMIN, sales/support = AGENT, readonly = solo lectura).
- **Leads sin contact_id**: Los leads actuales no tienen `contact_id`. Se añade la columna como nullable; los nuevos leads por WhatsApp tendrán contact_id. Los leads de Meta/Google pueden seguir con name/email/phone en `leads` o, en una fase posterior, crear `contacts` y vincular.
- **Pipelines**: Implementación mínima: un solo pipeline por tenant (implícito). Tabla `pipeline_stages` sigue con `tenant_id`. Si más adelante se quieren varios pipelines por tenant, se añade tabla `pipelines` y `pipeline_id` en stages/leads.

---

## 3. Fases de implementación

### Fase 1: Base de datos y cuotas (sin romper app actual)

1. **Migración SQL (Supabase)**
   - Añadir a `tenants`: `max_users INT DEFAULT 15`, `max_leads INT DEFAULT 37500` (o 2500 según plan).
   - Crear tabla `contacts`: id, tenant_id, phone (UNIQUE(tenant_id, phone)), name, email, created_at. Índice (tenant_id).
   - Crear tabla `messages`: id, tenant_id, lead_id, content TEXT, type TEXT CHECK (type IN ('inbound', 'outbound', 'internal_note')), is_read BOOLEAN DEFAULT false, created_at TIMESTAMPTZ. Índices (lead_id), (tenant_id, created_at DESC).
   - En `leads`: añadir `contact_id UUID REFERENCES contacts(id)`, `title TEXT`, `value DECIMAL(12,2)`, y opcionalmente `status` con CHECK (open, won, lost); mantener columnas actuales.
   - En `pipeline_stages`: añadir `color_hex TEXT` (opcional).
2. **RLS**
   - Políticas para `contacts` y `messages`: mismo patrón que leads (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())).
3. **Cuotas en signup y en APIs**
   - Al crear usuario: COUNT(*) en users WHERE tenant_id = X; si >= max_users, rechazar.
   - En webhook WhatsApp (y opcionalmente en POST /api/leads): COUNT(*) en leads WHERE tenant_id = X; si >= max_leads, rechazar creación de lead.

### Fase 2: Webhook WhatsApp

1. **Ruta** `app/api/webhooks/whatsapp/route.ts`
   - **GET**: Leer `hub.mode`, `hub.verify_token`, `hub.challenge`; validar verify_token (variable de entorno); responder 200 con hub.challenge.
   - **POST**: Parsear body (formato Meta Cloud API / WhatsApp Business). Extraer from (teléfono), texto del mensaje. Usar Service Role Key (bypass RLS):
     - Buscar workspace (tenant) por configuración (ej. tabla whatsapp_workspaces con phone_number o app_id por tenant).
     - Buscar o crear `contact` por tenant_id + phone (normalizado).
     - Si se crea nuevo lead: COUNT(leads) WHERE tenant_id = X; si >= max_leads, no insertar lead; solo insertar `message` vinculado a lead existente o a un "lead de solo mensaje" (o rechazar y solo guardar message con lead_id null si el modelo lo permite; el plan dice "rechazar la creación e insertar solo el mensaje", por lo que se puede tener message con lead_id null o un lead "inbox" por defecto).
     - Insertar fila en `messages` (lead_id, content, type = 'inbound', is_read = false).
   - Documentar en README o docs la variable VERIFY_TOKEN y la URL del webhook para Meta.

### Fase 3: Inbox y Realtime

1. **API de datos para Inbox**
   - GET `/api/inbox/conversations` (o similar): lista de leads con último mensaje y timestamp; filtrar por tenant_id (session). Ordenar por último mensaje DESC. Límite/paginación.
   - GET `/api/inbox/leads/[id]/messages`: mensajes de un lead, ordenados por created_at ASC (o DESC con límite 50). Incluir paginación (limit 50).
   - PATCH `/api/messages/[id]/read`: marcar is_read = true (y opcionalmente actualizar "last_read_at" si se añade).
2. **Página** `app/dashboard/inbox/page.tsx` (Client Component)
   - Layout 3 columnas: lista de conversaciones (leads con último mensaje) | feed de mensajes del lead seleccionado | panel derecho con perfil del lead (nombre, teléfono, etapa, etc.).
   - Estado: selectedLeadId. Cargar mensajes al seleccionar un lead. Mostrar loading skeletons.
3. **Supabase Realtime**
   - En el cliente (Inbox), crear canal: `supabase.channel('messages').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: 'lead_id=eq.' + selectedLeadId }, payload => ...)`. Actualizar estado de mensajes (append) y opcionalmente marcar SLA si el nuevo mensaje es inbound y no leído.
   - Habilitar Realtime para la tabla `messages` en Supabase: **Database → Replication** → activar la publicación para la tabla `messages`. Sin esto, el Inbox no recibirá nuevos mensajes en vivo.
   - Limitar a últimos 50 mensajes por conversación para no saturar memoria (implementado en GET `/api/inbox/leads/[id]/messages`).

### Fase 4: Kanban optimista y SLA 2h

1. **Kanban**
   - En `pipeline-kanban.tsx`: en `handleDragEnd`, antes de `moveLead(leadId, newStageId)`:
     - Actualizar estado local (mover la tarjeta de columna) de forma inmediata.
     - Llamar a `moveLead`. Si la respuesta es error, revertir el estado local (optimistic rollback) y mostrar toast/error.
2. **SLA**
   - En `lib/sla.ts` (o nuevo helper): función que, dado un lead, considere si tiene mensajes: si el último mensaje es type = 'inbound' y is_read = false y created_at &lt; hace 2 horas, devolver "red". Si no hay mensajes o no aplica, mantener lógica actual (created_at del lead 15min/1h).
   - En lista de leads y tarjetas Kanban: si el lead tiene mensajes, usar esta nueva regla; si no, usar la actual por created_at.

### Fase 5: Limpieza y UX

- Loading skeletons en Inbox y en listas que falten.
- Manejo de errores global (toast o banner) en llamadas API.
- Tipado estricto en TypeScript en nuevas APIs y componentes.
- Refactor de referencias a "tenant" en UI a "workspace" si se desea consistencia con el plan (solo textos/labels).

---

## 4. Orden recomendado de ejecución

1. **Fase 1** (migración + RLS + cuotas): base para el resto.
2. **Fase 2** (webhook WhatsApp): permite recibir mensajes y poblar `messages` y `contacts`.
3. **Fase 3** (Inbox + Realtime): valor inmediato para el usuario.
4. **Fase 4** (Kanban optimista + SLA 2h): mejora de sensación de velocidad y priorización.
5. **Fase 5** (skeletons, errores, tipado): pulido.

---

## 5. Archivos clave a crear o modificar

| Fase | Crear | Modificar |
|------|-------|-----------|
| 1 | `supabase/migrations/YYYYMMDD_workspace_contacts_messages.sql` | `tenants` (ALTER), `leads` (ALTER), RLS |
| 2 | `app/api/webhooks/whatsapp/route.ts` | Config env (VERIFY_TOKEN, etc.) |
| 3 | `app/dashboard/inbox/page.tsx`, `app/api/inbox/...`, `app/api/messages/...`, hook useRealtimeMessages | Sidebar (enlace Inbox) |
| 4 | - | `pipeline-kanban.tsx`, `lib/sla.ts`, lista de leads |
| 5 | Componentes de skeleton/error si no existen | Varios |

---

## 6. Restricciones Free Tier (Supabase / Vercel)

- Consultas eficientes: siempre filtrar por tenant_id (índices ya existen); en Inbox limitar a 50 mensajes por lead y conversaciones recientes (ej. últimas 100).
- Realtime: un solo canal por vista Inbox (solo el lead seleccionado); no suscribirse a toda la tabla.
- Evitar re-renders masivos: actualizar solo la lista de mensajes o la conversación afectada al recibir un INSERT por Realtime.
