# Flujo de trabajo con Git (buenas prácticas)

Este documento describe cómo trabajamos con Git en el proyecto para mantener `main` estable y un historial claro.

## Estrategia: GitHub Flow

- **`main`** = rama de producción. Siempre desplegable (Vercel despliega desde aquí).
- **Ramas de trabajo** = una rama por funcionalidad o corrección. Se crean desde `main`, se fusionan a `main` vía Pull Request (PR).

No usamos rama `develop`: el flujo es lineal para simplificar (ideal para equipos pequeños o un solo desarrollador).

## Cuándo usar ramas

| Tipo de cambio | Nombre de rama | Ejemplo |
|----------------|----------------|---------|
| Nueva funcionalidad | `feature/descripcion-corta` | `feature/lead-export`, `feature/filtros-avanzados` |
| Corrección de bug | `fix/descripcion-corta` | `fix/login-timeout`, `fix/kanban-drag` |
| Mejora sin nueva feature | `improve/descripcion` | `improve/loading-states` |
| Solo documentación o config | `docs/descripcion` o `chore/descripcion` | `docs/api-endpoints`, `chore/deps-update` |

## Pasos habituales

1. **Actualizar `main` y crear rama**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/mi-cambio
   ```

2. **Trabajar, hacer commits**
   - Usar mensajes en formato **Conventional Commits** (ver abajo).

3. **Subir la rama y abrir PR**
   ```bash
   git push -u origin feature/mi-cambio
   ```
   Luego en GitHub: **Compare & pull request** hacia `main`.

4. **Revisar y fusionar**
   - Revisar el diff en GitHub.
   - Fusionar (Merge pull request). Opción recomendada: **Create a merge commit** o **Squash and merge** si prefieres un solo commit en `main`.

5. **Actualizar local y borrar rama**
   ```bash
   git checkout main
   git pull origin main
   git branch -d feature/mi-cambio
   ```

## Conventional Commits (mensajes de commit)

Formato: `tipo(alcance opcional): descripción breve`

- **tipos útiles:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- **ejemplos:**
  - `feat(leads): add export to CSV`
  - `fix(auth): redirect after login for support role`
  - `docs: add git workflow and deploy checklist`

Así el historial y los changelogs automáticos quedan claros.

## Trabajo directo en `main` (excepciones)

Solo para cambios muy pequeños y de bajo riesgo, por ejemplo:
- Actualizar un typo en un README o doc.
- Ajuste de configuración obvio (ej. un valor en `.env.example`).

Para todo lo que toque código de la app o lógica, usar rama + PR.

## Configuración recomendada en GitHub

1. **Branch protection para `main`** (opcional pero recomendado):
   - Repo → Settings → Branches → Add rule.
   - Branch name pattern: `main`.
   - Marcar: **Require a pull request before merging** (aunque sea de 1 aprobación o sin aprobación obligatoria, obliga a usar PR).
   - Opcional: **Require status checks to pass** si más adelante añades CI (p. ej. `npm run build` en GitHub Actions).

2. **Default branch**: dejar `main` como rama por defecto (ya suele ser así).

Con esto el flujo queda alineado con buenas prácticas sin complicar el día a día.
