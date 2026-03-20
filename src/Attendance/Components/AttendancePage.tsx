import { useQuery } from 'convex/react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { Clock, X, Building2, LogIn, LogOut, Timer } from 'lucide-react'
import { useAutoSelectBusiness } from '@/Shared/Hooks/UseAutoSelectBusiness'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader } from '@/Shared/Components/PageHeader'
import { LoadingSpinner } from '@/Shared/Components/LoadingSpinner'
import { formatDate, formatTimeWithSeconds, dayBoundsUTC, todayInArgentina } from '@/Shared/Lib/DateUtils'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'

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
      map[key] = { key, employeeName: r.employee?.name ?? '—', date, entry: null, exit: null }
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

export function AttendancePage() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/admin/attendance/' })
  const { desde, hasta, empleadoId } = search

  const { businesses, selectedBusinessId, setSelectedBusinessId, showSelector } = useAutoSelectBusiness()

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
        <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: 'oklch(0.922 0 0)' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empleado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>
                  <span className="flex items-center gap-1.5 text-green-600">
                    <LogIn size={14} /> Entrada
                  </span>
                </TableHead>
                <TableHead>
                  <span className="flex items-center gap-1.5 text-orange-500">
                    <LogOut size={14} /> Salida
                  </span>
                </TableHead>
                <TableHead>
                  <span className="flex items-center gap-1.5 text-gray-500">
                    <Timer size={14} /> Horas
                  </span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupRecords(records as RawRecord[]).map((row) => {
                const worked =
                  row.entry && row.exit ? row.exit.timestamp - row.entry.timestamp : null
                return (
                  <TableRow key={row.key}>
                    <TableCell className="font-medium">{row.employeeName}</TableCell>
                    <TableCell className="text-gray-500 text-sm">{row.date}</TableCell>

                    {/* Entrada */}
                    <TableCell>
                      {row.entry ? (
                        <div className="flex flex-col">
                          <span className="font-mono text-sm text-gray-800">
                            {formatTimeWithSeconds(row.entry.timestamp)}
                          </span>
                          <span className="text-xs text-gray-400">
                            {(row.entry.faceConfidence * 100).toFixed(0)}% confianza
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </TableCell>

                    {/* Salida */}
                    <TableCell>
                      {row.exit ? (
                        <div className="flex flex-col">
                          <span className="font-mono text-sm text-gray-800">
                            {formatTimeWithSeconds(row.exit.timestamp)}
                          </span>
                          <span className="text-xs text-gray-400">
                            {(row.exit.faceConfidence * 100).toFixed(0)}% confianza
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600 font-medium">
                          En turno
                        </span>
                      )}
                    </TableCell>

                    {/* Horas */}
                    <TableCell>
                      {worked !== null ? (
                        <span className="text-sm font-medium text-gray-700">
                          {formatHours(worked)}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
