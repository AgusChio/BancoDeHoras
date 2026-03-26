import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuthActions } from '@convex-dev/auth/react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Loader2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

type Mode = 'auto' | 'signIn' | 'signUp' | 'forgot' | 'forgot-code'

export function LoginForm() {
  const { signIn } = useAuthActions()
  const navigate = useNavigate()
  const hasAdmin = useQuery(api.seed.hasAdmin)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<Mode>('auto')

  const isSignUp = mode === 'signUp' || (mode === 'auto' && hasAdmin === false)
  const isForgot = mode === 'forgot'
  const isForgotCode = mode === 'forgot-code'

  function reset(nextMode: Mode) {
    setEmail('')
    setPassword('')
    setNewPassword('')
    setCode('')
    setMode(nextMode)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (isForgot) {
        await signIn('password', { email, flow: 'reset' })
        toast.success('Código generado — revisá los Logs en el dashboard de Convex')
        setMode('forgot-code')
        return
      }

      if (isForgotCode) {
        await signIn('password', { email, code, newPassword, flow: 'reset-verification' })
        toast.success('Contraseña actualizada')
        reset('signIn')
        return
      }

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
      } else if (msg.includes('expired') || msg.includes('invalid_token')) {
        toast.error('Código inválido o expirado')
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

  const titles: Record<string, { title: string; description: string; button: string }> = {
    signUp: {
      title: 'Crear cuenta de administrador',
      description: 'Primera vez — creá tu cuenta para comenzar',
      button: 'Crear cuenta',
    },
    signIn: {
      title: 'Iniciar sesión',
      description: 'Ingresá con tu cuenta de administrador',
      button: 'Ingresar',
    },
    forgot: {
      title: 'Recuperar contraseña',
      description: 'Ingresá tu email para recibir un código de recuperación',
      button: 'Enviar código',
    },
    'forgot-code': {
      title: 'Nueva contraseña',
      description: 'Ingresá el código que aparece en los Logs de Convex y tu nueva contraseña',
      button: 'Cambiar contraseña',
    },
  }

  const currentKey = isForgot ? 'forgot' : isForgotCode ? 'forgot-code' : isSignUp ? 'signUp' : 'signIn'
  const { title, description, button } = titles[currentKey]

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

            {/* Email — siempre visible */}
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
                disabled={isForgotCode}
              />
            </div>

            {/* Contraseña — solo en signIn/signUp */}
            {!isForgot && !isForgotCode && (
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
            )}

            {/* Código de reset */}
            {isForgotCode && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="code">Código de recuperación</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="Pegá el código de los Logs de Convex"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  autoComplete="one-time-code"
                />
                <p className="text-xs text-gray-400">
                  dashboard.convex.dev → tu proyecto → Logs
                </p>
              </div>
            )}

            {/* Nueva contraseña */}
            {isForgotCode && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="newPassword">Nueva contraseña</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="mt-1 text-white"
              style={{ backgroundColor: 'oklch(0.60 0.20 270)' }}
            >
              {loading && <Loader2 size={16} className="animate-spin mr-2" />}
              {loading ? 'Procesando...' : button}
            </Button>

            {/* Links de navegación */}
            {!isForgot && !isForgotCode && (
              <div className="flex flex-col items-center gap-2 text-sm text-gray-500">
                <p>
                  {isSignUp ? '¿Ya tenés cuenta?' : '¿No tenés cuenta?'}{' '}
                  <button
                    type="button"
                    className="font-medium underline underline-offset-2"
                    style={{ color: 'oklch(0.60 0.20 270)' }}
                    onClick={() => reset(isSignUp ? 'signIn' : 'signUp')}
                  >
                    {isSignUp ? 'Iniciar sesión' : 'Registrarse'}
                  </button>
                </p>
                {!isSignUp && (
                  <button
                    type="button"
                    className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2"
                    onClick={() => reset('forgot')}
                  >
                    Olvidé mi contraseña
                  </button>
                )}
              </div>
            )}

            {(isForgot || isForgotCode) && (
              <button
                type="button"
                className="flex items-center justify-center gap-1.5 text-sm text-gray-400 hover:text-gray-600"
                onClick={() => reset('signIn')}
              >
                <ArrowLeft size={14} /> Volver al inicio de sesión
              </button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
