# Admin playbook

Guía operativa para administradores del CRM.

---

## Primer administrador

1. Ir a **Registro** (signup).
2. Completar: nombre de empresa, email, contraseña, nombre.
3. Se crea el tenant y el primer usuario con rol **admin** y etapas de pipeline por defecto.

---

## Gestión de usuarios

- **Crear usuarios:** Admin → Usuarios → "Nuevo usuario". Indicar email, contraseña, nombre y rol (Manager, Ventas, Soporte, Solo lectura). Solo admin puede crear usuarios.
- **Editar usuario:** En la misma página, "Editar" en la fila del usuario para cambiar nombre o rol. No se puede quitar el último admin del tenant.

---

## Integraciones (Meta Lead Ads)

- **Configurar:** Dashboard → Integraciones. Añadir Page ID y Form ID de Meta; se genera la URL del webhook para configurar en Meta Business Suite.
- **Origen de leads:** Los leads que lleguen por ese webhook tendrán origen "meta" y se asocian al tenant según el mapeo guardado.

---

## Migraciones y rollback

- **Aplicar migraciones:** En Supabase (SQL Editor o MCP), ejecutar los scripts en `supabase/migrations/` en orden si aún no están aplicados.
- **Despliegue y rollback:** Seguir [deploy-checklist.md](deploy-checklist.md) para comprobaciones previas y posteriores al deploy, y para el plan de rollback (revertir deploy en Vercel o `git revert` + push).

---

## Logs e incidencias

- **Logs:** Revisar en Vercel (Deployments → Logs) y en Supabase (Logs del proyecto). En el futuro, usar `correlation_id` en respuestas de error para trazar requests.
- **Variables de entorno:** Comprobar en Vercel que estén definidas: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (con la URL de producción).
