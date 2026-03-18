import type { Id } from '../../../convex/_generated/dataModel'
import { KioskClock } from './KioskClock'
import { KioskCamera } from './KioskCamera'

interface KioskLayoutProps {
  businessId: Id<'businesses'>
  businessName: string
}

export function KioskLayout({ businessId, businessName }: KioskLayoutProps) {
  return (
    <div
      className="flex flex-col landscape:flex-row h-screen w-screen overflow-hidden"
      style={{ backgroundColor: 'oklch(0.08 0 0)' }}
    >
      {/* Portrait: top strip | Landscape: left panel */}
      <div
        className="flex items-center px-6 py-4 shrink-0 landscape:flex-col landscape:justify-center landscape:gap-8 landscape:w-64 landscape:border-r landscape:py-10"
        style={{ borderColor: 'oklch(0.15 0 0)' }}
      >
        <h1
          className="text-sm font-semibold tracking-widest landscape:text-center"
          style={{ color: 'oklch(0.45 0 0)' }}
        >
          {businessName.toUpperCase()}
        </h1>
        {/* Clock in left panel on landscape */}
        <div className="hidden landscape:block">
          <KioskClock compact />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 pb-6">
        {/* Clock above camera on portrait */}
        <div className="landscape:hidden">
          <KioskClock />
        </div>
        <KioskCamera businessId={businessId} />
      </div>
    </div>
  )
}
