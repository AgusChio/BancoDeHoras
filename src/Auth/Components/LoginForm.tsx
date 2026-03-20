import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuthActions } from '@convex-dev/auth/react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function LoginForm() {
  const { signIn } = useAuthActions()
  const navigate = useNavigate()
  const hasAdmin = useQuery(api.seed.hasAdmin)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const isSetup = hasAdmin === false
  const title = isSetup ? 'Crear cuenta de administrador' : 'Iniciar sesión'
  const description = isSetup
    ? 'Primera vez — creá tu cuenta para comenzar'
    : 'Ingresá con tu cuenta de administrador'
  const buttonLabel = isSetup ? 'Crear cuenta' : 'Ingresar'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    try {
      await signIn('password', {
        email,
        password,
        flow: isSetup ? 'signUp' : 'signIn',
      })
      navigate({ to: '/admin/employees' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      if (msg.includes('InvalidSecret') || msg.includes('invalid') || msg.includes('credentials')) {
        toast.error('Email o contraseña incorrectos')
      } else if (msg.includes('already exists') || msg.includes('duplicate')) {
        toast.error('Ya existe un administrador registrado')
      } else {
        toast.error(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  if (hasAdmin === undefined) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'oklch(0.60 0.20 270)' }} />
      </div>
    )
  }

  return (
    <div
      className="flex h-screen items-center justify-center px-4"
      style={{ backgroundColor: 'oklch(0.97 0 0)' }}
    >
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: 'oklch(0.60 0.20 270)' }}
            >
              <Building2 size={24} className="text-white" />
            </div>
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription className="text-sm">{description}</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder={isSetup ? 'Mínimo 8 caracteres' : '••••••••'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={isSetup ? 8 : undefined}
                autoComplete={isSetup ? 'new-password' : 'current-password'}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="mt-1 text-white"
              style={{ backgroundColor: 'oklch(0.60 0.20 270)' }}
            >
              {loading && <Loader2 size={16} className="animate-spin mr-2" />}
              {loading ? 'Procesando...' : buttonLabel}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
