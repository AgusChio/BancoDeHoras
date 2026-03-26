// Feriados nacionales argentinos (YYYY-MM-DD)
export const FERIADOS: Record<string, string> = {
  // 2025
  '2025-01-01': 'Año Nuevo',
  '2025-03-03': 'Carnaval',
  '2025-03-04': 'Carnaval',
  '2025-03-24': 'Día de la Memoria',
  '2025-04-02': 'Día del Veterano',
  '2025-04-18': 'Viernes Santo',
  '2025-05-01': 'Día del Trabajador',
  '2025-05-25': 'Revolución de Mayo',
  '2025-06-16': 'Paso a la Inmortalidad de Güemes',
  '2025-06-20': 'Día de la Bandera',
  '2025-07-09': 'Día de la Independencia',
  '2025-08-18': 'Paso a la Inmortalidad de San Martín',
  '2025-10-12': 'Diversidad Cultural',
  '2025-11-20': 'Soberanía Nacional',
  '2025-12-08': 'Inmaculada Concepción',
  '2025-12-25': 'Navidad',
  // 2026
  '2026-01-01': 'Año Nuevo',
  '2026-02-16': 'Carnaval',
  '2026-02-17': 'Carnaval',
  '2026-03-24': 'Día de la Memoria',
  '2026-04-02': 'Día del Veterano',
  '2026-04-03': 'Viernes Santo',
  '2026-05-01': 'Día del Trabajador',
  '2026-05-25': 'Revolución de Mayo',
  '2026-06-15': 'Paso a la Inmortalidad de Güemes',
  '2026-06-20': 'Día de la Bandera',
  '2026-07-09': 'Día de la Independencia',
  '2026-08-17': 'Paso a la Inmortalidad de San Martín',
  '2026-10-12': 'Diversidad Cultural',
  '2026-11-20': 'Soberanía Nacional',
  '2026-12-08': 'Inmaculada Concepción',
  '2026-12-25': 'Navidad',
}

export function isFeriado(dateStr: string): string | null {
  return FERIADOS[dateStr] ?? null
}
