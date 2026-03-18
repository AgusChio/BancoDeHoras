import { useState } from 'react'
import { useMutation } from 'convex/react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/Shared/Components/PageHeader'
import { toast } from 'sonner'
import { api } from '../../../convex/_generated/api'

function toSlug(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function NewBusinessForm() {
  const navigate = useNavigate()
  const createBusiness = useMutation(api.businesses.create)

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !slug.trim()) return
    setLoading(true)
    try {
      await createBusiness({ name: name.trim(), slug: slug.trim() })
      toast.success(`Negocio "${name}" creado. Kiosco disponible en /${slug}`)
      navigate({ to: '/admin/businesses' })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al crear el negocio')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Nuevo negocio"
        description="Creá un negocio para gestionar sus empleados y fichajes"
      />

      <form onSubmit={handleSubmit} className="max-w-md">
        <div className="rounded-xl border bg-white p-6 space-y-5" style={{ borderColor: 'oklch(0.922 0 0)' }}>
          <div className="space-y-1.5">
            <Label htmlFor="biz-name">Nombre del negocio</Label>
            <Input
              id="biz-name"
              placeholder="Ej: Panadería López"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setSlug(toSlug(e.target.value))
              }}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="biz-slug">URL del kiosco</Label>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-gray-400 shrink-0">tudominio.com/</span>
              <Input
                id="biz-slug"
                placeholder="panaderia-lopez"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="font-mono"
                required
              />
            </div>
            {slug && (
              <p className="text-xs text-gray-400">
                Los empleados ficharán en: <span className="font-mono text-gray-600">/{slug}</span>
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: '/admin/businesses' })}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !name.trim() || !slug.trim()}
              style={{ backgroundColor: 'oklch(0.60 0.20 270)' }}
              className="text-white"
            >
              {loading ? 'Creando...' : 'Crear negocio'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
