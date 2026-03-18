import { useState, useEffect } from 'react'

const TZ = 'America/Argentina/Buenos_Aires'

function getNow() {
  const now = new Date()
  const time = new Intl.DateTimeFormat('es-AR', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(now)
  const date = new Intl.DateTimeFormat('es-AR', {
    timeZone: TZ,
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(now)
  return { time, date }
}

interface KioskClockProps {
  compact?: boolean
}

export function KioskClock({ compact = false }: KioskClockProps) {
  const [{ time, date }, setState] = useState(getNow)

  useEffect(() => {
    const interval = setInterval(() => setState(getNow()), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="text-center">
      <p
        className={compact ? 'text-4xl font-mono font-bold tracking-tight' : 'text-6xl font-mono font-bold tracking-tight'}
        style={{ color: 'oklch(0.95 0 0)', fontFamily: 'Geist Mono, monospace' }}
      >
        {time}
      </p>
      <p
        className={compact ? 'text-xs mt-1 capitalize' : 'text-sm mt-1 capitalize'}
        style={{ color: 'oklch(0.65 0 0)' }}
      >
        {date}
      </p>
    </div>
  )
}
