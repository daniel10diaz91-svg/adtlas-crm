# Webhook de WhatsApp (Meta Cloud API)

El CRM recibe mensajes entrantes de WhatsApp a través de la ruta del webhook. Meta (Facebook) valida la URL con un **GET** y envía los mensajes con **POST**.

---

## 1. URL del webhook

En producción, la URL que debes configurar en Meta es:

```
https://<tu-dominio>/api/webhooks/whatsapp
```

Ejemplo: `https://adtlas-crm.vercel.app/api/webhooks/whatsapp`

Configura esta URL en **Meta for Developers** → tu app → WhatsApp → Configuration → Webhook.

---

## 2. Variables de entorno

En **Vercel** (o tu entorno) añade al menos:

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `WHATSAPP_VERIFY_TOKEN` | Sí (para GET) | Token que tú eliges; debe coincidir con el que pongas en la configuración del webhook en Meta. Meta lo envía en `hub.verify_token` y el servidor lo compara con esta variable. |
| `WHATSAPP_TENANT_ID` | Condicional | UUID del tenant (workspace) al que se asocian los mensajes cuando **no** usas la tabla `whatsapp_workspaces`. Si tienes un solo workspace, pon aquí su `id` (de la tabla `tenants`). |

- **GET:** Meta envía `hub.mode=subscribe`, `hub.verify_token=<tu token>`, `hub.challenge=<número>`. Si `hub.verify_token` coincide con `WHATSAPP_VERIFY_TOKEN`, el servidor responde con `hub.challenge` en texto plano (status 200). Así Meta verifica que la URL es tuya.
- **POST:** Cada mensaje entrante se asocia a un tenant. Si existe la tabla `whatsapp_workspaces` y hay una fila con el `phone_number_id` que Meta envía, se usa ese `tenant_id`. Si no, se usa `WHATSAPP_TENANT_ID`.

---

## 3. Tabla opcional: whatsapp_workspaces

Si tienes **varios workspaces** (tenants) y cada uno con su propio número de WhatsApp, usa la tabla `whatsapp_workspaces`:

- **Migración:** `supabase/migrations/20250219210000_whatsapp_workspaces.sql`
- **Columnas:** `tenant_id`, `phone_number_id` (el ID que Meta envía en `value.metadata.phone_number_id`, único por tabla).
- Inserta una fila por cada número de WhatsApp Business vinculado a un tenant. Así el webhook resuelve el tenant sin depender de `WHATSAPP_TENANT_ID`.

Si no aplicas la migración o no insertas filas, el webhook solo funcionará si configuras `WHATSAPP_TENANT_ID` (un solo workspace).

---

## 4. Flujo del POST (resumen)

1. Meta envía el payload del mensaje (Cloud API).
2. Se obtiene `phone_number_id` de `value.metadata.phone_number_id` y con eso se resuelve `tenant_id` (tabla o env).
3. Se busca o crea un **contact** por `tenant_id` + teléfono normalizado (del remitente).
4. Si ya existe un **lead** para ese contact, se reutiliza. Si no y el workspace no superó `max_leads`, se crea un lead nuevo.
5. Se inserta siempre un **message** (tipo `inbound`, `is_read: false`) vinculado al lead (o `lead_id` null si no se pudo crear lead por cuota).

---

## 5. Cómo probar

- **GET:** Desde el navegador o `curl`:  
  `https://<tu-dominio>/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=TU_TOKEN&hub.challenge=12345`  
  Debe devolver `12345` como texto plano si `WHATSAPP_VERIFY_TOKEN` es `TU_TOKEN`.
- **POST:** Meta enviará POST cuando un usuario envíe un mensaje al número conectado; no hace falta simularlo a mano salvo que quieras probar con una petición JSON similar a la de la [documentación de Meta](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples/).
