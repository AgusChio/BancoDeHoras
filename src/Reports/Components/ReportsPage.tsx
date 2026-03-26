import { useState } from 'react'
import { useQuery } from 'convex/react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { BarChart3, ChevronDown, ChevronRight, X, Building2 } from 'lucide-react'
import { useAutoSelectBusiness } from '@/Shared/Hooks/UseAutoSelectBusiness'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader } from '@/Shared/Components/PageHeader'
import { LoadingSpinner } from '@/Shared/Components/LoadingSpinner'
import { formatDuration, formatDate, formatTime, dayBoundsUTC } from '@/Shared/Lib/DateUtils'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'

function getDefaultDates() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return {
    from: `${year}-${month}-01`,
    to: `${year}-${month}-${day}`,
  }
}

export function ReportsPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/admin/reports/' })
  const { desde, hasta, empleadoId } = search

  const { businesses, selectedBusinessId, setSelectedBusinessId, showSelector } = useAutoSelectBusiness()
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null)

  const defaults = getDefaultDates()
  const fromDate = desde ?? defaults.from
  const toDate = hasta ?? defaults.to

  const { start } = dayBoundsUTC(fromDate)
  const { end } = dayBoundsUTC(toDate)

  const reports = useQuery(
    api.reports.hoursByEmployee,
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
      to: '/admin/reports',
      search: (prev: Record<string, string | undefined>) => ({ ...prev, ...params }),
    })
  }

  function clearFilters() {
    navigate({ to: '/admin/reports', search: {} })
  }

  const hasFilters = desde || hasta || empleadoId

  return (
    <div>
      <PageHeader
        title="Reportes de horas"
        description="Horas trabajadas por empleado"
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
          <p className="text-gray-400 text-sm mt-1">Elegí un negocio para ver sus reportes</p>
        </div>
      ) : reports === undefined ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <BarChart3 size={48} className="text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">Sin datos</p>
          <p className="text-gray-400 text-sm mt-1">
            No hay horas registradas para el período seleccionado
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: 'oklch(0.922 0 0)' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Empleado</TableHead>
                <TableHead className="text-center">Días</TableHead>
                <TableHead className="text-center">Total horas</TableHead>
                <TableHead className="text-center">Promedio/día</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => {
                const isExpanded = expandedEmployee === report.employeeId
                const avgMs = report.workDays > 0 ? report.totalMs / report.workDays : 0

                return (
                  <>
                    <TableRow
                      key={report.employeeId}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => setExpandedEmployee(isExpanded ? null : report.employeeId)}
                    >
                      <TableCell>
                        {isExpanded ? (
                          <ChevronDown size={16} className="text-gray-400" />
                        ) : (
                          <ChevronRight size={16} className="text-gray-400" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{report.employeeName}</TableCell>
                      <TableCell className="text-center text-gray-600">
                        {report.workDays}
                      </TableCell>
                      <TableCell className="text-center font-semibold" style={{ color: 'oklch(0.65 0.15 250)' }}>
                        {formatDuration(report.totalMs)}
                      </TableCell>
                      <TableCell className="text-center text-gray-600">
                        {report.workDays > 0 ? formatDuration(avgMs) : '—'}
                      </TableCell>
                    </TableRow>

                    {isExpanded &&
                      report.days.map((day) => {
                        const sortedEntries = [...day.entries].sort((a, b) => a - b)
                        const sortedExits = [...day.exits].sort((a, b) => a - b)
                        const pairs = Math.max(sortedEntries.length, sortedExits.length)

                        return (
                          <TableRow key={day.date} className="bg-gray-50/60 hover:bg-gray-50">
                            <TableCell />
                            {/* Fecha */}
                            <TableCell className="pl-8">
                              <span className="text-sm font-medium text-gray-600">
                                {formatDate(new Date(`${day.date}T12:00:00-03:00`).getTime())}
                              </span>
                            </TableCell>
                            {/* Turnos: entrada → salida por cada par */}
                            <TableCell colSpan={2}>
                              <div className="flex flex-col gap-1">
                                {Array.from({ length: pairs }).map((_, i) => {
                                  const entry = sortedEntries[i]
                                  const exit = sortedExits[i]
                                  const pairMs = entry && exit ? exit - entry : null
                                  return (
                                    <div key={i} className="flex items-center gap-2 text-sm">
                                      {/* Entrada */}
                                      <span className={`flex items-center gap-1 font-mono ${entry ? 'text-green-600' : 'text-gray-300'}`}>
                                        {entry ? formatTime(entry) : '—:——'}
                                      </span>
                                      <span className="text-gray-300">→</span>
                                      {/* Salida */}
                                      {exit ? (
                                        <span className="font-mono text-orange-500">{formatTime(exit)}</span>
                                      ) : (
                                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 font-medium">
                                          En turno
                                        </span>
                                      )}
                                      {/* Duración del par */}
                                      {pairMs !== null && (
                                        <span className="text-xs text-gray-400 ml-1">
                                          ({formatDuration(pairMs)})
                                        </span>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </TableCell>
                            {/* Total del día */}
                            <TableCell className="text-center">
                              {day.inProgress ? (
                                <span className="text-xs" style={{ color: 'oklch(0.75 0.18 60)' }}>En curso</span>
                              ) : day.totalMs > 0 ? (
                                <span className="text-sm font-semibold" style={{ color: 'oklch(0.65 0.15 250)' }}>
                                  {formatDuration(day.totalMs)}
                                </span>
                              ) : (
                                <span className="text-gray-300 text-sm">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                  </>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
