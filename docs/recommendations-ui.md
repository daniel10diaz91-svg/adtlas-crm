# Recomendaciones UI/UX para el CRM

Este documento mapea las recomendaciones recibidas con el estado actual del CRM y sugiere prioridad y esfuerzo para adaptarlas.

---

## 1. Vistas Kanban de arrastrar y soltar

**Recomendación:** El embudo de ventas debe ser visual. Las tarjetas de leads deben poder moverse entre etapas (ej. "Nuevo Lead" → "Llamada Agendada") con un solo clic o arrastrándolas.

**Estado actual:** Ya existe un pipeline Kanban en `/dashboard/pipeline` con etapas y tarjetas. Hay que confirmar si el **drag & drop** está implementado (librería @dnd-kit en el proyecto).

**Acción:** Revisar `pipeline-kanban.tsx`: si el drag no actualiza etapa en backend, conectar el drop con `PATCH /api/leads/[id]` (stage_id). Prioridad: **alta**.

---

## 2. Bandeja de Entrada Omnicanal Unificada

**Recomendación:** Una pantalla central estilo chat donde los vendedores vean los mensajes entrantes sin cambiar de pestaña.

**Estado actual:** No existe. Los leads llegan por webhook (Meta/Google) y se ven en lista de leads y en el pipeline. No hay vista tipo “inbox” ni integración de chat (WhatsApp, etc.).

**Acción:** Feature nueva. Requiere definir fuentes de mensajes (webhooks de Meta, futuras integraciones) y una vista “Inbox” con lista de conversaciones o de leads con última actividad. Prioridad: **media** (muy valorada por equipos comerciales).

---

## 3. Línea de Tiempo del Cliente (Timeline)

**Recomendación:** En el perfil de cada contacto, un historial vertical cronológico: cuándo entró por el anuncio, qué respondió el bot, cuándo se agendó, etc.

**Estado actual:** En el detalle del lead (`/dashboard/leads/[id]`) hay pestaña **Timeline**. Hay que revisar si muestra: creación del lead, cambios de etapa, tareas, y si está ordenada por fecha.

**Acción:** Completar la pestaña Timeline con eventos de: creación, cambio de etapa, tareas creadas/completadas, y (futuro) respuestas de bot/agendado. Prioridad: **alta**.

---

## 4. Semáforos de Atención (SLA Visual)

**Recomendación:** Indicadores de colores (rojo, amarillo, verde) junto a cada lead según tiempo de espera (ej. >15 min sin respuesta humana).

**Estado actual:** No hay indicador de SLA ni tiempo desde último contacto.

**Acción:** Añadir en lista de leads y en tarjetas del Kanban un indicador que dependa de: `created_at` o `updated_at` y de si hay respuesta/tarea reciente. Ej.: verde &lt;15 min, amarillo 15–60 min, rojo &gt;60 min. Prioridad: **alta** para equipos con compromiso de respuesta rápida.

---

## 5. Tarjetas de Contacto Limpias

**Recomendación:** En las tarjetas, lo primero visible: teléfono, origen del anuncio y resumen. Datos secundarios en pestañas o desplegables.

**Estado actual:** Las tarjetas del Kanban y la lista de leads muestran nombre, email, origen, etc. No hay “resumen IA” ni diseño explícito “teléfono + origen + resumen arriba”.

**Acción:** Rediseñar tarjetas (Kanban y/o lista) con: teléfono y origen bien visibles; opcionalmente un campo “resumen” o “notas” destacado; el resto en sección colapsable o en pestaña Detalles. Prioridad: **media**.

---

## 6. Diseño Mobile-First

**Recomendación:** La interfaz debe adaptarse bien a móvil sin perder funciones críticas.

**Estado actual:** Layout con sidebar fijo 240px; en móvil puede quedar estrecho o poco usable.

**Acción:** Sidebar colapsable o drawer en móvil; tablas de leads responsivas (scroll horizontal o cards en móvil); botones y formularios táctiles. Revisar breakpoints en Tailwind y probar en pantallas pequeñas. Prioridad: **alta**.

---

## 7. Modo Oscuro (Dark Mode)

**Recomendación:** Reducir fatiga visual para equipos que usan el CRM muchas horas.

**Estado actual:** No hay modo oscuro. Hay variables CSS `--background` y `--foreground` y `prefers-color-scheme: dark` en `globals.css` pero no se usan de forma consistente.

**Acción:** Añadir toggle de tema (claro/oscuro) en TopBar; guardar preferencia en cookie o localStorage; aplicar clases dark (Tailwind) o variables CSS en todo el layout, sidebar, tablas y formularios. Prioridad: **media**.

---

## 8. Dashboards Personalizables

**Recomendación:** Pantallas de inicio con widgets: gerente ve “Ventas del mes”, vendedor ve “Mis tareas de hoy”.

**Estado actual:** El dashboard (`/dashboard`) ya muestra datos por rol (KPIs, leads recientes, por etapa). No hay widgets arrastrables ni configuración por usuario.

**Acción:** Mantener la lógica actual por rol; opcionalmente permitir elegir qué bloques ver (ej. “Mis tareas” siempre para sales, “Ventas del mes” para manager/admin). Widgets arrastrables son un paso posterior. Prioridad: **media**.

---

## 9. Etiquetas (Tags) de Colores

**Recomendación:** Identificar visualmente campaña de Meta, producto de interés, etc.

**Estado actual:** El lead tiene `origin` (meta, google, manual) con badges de color. No hay tags libres por campaña o producto.

**Acción:** Añadir modelo “tags” o “labels” (nombre + color) y relación lead–tags; en lista y detalle mostrar chips de colores; filtro por tag. Prioridad: **media** (muy útil para marketing y segmentación).

---

## Resumen de prioridades sugeridas

| Prioridad | Item | Esfuerzo estimado |
|-----------|------|-------------------|
| Alta | Kanban drag & drop funcional | Bajo (revisar y conectar API) |
| Alta | Timeline completa en detalle lead | Medio |
| Alta | Semáforos SLA | Medio (regla de negocio + UI) |
| Alta | Mobile-first (sidebar + tablas) | Medio |
| Media | Bandeja omnicanal / Inbox | Alto |
| Media | Tarjetas de contacto limpias | Bajo–medio |
| Media | Modo oscuro | Medio |
| Media | Dashboards personalizables | Medio |
| Media | Tags de colores | Medio (modelo + UI) |

Las mejoras ya implementadas en esta iteración: **idioma ES/EN con selector manual** y **mejor contraste en campos de formulario** (texto y placeholder más legibles).
