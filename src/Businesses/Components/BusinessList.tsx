import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { Link } from '@tanstack/react-router'
import { Plus, Building2, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/Shared/Components/PageHeader'
import { LoadingSpinner } from '@/Shared/Components/LoadingSpinner'
import { toast } from 'sonner'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'

type Business = {
  _id: Id<'businesses'>
  name: string
  slug: string
}

function toSlug(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function BusinessList() {
  const businesses = useQuery(api.businesses.list)
  const updateBusiness = useMutation(api.businesses.update)
  const deleteBusiness = useMutation(api.businesses.deleteById)

  const [editTarget, setEditTarget] = useState<Business | null>(null)
  const [editName, setEditName] = useState('')
  const [editSlug, setEditSlug] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Business | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  function openEdit(b: Business) {
    setEditTarget(b)
    setEditName(b.name)
    setEditSlug(b.slug)
  }

  async function handleSaveEdit() {
    if (!editTarget) return
    setEditLoading(true)
    try {
      await updateBusiness({ id: editTarget._id, name: editName.trim(), slug: editSlug.trim() })
      toast.success('Negocio actualizado')
      setEditTarget(null)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al actualizar')
    } finally {
      setEditLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await deleteBusiness({ id: deleteTarget._id })
      toast.success('Negocio eliminado')
      setDeleteTarget(null)
    } catch {
      toast.error('Error al eliminar negocio')
    } finally {
      setDeleteLoading(false)
    }
  }

  if (businesses === undefined) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Negocios"
        description={`${businesses.length} registrado${businesses.length !== 1 ? 's' : ''}`}
        action={
          <Link to="/admin/businesses/new">
            <Button style={{ backgroundColor: 'oklch(0.60 0.20 270)' }} className="text-white gap-2">
              <Plus size={16} />
              Nuevo negocio
            </Button>
          </Link>
        }
      />

      {businesses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Building2 size={48} className="text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">No hay negocios registrados</p>
          <p className="text-gray-400 text-sm mt-1">
            Creá el primer negocio para comenzar
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {businesses.map((b) => (
            <div
              key={b._id}
              className="flex items-center gap-4 rounded-xl border bg-white p-4"
              style={{ borderColor: 'oklch(0.922 0 0)' }}
            >
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'oklch(0.60 0.20 270 / 0.1)' }}
              >
                <Building2 size={20} style={{ color: 'oklch(0.60 0.20 270)' }} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{b.name}</p>
                <p className="text-sm text-gray-400 font-mono">/{b.slug}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`/${b.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-2 py-1 rounded border text-gray-500 hover:text-gray-800 transition-colors"
                  style={{ borderColor: 'oklch(0.922 0 0)' }}
                >
                  Ver kiosco ↗
                </a>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => openEdit(b)}
                  title="Editar"
                >
                  <Pencil size={15} className="text-gray-400" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setDeleteTarget(b)}
                  title="Eliminar"
                >
                  <Trash2 size={15} className="text-red-400" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog — Editar */}
      <Dialog open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar negocio</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="edit-biz-name">Nombre</Label>
              <Input
                id="edit-biz-name"
                value={editName}
                onChange={(e) => {
                  setEditName(e.target.value)
                  setEditSlug(toSlug(e.target.value))
                }}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="edit-biz-slug">URL del kiosco</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">/{' '}</span>
                <Input
                  id="edit-biz-slug"
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Cancelar</Button>
            <Button
              onClick={handleSaveEdit}
              disabled={editLoading || !editName.trim() || !editSlug.trim()}
              style={{ backgroundColor: 'oklch(0.60 0.20 270)' }}
              className="text-white"
            >
              {editLoading ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog — Eliminar */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar negocio</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">
            ¿Eliminás <strong>{deleteTarget?.name}</strong>? Esto no elimina los empleados del negocio pero perderán su kiosco. Esta acción no se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
