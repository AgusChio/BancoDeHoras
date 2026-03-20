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
  const [mode, setMode] = useState<'auto' | 'signIn' | 'signUp'>('auto')

  // auto: primer acceso → signUp si no hay admin, signIn si hay
  const isSignUp = mode === 'signUp' || (mode === 'auto' && hasAdmin === false)
  const title = isSignUp ? 'Registrarse' : 'Iniciar sesión'
  const description = isSignUp
    ? 'Creá tu cuenta de administrador'
    : 'Ingresá con tu cuenta de administrador'
  const buttonLabel = isSignUp ? 'Crear cuenta' : 'Ingresar'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    try {
      await signIn('password', {
        email,
        password,
        flow: isSignUp ? 'signUp' : 'signIn',
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
                placeholder={isSignUp ? 'Mínimo 8 caracteres' : '••••••••'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={isSignUp ? 8 : undefined}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
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

            <p className="text-center text-sm text-gray-500">
              {isSignUp ? '¿Ya tenés cuenta?' : '¿No tenés cuenta?'}{' '}
              <button
                type="button"
                className="font-medium underline underline-offset-2"
                style={{ color: 'oklch(0.60 0.20 270)' }}
                onClick={() => {
                  setMode(isSignUp ? 'signIn' : 'signUp')
                  setEmail('')
                  setPassword('')
                }}
              >
                {isSignUp ? 'Iniciar sesión' : 'Registrarse'}
              </button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
