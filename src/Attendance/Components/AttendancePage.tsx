import { useQuery } from 'convex/react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { Clock, X, Building2 } from 'lucide-react'
import { useAutoSelectBusiness } from '@/Shared/Hooks/UseAutoSelectBusiness'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader } from '@/Shared/Components/PageHeader'
import { LoadingSpinner } from '@/Shared/Components/LoadingSpinner'
import { AttendanceBadge } from './AttendanceBadge'
import { formatDate, formatTimeWithSeconds, dayBoundsUTC, todayInArgentina } from '@/Shared/Lib/DateUtils'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'

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
                <TableHead>Tipo</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead className="text-right">Confianza</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record._id}>
                  <TableCell className="font-medium">
                    {record.employee?.name ?? '—'}
                  </TableCell>
                  <TableCell>
                    <AttendanceBadge type={record.type} />
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {formatDate(record.timestamp)}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-gray-600">
                    {formatTimeWithSeconds(record.timestamp)}
                  </TableCell>
                  <TableCell className="text-right text-sm text-gray-400">
                    {(record.faceConfidence * 100).toFixed(0)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
