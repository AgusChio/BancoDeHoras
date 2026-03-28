import { type ReactNode, useEffect, useState } from 'react'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { useConvexAuth } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import { Users, Clock, BarChart3, LogOut, Building2, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAdminStore } from '@/Stores/AdminStore'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/admin/businesses', label: 'Negocios', icon: Building2 },
  { to: '/admin/employees', label: 'Empleados', icon: Users },
  { to: '/admin/attendance', label: 'Asistencia', icon: Clock },
  { to: '/admin/reports', label: 'Reportes', icon: BarChart3 },
]

interface AdminLayoutProps {
  children: ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const { signOut } = useAuthActions()
  const navigate = useNavigate()
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useAdminStore()
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname
  const [authTimedOut, setAuthTimedOut] = useState(false)

  // Si después de 7s sigue cargando, asumir no autenticado y redirigir a login
  useEffect(() => {
    if (!isLoading) { setAuthTimedOut(false); return }
    const t = setTimeout(() => setAuthTimedOut(true), 7000)
    return () => clearTimeout(t)
  }, [isLoading])

  const effectivelyLoading = isLoading && !authTimedOut

  useEffect(() => {
    if (!effectivelyLoading && !isAuthenticated && currentPath !== '/admin/login') {
      navigate({ to: '/admin/login' })
    }
  }, [isAuthenticated, effectivelyLoading, navigate, currentPath])

  if (currentPath === '/admin/login') {
    return <>{children}</>
  }

  if (effectivelyLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
          style={{ borderColor: 'oklch(0.60 0.20 270)', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  if (!isAuthenticated) return null

  async function handleSignOut() {
    await signOut()
    navigate({ to: '/admin/login' })
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar — desktop only (md+) */}
      <aside
        className={cn(
          'hidden md:flex fixed top-0 left-0 h-full flex-col border-r bg-white transition-all duration-200 z-30',
          'md:static md:z-auto',
          sidebarOpen ? 'md:w-56' : 'md:w-16',
        )}
        style={{ borderColor: 'oklch(0.922 0 0)' }}
      >
        {/* Header */}
        <div
          className="flex h-16 items-center gap-3 px-4 border-b shrink-0"
          style={{ borderColor: 'oklch(0.922 0 0)' }}
        >
          <Building2 className="shrink-0" size={22} style={{ color: 'oklch(0.60 0.20 270)' }} />
          {sidebarOpen && (
            <span className="font-semibold text-sm text-gray-800 truncate">Banco de Horas</span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 flex flex-col gap-1 px-2 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = currentPath.startsWith(to)
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                )}
                style={active ? { backgroundColor: 'oklch(0.60 0.20 270)' } : undefined}
              >
                <Icon size={18} className="shrink-0" />
                {sidebarOpen && <span>{label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t shrink-0" style={{ borderColor: 'oklch(0.922 0 0)' }}>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-3 text-gray-600 hover:text-red-600"
            onClick={handleSignOut}
          >
            <LogOut size={18} className="shrink-0" />
            {sidebarOpen && <span>Cerrar sesión</span>}
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header
          className="h-14 md:h-16 flex items-center gap-3 px-4 md:px-6 bg-white border-b shrink-0"
          style={{ borderColor: 'oklch(0.922 0 0)' }}
        >
          {/* Hamburger only on desktop */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="shrink-0 hidden md:inline-flex"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </Button>

          {/* App icon visible on mobile in header */}
          <Building2
            className="shrink-0 md:hidden"
            size={20}
            style={{ color: 'oklch(0.60 0.20 270)' }}
          />

          <span className="text-sm font-medium text-gray-500 truncate">Panel de Administración</span>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6 pb-16 md:pb-6">{children}</main>
      </div>

      {/* Bottom navigation bar — mobile only */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center bg-white border-t md:hidden"
        style={{ borderColor: 'oklch(0.922 0 0)' }}
      >
        {navItems.map(({ to, label, icon: Icon }) => {
          const active = currentPath.startsWith(to)
          return (
            <Link
              key={to}
              to={to}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors"
              style={{ color: active ? 'oklch(0.60 0.20 270)' : undefined }}
            >
              <Icon
                size={20}
                className={cn(!active && 'text-gray-400')}
                style={active ? { color: 'oklch(0.60 0.20 270)' } : undefined}
              />
              <span className={cn(active ? '' : 'text-gray-400')}>{label}</span>
            </Link>
          )
        })}

        {/* Log out button on far right */}
        <button
          onClick={handleSignOut}
          className="flex flex-col items-center justify-center gap-0.5 py-2 px-3 text-[10px] font-medium text-gray-400"
          aria-label="Cerrar sesión"
        >
          <LogOut size={20} />
          <span>Salir</span>
        </button>
      </nav>
    </div>
  )
}
