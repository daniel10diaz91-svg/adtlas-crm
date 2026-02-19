# Checklist de despliegue seguro

Seguir este orden y estas comprobaciones en cada despliegue para reducir riesgo.

---

## 1. Orden de despliegue (siempre)

1. **Base de datos primero:** Aplicar migraciones en Supabase (MCP o SQL Editor) y verificar que no hay errores.
2. **App después:** Deploy desde `main` (Vercel u otra plataforma). Así la nueva versión no arranca con un schema antiguo.
3. **Smoke tests:** Ejecutar la checklist post-deploy (sección 4).

---

## 2. Comprobaciones previas al deploy

Completar antes de considerar el deploy listo:

| Comprobación | Dónde / cómo |
|--------------|--------------|
| **Migración aplicada** | En Supabase: `SELECT DISTINCT role FROM users;` debe incluir al menos `admin`, `sales` (y opcionalmente `manager`, `support`, `readonly`). |
| **Variables de entorno** | En Vercel (o tu plataforma): `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (URL de producción). |
| **Build local** | En la raíz del proyecto: `npm run build` sin errores. |

Si algo falla, corregir antes de desplegar.

---

## 3. Estrategias de despliegue

- **Deploy directo a producción:** Aceptable con un solo entorno y pocos usuarios. Obligatorio ejecutar la checklist post-deploy.
- **Staging (recomendado a medio plazo):** Rama o proyecto Vercel Preview con su propia URL y tenant de prueba en Supabase. Desplegar primero ahí, validar, luego el mismo commit a producción.
- **Canary (futuro):** Feature flag (p. ej. `USE_NEW_RBAC` o por `tenant_id`) para activar cambios primero en un tenant.

---

## 4. Comprobaciones post-deploy (obligatorias)

Ejecutar en producción tras cada deploy:

1. **Login:** Usuario que antes era `ventas` debe poder entrar (la app lo trata como `sales`).
2. **Admin:** Login como admin → menú Admin → Usuarios: listado y creación de usuario con rol manager/sales.
3. **Leads:** Como admin o manager, ver todos los leads y asignar; como sales, ver solo los asignados.
4. **Detalle de lead:** Desde lista o pipeline, abrir un lead y comprobar pestañas (Detalles, Actividades) y cambio de etapa/asignación.
5. **Support/ReadOnly:** Si existen usuarios con esos roles, comprobar que no ven botones de crear lead/tarea y que las APIs devuelven 403 en POST cuando corresponda.

Si alguna falla: usar el plan de rollback (sección 5) y revisar logs (Vercel/Supabase) antes de volver a desplegar.

---

## 5. Plan de rollback

### Solo código (lo habitual)

- **Vercel:** Hacer "Revert" al deploy anterior al último en el dashboard.
- **Git:** `git revert <commit-del-deploy>` (ej. `git revert 9c227d8`), luego `git push origin main`. El deploy automático volverá la app a la versión anterior. Los datos en Supabase no se tocan.

### Base de datos (solo si es necesario)

La migración de roles no revierte datos por defecto. Si en el futuro necesitas deshacer la migración de roles:

1. En Supabase SQL Editor (o MCP):  
   `UPDATE users SET role = 'ventas' WHERE role = 'sales';`
2. Restringir de nuevo el CHECK:  
   `ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;`  
   `ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'ventas'));`

Para la mayoría de rollbacks basta con revertir el deploy de la app; no tocar la DB.
