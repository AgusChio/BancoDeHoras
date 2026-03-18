import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { KioskLayout } from '@/Kiosk/Components/KioskLayout'
import { Loader2 } from 'lucide-react'

function BusinessKiosk() {
  const { businessSlug } = Route.useParams()
  const business = useQuery(api.businesses.getBySlug, { slug: businessSlug })

  if (business === undefined) {
    return (
      <div
        className="flex h-screen items-center justify-center"
        style={{ backgroundColor: 'oklch(0.08 0 0)' }}
      >
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'oklch(0.60 0.20 270)' }} />
      </div>
    )
  }

  if (business === null) {
    return (
      <div
        className="flex h-screen flex-col items-center justify-center gap-4"
        style={{ backgroundColor: 'oklch(0.08 0 0)' }}
      >
        <p className="text-2xl font-semibold" style={{ color: 'oklch(0.60 0.22 25)' }}>
          Negocio no encontrado
        </p>
        <p className="text-sm" style={{ color: 'oklch(0.50 0 0)' }}>
          La URL <code className="font-mono">/{businessSlug}</code> no corresponde a ningún negocio registrado.
        </p>
      </div>
    )
  }

  return <KioskLayout businessId={business._id} businessName={business.name} />
}

export const Route = createFileRoute('/$businessSlug')({
  component: BusinessKiosk,
})
