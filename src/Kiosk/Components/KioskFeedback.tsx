import { CheckCircle2, LogIn, LogOut } from 'lucide-react'
import type { MatchedEmployee } from '../Hooks/UseKioskMachine'

interface KioskFeedbackProps {
  employee: MatchedEmployee
}

const isEntry = (type: 'entry' | 'exit') => type === 'entry'

export function KioskFeedback({ employee }: KioskFeedbackProps) {
  const entry = isEntry(employee.checkType)
  const color = entry ? 'oklch(0.70 0.20 145)' : 'oklch(0.75 0.18 60)'
  const message = entry ? '¡Bienvenido/a!' : '¡Hasta luego!'
  const sub = entry ? 'Entrada registrada' : 'Salida registrada'

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-6 rounded-2xl"
      style={{ backgroundColor: `${color.replace('oklch', 'oklch').replace(')', ' / 0.15)')}` }}
    >
      <div
        className="flex h-20 w-20 items-center justify-center rounded-full"
        style={{ backgroundColor: color }}
      >
        {entry ? (
          <LogIn size={40} className="text-white" />
        ) : (
          <LogOut size={40} className="text-white" />
        )}
      </div>

      <div className="text-center">
        <p
          className="text-4xl font-bold"
          style={{ color }}
        >
          {message}
        </p>
        <p className="text-2xl font-medium mt-2" style={{ color: 'oklch(0.92 0 0)' }}>
          {employee.name}
        </p>
        <p className="text-sm mt-2 flex items-center justify-center gap-1.5" style={{ color: 'oklch(0.65 0 0)' }}>
          <CheckCircle2 size={14} style={{ color }} />
          {sub}
        </p>
      </div>
    </div>
  )
}
