import { useQuery, useMutation } from 'convex/react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useState } from 'react'
import { Clock, X, Building2, LogIn, LogOut, Timer, Trash2, PlusCircle, MoreVertical } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { formatTime } from '@/Shared/Lib/DateUtils'
import { useAutoSelectBusiness } from '@/Shared/Hooks/UseAutoSelectBusiness'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { PageHeader } from '@/Shared/Components/PageHeader'
import { LoadingSpinner } from '@/Shared/Components/LoadingSpinner'
import { formatDate, formatTimeWithSeconds, dayBoundsUTC, todayInArgentina } from '@/Shared/Lib/DateUtils'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { toast } from 'sonner'

type RawRecord = {
  _id: string
  employeeId: string
  employee?: { name: string } | null
  type: 'entry' | 'exit'
  timestamp: number
  faceConfidence: number
}

type DayRow = {
  key: string
  employeeId: Id<'employees'>
  employeeName: string
  date: string
  entry: RawRecord | null
  exit: RawRecord | null
}

function groupRecords(records: RawRecord[]): DayRow[] {
  const map: Record<string, DayRow> = {}
  for (const r of records) {
    const date = formatDate(r.timestamp)
    const key = `${r.employeeId}-${date}`
    if (!map[key]) {
      map[key] = { key, employeeId: r.employeeId as Id<'employees'>, employeeName: r.employee?.name ?? '—', date, entry: null, exit: null }
    }
    if (r.type === 'entry') {
      // keep earliest entry
      if (!map[key].entry || r.timestamp < map[key].entry!.timestamp) map[key].entry = r
    } else {
      // keep latest exit
      if (!map[key].exit || r.timestamp > map[key].exit!.timestamp) map[key].exit = r
    }
  }
  return Object.values(map).sort((a, b) => {
    const ta = a.entry?.timestamp ?? a.exit?.timestamp ?? 0
    const tb = b.entry?.timestamp ?? b.exit?.timestamp ?? 0
    return tb - ta
  })
}

function formatHours(ms: number) {
  const totalMin = Math.floor(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

type DialogState = {
  employeeId: Id<'employees'>
  employeeName: string
  type: 'entry' | 'exit'
  // pre-fill date+time to now
  date: string
  time: string
  // record id to delete (for delete mode)
  deleteId?: string
  deleteLabel?: string
}

function nowDatetime() {
  const now = new Date()
  const date = now.toISOString().slice(0, 10)
  const time = now.toTimeString().slice(0, 5)
  return { date, time }
}

export function AttendancePage() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/admin/attendance/' })
  const { desde, hasta, empleadoId } = search

  const { businesses, selectedBusinessId, setSelectedBusinessId, showSelector } = useAutoSelectBusiness()
  const adminManualRecord = useMutation(api.attendance.adminManualRecord)
  const adminDeleteRecord = useMutation(api.attendance.adminDeleteRecord)

  const [dialog, setDialog] = useState<DialogState | null>(null)
  const [saving, setSaving] = useState(false)

  type NewRecordState = { employeeId: Id<'employees'>; type: 'entry' | 'exit'; date: string; time: string }
  const [newRecord, setNewRecord] = useState<NewRecordState | null>(null)
  const [newSaving, setNewSaving] = useState(false)

  async function handleNewRecord() {
    if (!newRecord || !newRecord.employeeId) return
    setNewSaving(true)
    try {
      const [y, m, d] = newRecord.date.split('-').map(Number)
      const [hh, mm] = newRecord.time.split(':').map(Number)
      const ts = new Date(y, m - 1, d, hh, mm, 0).getTime()
      await adminManualRecord({ employeeId: newRecord.employeeId, type: newRecord.type, timestamp: ts })
      toast.success(newRecord.type === 'entry' ? 'Entrada registrada' : 'Salida registrada')
      setNewRecord(null)
    } catch {
      toast.error('Error al guardar')
    } finally {
      setNewSaving(false)
    }
  }

  const allEmployees = useQuery(
    api.employees.listAll,
    selectedBusinessId ? { businessId: selectedBusinessId as Id<'businesses'> } : 'skip'
  )

  const today = todayInArgentina()
  const fromDate = desde ?? today
  const toDate = hasta ?? today
  const { start } = dayBoundsUTC(fromDate)
  const { end } = dayBoundsUTC(toDate)

  const records = useQuery(
    api.attendance.listByDateRange,
    selectedBusinessId
      ? {
          businessId: selectedBusinessId as Id<'businesses'>,
          fromTimestamp: start,
          toTimestamp: end,
          employeeId: empleadoId ? (empleadoId as Id<'employees'>) : undefined,
        }
      : 'skip'
  )

  function openManualDialog(employeeId: Id<'employees'>, employeeName: string, type: 'entry' | 'exit') {
    setDialog({ employeeId, employeeName, type, ...nowDatetime() })
  }

  function openDeleteDialog(recordId: string, label: string) {
    setDialog({ employeeId: '' as Id<'employees'>, employeeName: '', type: 'exit', ...nowDatetime(), deleteId: recordId, deleteLabel: label })
  }

  async function handleSave() {
    if (!dialog) return
    setSaving(true)
    try {
      if (dialog.deleteId) {
        await adminDeleteRecord({ recordId: dialog.deleteId as Id<'attendanceRecords'> })
        toast.success('Registro eliminado')
      } else {
        const [y, m, d] = dialog.date.split('-').map(Number)
        const [hh, mm] = dialog.time.split(':').map(Number)
        const ts = new Date(y, m - 1, d, hh, mm, 0).getTime()
        await adminManualRecord({ employeeId: dialog.employeeId, type: dialog.type, timestamp: ts })
        toast.success(dialog.type === 'entry' ? 'Entrada registrada' : 'Salida registrada')
      }
      setDialog(null)
    } catch {
      toast.error('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  function setSearch(params: Record<string, string | undefined>) {
    navigate({
      to: '/admin/attendance',
      search: (prev: Record<string, string | undefined>) => ({ ...prev, ...params }),
    })
  }

  function clearFilters() {
    navigate({ to: '/admin/attendance', search: {} })
  }

  const hasFilters = desde || hasta || empleadoId

  return (
    <div>
      <PageHeader
        title="Asistencia"
        description="Registros de entrada y salida"
        action={
          selectedBusinessId && allEmployees && allEmployees.length > 0 ? (
            <Button
              onClick={() => setNewRecord({ employeeId: '' as Id<'employees'>, type: 'entry', ...nowDatetime() })}
              style={{ backgroundColor: 'oklch(0.60 0.20 270)' }}
              className="text-white gap-2"
            >
              <PlusCircle size={16} />
              Registrar turno
            </Button>
          ) : undefined
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 mb-6 p-4 rounded-xl border bg-white" style={{ borderColor: 'oklch(0.922 0 0)' }}>
        {showSelector && (
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-gray-500">Negocio</Label>
            <Select value={selectedBusinessId} onValueChange={(v) => setSelectedBusinessId(v as Id<'businesses'>)}>
              <SelectTrigger className="w-48 text-sm">
                <SelectValue placeholder="Seleccioná">
                  {selectedBusinessId
                    ? (businesses?.find((b) => b._id === selectedBusinessId)?.name ?? 'Cargando...')
                    : 'Seleccioná'}
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

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-gray-500">Desde</Label>
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => setSearch({ desde: e.target.value })}
            className="w-40 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-gray-500">Hasta</Label>
          <Input
            type="date"
            value={toDate}
            onChange={(e) => setSearch({ hasta: e.target.value })}
            className="w-40 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-gray-500">Empleado</Label>
          <Select
            value={empleadoId ?? 'todos'}
            onValueChange={(v) => setSearch({ empleadoId: v === 'todos' ? undefined : v })}
            disabled={!selectedBusinessId}
          >
            <SelectTrigger className="w-48 text-sm">
              <SelectValue placeholder="Todos">
                {empleadoId
                  ? (allEmployees?.find((e) => e._id === empleadoId)?.name ?? 'Cargando...')
                  : 'Todos'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {allEmployees?.map((e) => (
                <SelectItem key={e._id} value={e._id}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 text-gray-500">
            <X size={14} />
            Limpiar
          </Button>
        )}
      </div>

      {!selectedBusinessId ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Building2 size={48} className="text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">Seleccioná un negocio</p>
          <p className="text-gray-400 text-sm mt-1">Elegí un negocio para ver sus registros</p>
        </div>
      ) : records === undefined ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Clock size={48} className="text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">Sin registros</p>
          <p className="text-gray-400 text-sm mt-1">No hay registros para el período seleccionado</p>
        </div>
      ) : (
        <>
          {/* ── MOBILE CARDS (hidden on md+) ── */}
          <div className="flex flex-col gap-2 md:hidden">
            {groupRecords(records as RawRecord[]).map((row) => {
              const worked = row.entry && row.exit ? row.exit.timestamp - row.entry.timestamp : null
              return (
                <div key={row.key} className="rounded-xl border bg-white p-4" style={{ borderColor: 'oklch(0.922 0 0)' }}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-900">{row.employeeName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{row.date}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreVertical size={16} className="text-gray-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!row.entry && (
                          <DropdownMenuItem onClick={() => openManualDialog(row.employeeId, row.employeeName, 'entry')}>
                            <LogIn size={14} className="mr-2 text-green-600" /> Registrar entrada
                          </DropdownMenuItem>
                        )}
                        {!row.exit && (
                          <DropdownMenuItem onClick={() => openManualDialog(row.employeeId, row.employeeName, 'exit')}>
                            <LogOut size={14} className="mr-2 text-orange-500" /> Cerrar turno
                          </DropdownMenuItem>
                        )}
                        {(row.entry || row.exit) && <DropdownMenuSeparator />}
                        {row.entry && (
                          <DropdownMenuItem className="text-red-500" onClick={() => openDeleteDialog(row.entry!._id, `entrada de ${row.employeeName}`)}>
                            <Trash2 size={14} className="mr-2" /> Eliminar entrada
                          </DropdownMenuItem>
                        )}
                        {row.exit && (
                          <DropdownMenuItem className="text-red-500" onClick={() => openDeleteDialog(row.exit!._id, `salida de ${row.employeeName}`)}>
                            <Trash2 size={14} className="mr-2" /> Eliminar salida
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div>
                      <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><LogIn size={11} className="text-green-500" /> Entrada</p>
                      {row.entry ? (
                        <p className="font-mono text-sm font-medium text-gray-800">{formatTime(row.entry.timestamp)}</p>
                      ) : (
                        <p className="text-gray-300 text-sm">—</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><LogOut size={11} className="text-orange-400" /> Salida</p>
                      {row.exit ? (
                        <p className="font-mono text-sm font-medium text-orange-500">{formatTime(row.exit.timestamp)}</p>
                      ) : row.entry ? (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 font-medium">En turno</span>
                      ) : (
                        <p className="text-gray-300 text-sm">—</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Timer size={11} /> Horas</p>
                      {worked !== null ? (
                        <p className="text-sm font-semibold" style={{ color: 'oklch(0.65 0.15 250)' }}>{formatHours(worked)}</p>
                      ) : (
                        <p className="text-gray-300 text-sm">—</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── DESKTOP TABLE (hidden on mobile) ── */}
          <div className="hidden md:block rounded-xl border bg-white overflow-hidden" style={{ borderColor: 'oklch(0.922 0 0)' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead><span className="flex items-center gap-1.5 text-green-600"><LogIn size={14} /> Entrada</span></TableHead>
                  <TableHead><span className="flex items-center gap-1.5 text-orange-500"><LogOut size={14} /> Salida</span></TableHead>
                  <TableHead><span className="flex items-center gap-1.5 text-gray-500"><Timer size={14} /> Horas</span></TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupRecords(records as RawRecord[]).map((row) => {
                  const worked = row.entry && row.exit ? row.exit.timestamp - row.entry.timestamp : null
                  return (
                    <TableRow key={row.key}>
                      <TableCell className="font-medium">{row.employeeName}</TableCell>
                      <TableCell className="text-gray-500 text-sm">{row.date}</TableCell>

                      <TableCell>
                        {row.entry ? (
                          <div className="flex flex-col">
                            <span className="font-mono text-sm text-gray-800">{formatTimeWithSeconds(row.entry.timestamp)}</span>
                            <span className="text-xs text-gray-400">
                              {row.entry.deviceInfo === 'admin-manual' ? 'manual' : `${(row.entry.faceConfidence * 100).toFixed(0)}% conf.`}
                            </span>
                          </div>
                        ) : <span className="text-gray-300">—</span>}
                      </TableCell>

                      <TableCell>
                        {row.exit ? (
                          <div className="flex flex-col">
                            <span className="font-mono text-sm text-gray-800">{formatTimeWithSeconds(row.exit.timestamp)}</span>
                            <span className="text-xs text-gray-400">
                              {row.exit.deviceInfo === 'admin-manual' ? 'manual' : `${(row.exit.faceConfidence * 100).toFixed(0)}% conf.`}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600 font-medium">En turno</span>
                        )}
                      </TableCell>

                      <TableCell>
                        {worked !== null
                          ? <span className="text-sm font-medium text-gray-700">{formatHours(worked)}</span>
                          : <span className="text-gray-300">—</span>}
                      </TableCell>

                      {/* 3-dot dropdown */}
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical size={15} className="text-gray-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!row.entry && (
                              <DropdownMenuItem onClick={() => openManualDialog(row.employeeId, row.employeeName, 'entry')}>
                                <LogIn size={14} className="mr-2 text-green-600" /> Registrar entrada
                              </DropdownMenuItem>
                            )}
                            {!row.exit && (
                              <DropdownMenuItem onClick={() => openManualDialog(row.employeeId, row.employeeName, 'exit')}>
                                <LogOut size={14} className="mr-2 text-orange-500" /> Cerrar turno
                              </DropdownMenuItem>
                            )}
                            {(row.entry || row.exit) && <DropdownMenuSeparator />}
                            {row.entry && (
                              <DropdownMenuItem className="text-red-500" onClick={() => openDeleteDialog(row.entry!._id, `entrada de ${row.employeeName}`)}>
                                <Trash2 size={14} className="mr-2" /> Eliminar entrada
                              </DropdownMenuItem>
                            )}
                            {row.exit && (
                              <DropdownMenuItem className="text-red-500" onClick={() => openDeleteDialog(row.exit!._id, `salida de ${row.employeeName}`)}>
                                <Trash2 size={14} className="mr-2" /> Eliminar salida
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Dialog manual record / delete */}
      <Dialog open={!!dialog} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {dialog?.deleteId
                ? `Eliminar ${dialog.deleteLabel}`
                : `Registrar ${dialog?.type === 'entry' ? 'entrada' : 'salida'} — ${dialog?.employeeName}`}
            </DialogTitle>
          </DialogHeader>

          {dialog && !dialog.deleteId && (
            <div className="flex flex-col gap-3 py-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-gray-500">Fecha</Label>
                <Input
                  type="date"
                  value={dialog.date}
                  onChange={(e) => setDialog({ ...dialog, date: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-gray-500">Hora</Label>
                <Input
                  type="time"
                  value={dialog.time}
                  onChange={(e) => setDialog({ ...dialog, time: e.target.value })}
                />
              </div>
            </div>
          )}

          {dialog?.deleteId && (
            <p className="text-sm text-gray-500 py-2">
              ¿Confirmás que querés eliminar este registro? Esta acción no se puede deshacer.
            </p>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialog(null)} disabled={saving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className={dialog?.deleteId ? 'bg-red-500 hover:bg-red-600 text-white' : 'text-white'}
              style={!dialog?.deleteId ? { backgroundColor: 'oklch(0.60 0.20 270)' } : undefined}
            >
              {saving ? 'Guardando...' : dialog?.deleteId ? 'Eliminar' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog — Nuevo registro manual (cualquier empleado) */}
      <Dialog open={!!newRecord} onOpenChange={(open) => !open && setNewRecord(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar turno manual</DialogTitle>
          </DialogHeader>

          {newRecord && (
            <div className="flex flex-col gap-3 py-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-gray-500">Empleado</Label>
                <Select
                  value={newRecord.employeeId}
                  onValueChange={(v) => setNewRecord({ ...newRecord, employeeId: v as Id<'employees'> })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccioná un empleado">
                      {newRecord.employeeId
                        ? (allEmployees?.find((e) => e._id === newRecord.employeeId)?.name ?? 'Cargando...')
                        : 'Seleccioná un empleado'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {allEmployees?.map((e) => (
                      <SelectItem key={e._id} value={e._id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-gray-500">Tipo</Label>
                <Select
                  value={newRecord.type}
                  onValueChange={(v) => setNewRecord({ ...newRecord, type: v as 'entry' | 'exit' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">Entrada</SelectItem>
                    <SelectItem value="exit">Salida</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3">
                <div className="flex flex-col gap-1.5 flex-1">
                  <Label className="text-xs text-gray-500">Fecha</Label>
                  <Input
                    type="date"
                    value={newRecord.date}
                    onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5 flex-1">
                  <Label className="text-xs text-gray-500">Hora</Label>
                  <Input
                    type="time"
                    value={newRecord.time}
                    onChange={(e) => setNewRecord({ ...newRecord, time: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setNewRecord(null)} disabled={newSaving}>
              Cancelar
            </Button>
            <Button
              onClick={handleNewRecord}
              disabled={newSaving || !newRecord?.employeeId}
              className="text-white"
              style={{ backgroundColor: 'oklch(0.60 0.20 270)' }}
            >
              {newSaving ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
