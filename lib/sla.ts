/**
 * SLA de tiempo de respuesta al lead (estándar de mercado).
 * Mide cuánto tiempo lleva el lead sin contacto desde que entró.
 * Referencia: primera respuesta en < 5–15 min suele multiplicar probabilidad de cierre.
 *
 * - Verde (OK): 0–15 min — Dentro del estándar “respuesta rápida”.
 * - Amarillo (Revisar): 15 min – 1 h — Priorizar para no perder el lead.
 * - Rojo (Urgente): > 1 h — El lead se enfría; contactar cuanto antes.
 */
export type SlaStatus = 'green' | 'yellow' | 'red';

/** Minutos máximos para considerar "dentro de SLA" (respuesta rápida) */
const GREEN_MAX_MINUTES = 15;
/** Minutos máximos para "revisar pronto"; por encima = urgente */
const YELLOW_MAX_MINUTES = 60;

export function getSlaStatus(createdAt: string): SlaStatus {
  const minutes = getSlaMinutes(createdAt);
  if (minutes < GREEN_MAX_MINUTES) return 'green';
  if (minutes < YELLOW_MAX_MINUTES) return 'yellow';
  return 'red';
}

export function getSlaMinutes(createdAt: string): number {
  const created = new Date(createdAt).getTime();
  return Math.floor((Date.now() - created) / (60 * 1000));
}

/** Texto corto para badge/tooltip: tiempo transcurrido desde que entró el lead */
export function getSlaLabel(createdAt: string): string {
  const min = getSlaMinutes(createdAt);
  if (min < 60) return `Hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h === 1) return 'Hace 1 h';
  return `Hace ${h} h`;
}

/** Tooltip explicando el SLA (para el usuario) */
export const slaTooltips: Record<SlaStatus, string> = {
  green: 'Dentro de tiempo óptimo de respuesta (< 15 min)',
  yellow: 'Priorizar: lleva entre 15 min y 1 h sin contacto',
  red: 'Urgente: más de 1 h sin contacto; el lead se enfría',
};

export const slaColors: Record<SlaStatus, string> = {
  green: 'bg-emerald-500',
  yellow: 'bg-amber-500',
  red: 'bg-red-500',
};

export const slaColorsLight: Record<SlaStatus, string> = {
  green: 'bg-emerald-100 text-emerald-800',
  yellow: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-800',
};

/** Etiqueta corta para la columna (lista de leads) */
export const slaShortLabels: Record<SlaStatus, string> = {
  green: 'OK',
  yellow: 'Revisar',
  red: 'Urgente',
};
