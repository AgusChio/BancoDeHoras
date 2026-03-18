import { LogIn, LogOut } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface AttendanceBadgeProps {
  type: 'entry' | 'exit'
}

export function AttendanceBadge({ type }: AttendanceBadgeProps) {
  const isEntry = type === 'entry'
  return (
    <Badge
      variant="outline"
      className="gap-1.5 font-medium"
      style={{
        borderColor: isEntry ? 'oklch(0.70 0.20 145)' : 'oklch(0.75 0.18 60)',
        color: isEntry ? 'oklch(0.50 0.20 145)' : 'oklch(0.55 0.18 60)',
        backgroundColor: isEntry ? 'oklch(0.70 0.20 145 / 0.08)' : 'oklch(0.75 0.18 60 / 0.08)',
      }}
    >
      {isEntry ? <LogIn size={12} /> : <LogOut size={12} />}
      {isEntry ? 'Entrada' : 'Salida'}
    </Badge>
  )
}
