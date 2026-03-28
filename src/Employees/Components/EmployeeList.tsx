import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { Link } from '@tanstack/react-router'
import { UserPlus, Camera, UserX, UserCheck, Users, Pencil, Trash2, Building2, Clock, AlertTriangle, MoreVertical } from 'lucide-react'
import { FaceCaptureWizard } from './FaceCaptureWizard'
import { useAutoSelectBusiness } from '@/Shared/Hooks/UseAutoSelectBusiness'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  workSchedule?: { dayOfWeek: number; startTime: string; endTime: string }[]
}

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

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
  const updateSchedule = useMutation(api.employees.updateSchedule)

  const [editTarget, setEditTarget] = useState<Employee | null>(null)
  const [editName, setEditName] = useState('')
  const [editDoc, setEditDoc] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [scheduleTarget, setScheduleTarget] = useState<Employee | null>(null)
  const [faceCaptureTarget, setFaceCaptureTarget] = useState<Employee | null>(null)
  const [scheduleSlots, setScheduleSlots] = useState<{ dayOfWeek: number; startTime: string; endTime: string; enabled: boolean }[]>([])
  const [scheduleLoading, setScheduleLoading] = useState(false)

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

  function openSchedule(emp: Employee) {
    const existing = emp.workSchedule ?? []
    setScheduleSlots(
      [0, 1, 2, 3, 4, 5, 6].map((d) => {
        const slot = existing.find((s) => s.dayOfWeek === d)
        return { dayOfWeek: d, startTime: slot?.startTime ?? '09:00', endTime: slot?.endTime ?? '18:00', enabled: !!slot }
      })
    )
    setScheduleTarget(emp)
  }

  async function handleSaveSchedule() {
    if (!scheduleTarget) return
    setScheduleLoading(true)
    try {
      const workSchedule = scheduleSlots
        .filter((s) => s.enabled)
        .map(({ dayOfWeek, startTime, endTime }) => ({ dayOfWeek, startTime, endTime }))
      await updateSchedule({ id: scheduleTarget._id, workSchedule })
      toast.success('Horario guardado')
      setScheduleTarget(null)
    } catch {
      toast.error('Error al guardar horario')
    } finally {
      setScheduleLoading(false)
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
        <>
          {/* Mobile card list */}
          <div className="flex flex-col gap-3 md:hidden">
            {employees.map((employee) => (
              <div
                key={employee._id}
                className="rounded-xl border bg-white p-4"
                style={{ borderColor: 'oklch(0.922 0 0)', opacity: employee.isActive ? 1 : 0.6 }}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback
                      style={{ backgroundColor: 'oklch(0.60 0.20 270 / 0.15)', color: 'oklch(0.60 0.20 270)' }}
                      className="font-semibold text-sm"
                    >
                      {employee.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* Name + doc */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{employee.name}</p>
                    <p className="text-xs text-gray-500">Doc: {employee.documentId}</p>
                  </div>

                  {/* 3-dot menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreVertical size={16} className="text-gray-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => setFaceCaptureTarget(employee)}>
                        <Camera size={15} className="mr-2 text-gray-500" />
                        Configurar cara
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEdit(employee)}>
                        <Pencil size={15} className="mr-2 text-gray-500" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openSchedule(employee)}>
                        <Clock size={15} className="mr-2 text-gray-500" />
                        Horario
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleToggleActive(employee._id, employee.isActive)}>
                        {employee.isActive ? (
                          <>
                            <UserX size={15} className="mr-2 text-red-400" />
                            <span className="text-red-500">Desactivar</span>
                          </>
                        ) : (
                          <>
                            <UserCheck size={15} className="mr-2" style={{ color: 'oklch(0.70 0.20 145)' }} />
                            <span style={{ color: 'oklch(0.50 0.20 145)' }}>Activar</span>
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleteTarget(employee)}
                        className="text-red-500 focus:text-red-600"
                      >
                        <Trash2 size={15} className="mr-2 text-red-400" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Badges row */}
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className="text-xs"
                    style={{
                      borderColor: employee.isActive ? 'oklch(0.70 0.20 145)' : 'oklch(0.922 0 0)',
                      color: employee.isActive ? 'oklch(0.50 0.20 145)' : 'oklch(0.556 0 0)',
                    }}
                  >
                    {employee.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>

                  {employee.faceDescriptors.length > 0 ? (
                    <Badge
                      variant="outline"
                      className="text-xs gap-1"
                      style={{ borderColor: 'oklch(0.65 0.15 185)', color: 'oklch(0.45 0.15 185)' }}
                    >
                      <Camera size={11} />
                      {employee.faceDescriptors.length} foto{employee.faceDescriptors.length > 1 ? 's' : ''}
                    </Badge>
                  ) : (
                    <button
                      onClick={() => setFaceCaptureTarget(employee)}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded-full border font-medium transition-colors hover:bg-amber-50"
                      style={{ borderColor: 'oklch(0.75 0.18 75)', color: 'oklch(0.55 0.18 75)' }}
                      title="Sin fotos — no puede fichar. Click para configurar."
                    >
                      <AlertTriangle size={11} />
                      Sin foto · Configurar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop card list */}
          <div className="hidden md:grid gap-3">
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
                  {employee.faceDescriptors.length > 0 ? (
                    <Badge variant="outline" className="text-xs gap-1" style={{ borderColor: 'oklch(0.65 0.15 185)', color: 'oklch(0.45 0.15 185)' }}>
                      <Camera size={12} />
                      {employee.faceDescriptors.length} foto{employee.faceDescriptors.length > 1 ? 's' : ''}
                    </Badge>
                  ) : (
                    <button
                      onClick={() => setFaceCaptureTarget(employee)}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded-full border font-medium transition-colors hover:bg-amber-50"
                      style={{ borderColor: 'oklch(0.75 0.18 75)', color: 'oklch(0.55 0.18 75)' }}
                      title="Sin fotos — no puede fichar. Click para configurar."
                    >
                      <AlertTriangle size={11} />
                      Sin foto · Configurar
                    </button>
                  )}

                  <span className="text-xs text-gray-400">
                    {formatDate(employee.createdAt)}
                  </span>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setFaceCaptureTarget(employee)}
                    title={employee.faceDescriptors.length > 0 ? 'Re-capturar cara' : 'Configurar reconocimiento facial'}
                  >
                    <Camera size={15} className={employee.faceDescriptors.length === 0 ? 'text-amber-400' : 'text-gray-400'} />
                  </Button>

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
                    onClick={() => openSchedule(employee)}
                    title="Horario"
                  >
                    <Clock size={15} className="text-gray-400" />
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
        </>
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

      {/* Dialog — Captura de cara */}
      <Dialog open={!!faceCaptureTarget} onOpenChange={(open) => { if (!open) setFaceCaptureTarget(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {faceCaptureTarget?.faceDescriptors.length === 0
                ? `Configurar reconocimiento facial — ${faceCaptureTarget?.name}`
                : `Actualizar fotos — ${faceCaptureTarget?.name}`}
            </DialogTitle>
          </DialogHeader>
          {faceCaptureTarget && (
            <FaceCaptureWizard
              existingEmployeeId={faceCaptureTarget._id}
              onComplete={() => setFaceCaptureTarget(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog — Horario */}
      <Dialog open={!!scheduleTarget} onOpenChange={(open) => { if (!open) setScheduleTarget(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Horario laboral — {scheduleTarget?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-2 max-h-96 overflow-y-auto">
            {scheduleSlots.map((slot, i) => (
              <div key={slot.dayOfWeek} className={`flex items-center gap-3 p-2 rounded-lg border ${slot.enabled ? 'border-indigo-200 bg-indigo-50/40' : 'border-gray-100'}`}>
                <input
                  type="checkbox"
                  checked={slot.enabled}
                  onChange={(e) => {
                    const next = [...scheduleSlots]
                    next[i] = { ...slot, enabled: e.target.checked }
                    setScheduleSlots(next)
                  }}
                  className="w-4 h-4 accent-indigo-600"
                />
                <span className="w-20 text-sm font-medium text-gray-700">{DAY_NAMES[slot.dayOfWeek]}</span>
                <Input
                  type="time"
                  value={slot.startTime}
                  disabled={!slot.enabled}
                  onChange={(e) => {
                    const next = [...scheduleSlots]
                    next[i] = { ...slot, startTime: e.target.value }
                    setScheduleSlots(next)
                  }}
                  className="w-28 text-sm h-8"
                />
                <span className="text-gray-400 text-sm">→</span>
                <Input
                  type="time"
                  value={slot.endTime}
                  disabled={!slot.enabled}
                  onChange={(e) => {
                    const next = [...scheduleSlots]
                    next[i] = { ...slot, endTime: e.target.value }
                    setScheduleSlots(next)
                  }}
                  className="w-28 text-sm h-8"
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleTarget(null)}>Cancelar</Button>
            <Button onClick={handleSaveSchedule} disabled={scheduleLoading} style={{ backgroundColor: 'oklch(0.60 0.20 270)' }} className="text-white">
              {scheduleLoading ? 'Guardando...' : 'Guardar horario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
