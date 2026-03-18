import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { Link } from '@tanstack/react-router'
import { UserPlus, Camera, UserX, UserCheck, Users, Pencil, Trash2, Building2 } from 'lucide-react'
import { useAutoSelectBusiness } from '@/Shared/Hooks/UseAutoSelectBusiness'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/Shared/Components/PageHeader'
import { LoadingSpinner } from '@/Shared/Components/LoadingSpinner'
import { formatDate } from '@/Shared/Lib/DateUtils'
import { toast } from 'sonner'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'

type Employee = {
  _id: Id<'employees'>
  name: string
  documentId: string
  isActive: boolean
  faceDescriptors: number[][]
  createdAt: number
}

export function EmployeeList() {
  const { businesses, selectedBusinessId, setSelectedBusinessId, showSelector } = useAutoSelectBusiness()

  const employees = useQuery(
    api.employees.listAll,
    selectedBusinessId ? { businessId: selectedBusinessId as Id<'businesses'> } : 'skip'
  )

  const deactivate = useMutation(api.employees.deactivate)
  const activate = useMutation(api.employees.activate)
  const update = useMutation(api.employees.update)
  const deleteEmployee = useMutation(api.employees.deleteEmployee)

  const [editTarget, setEditTarget] = useState<Employee | null>(null)
  const [editName, setEditName] = useState('')
  const [editDoc, setEditDoc] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  function openEdit(emp: Employee) {
    setEditTarget(emp)
    setEditName(emp.name)
    setEditDoc(emp.documentId)
  }

  async function handleSaveEdit() {
    if (!editTarget) return
    setEditLoading(true)
    try {
      await update({ id: editTarget._id, name: editName.trim(), documentId: editDoc.trim() })
      toast.success('Empleado actualizado')
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
      await deleteEmployee({ id: deleteTarget._id })
      toast.success('Empleado eliminado')
      setDeleteTarget(null)
    } catch {
      toast.error('Error al eliminar empleado')
    } finally {
      setDeleteLoading(false)
    }
  }

  async function handleToggleActive(id: Id<'employees'>, isActive: boolean) {
    try {
      if (isActive) {
        await deactivate({ id })
        toast.success('Empleado desactivado')
      } else {
        await activate({ id })
        toast.success('Empleado activado')
      }
    } catch {
      toast.error('Error al actualizar empleado')
    }
  }

  return (
    <div>
      <PageHeader
        title="Empleados"
        description={
          employees
            ? `${employees.filter((e) => e.isActive).length} activos`
            : 'Seleccioná un negocio'
        }
        action={
          <Link to="/admin/employees/new">
            <Button style={{ backgroundColor: 'oklch(0.60 0.20 270)' }} className="text-white gap-2">
              <UserPlus size={16} />
              Agregar empleado
            </Button>
          </Link>
        }
      />

      {/* Business selector — solo si hay más de un negocio */}
      {showSelector && (
        <div className="mb-5 flex items-center gap-3">
          <Building2 size={16} className="text-gray-400 shrink-0" />
          <Select value={selectedBusinessId} onValueChange={(v) => setSelectedBusinessId(v as Id<'businesses'>)}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Seleccioná un negocio">
                {selectedBusinessId
                  ? (businesses?.find((b) => b._id === selectedBusinessId)?.name ?? 'Cargando...')
                  : 'Seleccioná un negocio'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {businesses?.map((b) => (
                <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {!selectedBusinessId ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Building2 size={48} className="text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">Seleccioná un negocio</p>
          <p className="text-gray-400 text-sm mt-1">
            Elegí un negocio para ver sus empleados
          </p>
        </div>
      ) : employees === undefined ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : employees.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Users size={48} className="text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">No hay empleados registrados</p>
          <p className="text-gray-400 text-sm mt-1">
            Agregá el primer empleado para comenzar
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {employees.map((employee) => (
            <div
              key={employee._id}
              className="flex items-center gap-4 rounded-xl border bg-white p-4"
              style={{ borderColor: 'oklch(0.922 0 0)', opacity: employee.isActive ? 1 : 0.6 }}
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback
                  style={{ backgroundColor: 'oklch(0.60 0.20 270 / 0.15)', color: 'oklch(0.60 0.20 270)' }}
                  className="font-semibold text-sm"
                >
                  {employee.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 truncate">{employee.name}</p>
                  <Badge
                    variant="outline"
                    className="text-xs shrink-0"
                    style={{
                      borderColor: employee.isActive ? 'oklch(0.70 0.20 145)' : 'oklch(0.922 0 0)',
                      color: employee.isActive ? 'oklch(0.50 0.20 145)' : 'oklch(0.556 0 0)',
                    }}
                  >
                    {employee.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500">Doc: {employee.documentId}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  variant="outline"
                  className="text-xs gap-1"
                  style={{
                    borderColor: employee.faceDescriptors.length > 0 ? 'oklch(0.65 0.15 185)' : 'oklch(0.922 0 0)',
                    color: employee.faceDescriptors.length > 0 ? 'oklch(0.45 0.15 185)' : 'oklch(0.556 0 0)',
                  }}
                >
                  <Camera size={12} />
                  {employee.faceDescriptors.length > 0
                    ? `${employee.faceDescriptors.length} foto${employee.faceDescriptors.length > 1 ? 's' : ''}`
                    : 'Sin foto'}
                </Badge>

                <span className="text-xs text-gray-400">
                  {formatDate(employee.createdAt)}
                </span>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => openEdit(employee)}
                  title="Editar"
                >
                  <Pencil size={15} className="text-gray-400" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleToggleActive(employee._id, employee.isActive)}
                  title={employee.isActive ? 'Desactivar' : 'Activar'}
                >
                  {employee.isActive ? (
                    <UserX size={16} className="text-red-400" />
                  ) : (
                    <UserCheck size={16} style={{ color: 'oklch(0.70 0.20 145)' }} />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setDeleteTarget(employee)}
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
            <DialogTitle>Editar empleado</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="edit-name">Nombre</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="edit-doc">Documento</Label>
              <Input
                id="edit-doc"
                value={editDoc}
                onChange={(e) => setEditDoc(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Cancelar</Button>
            <Button
              onClick={handleSaveEdit}
              disabled={editLoading || !editName.trim() || !editDoc.trim()}
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
            <DialogTitle>Eliminar empleado</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">
            ¿Eliminás a <strong>{deleteTarget?.name}</strong>? Esta acción borra todos sus datos y no se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
