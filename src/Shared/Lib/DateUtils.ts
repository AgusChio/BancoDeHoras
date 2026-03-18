const TZ = 'America/Argentina/Buenos_Aires'

/** Formatea un timestamp UTC (ms) a DD/MM/YYYY en GMT-3 */
export function formatDate(utcMs: number): string {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(utcMs))
}

/** Formatea un timestamp UTC (ms) a HH:mm en GMT-3 */
export function formatTime(utcMs: number): string {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(utcMs))
}

/** Formatea un timestamp UTC (ms) a HH:mm:ss en GMT-3 */
export function formatTimeWithSeconds(utcMs: number): string {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(utcMs))
}

/** Retorna la fecha de hoy en GMT-3 como string YYYY-MM-DD */
export function todayInArgentina(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

/** Formatea duración en ms a "Xh Ym" */
export function formatDuration(ms: number): string {
  if (ms <= 0) return '0h 0m'
  const totalMinutes = Math.floor(ms / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours}h ${minutes}m`
}

/** Convierte una fecha YYYY-MM-DD a timestamps UTC de inicio y fin del día en GMT-3 */
export function dayBoundsUTC(dateStr: string): { start: number; end: number } {
  const start = new Date(`${dateStr}T00:00:00-03:00`).getTime()
  const end = new Date(`${dateStr}T23:59:59.999-03:00`).getTime()
  return { start, end }
}
