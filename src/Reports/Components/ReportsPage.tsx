import { useState } from 'react'
import { useQuery } from 'convex/react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { BarChart3, ChevronDown, ChevronRight, X, Building2, FileDown } from 'lucide-react'
import { useAutoSelectBusiness } from '@/Shared/Hooks/UseAutoSelectBusiness'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader } from '@/Shared/Components/PageHeader'
import { LoadingSpinner } from '@/Shared/Components/LoadingSpinner'
import { formatDuration, formatDate, formatTime, dayBoundsUTC } from '@/Shared/Lib/DateUtils'
import { isFeriado } from '@/Shared/Lib/Holidays'
import { generateEmployeePdf } from '../Lib/generatePdf'
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

function getScheduledMs(date: string, schedule: { dayOfWeek: number; startTime: string; endTime: string }[]): number {
  const dow = new Date(date + 'T12:00:00-03:00').getDay()
  const slot = schedule.find((s) => s.dayOfWeek === dow)
  if (!slot) return 0
  const [sh, sm] = slot.startTime.split(':').map(Number)
  const [eh, em] = slot.endTime.split(':').map(Number)
  return ((eh * 60 + em) - (sh * 60 + sm)) * 60000
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
        <>
          {/* ── Mobile card layout (visible below md) ── */}
          <div className="flex flex-col gap-3 md:hidden">
            {reports.map((report) => {
              const isExpanded = expandedEmployee === report.employeeId
              const avgMs = report.workDays > 0 ? report.totalMs / report.workDays : 0

              return (
                <div
                  key={report.employeeId}
                  className="rounded-xl border bg-white overflow-hidden"
                  style={{ borderColor: 'oklch(0.922 0 0)' }}
                >
                  {/* Card header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'oklch(0.922 0 0)' }}>
                    <span className="font-semibold text-gray-800">{report.employeeName}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      title="Descargar PDF"
                      onClick={() => generateEmployeePdf(report, fromDate, toDate)}
                    >
                      <FileDown size={15} className="text-gray-400" />
                    </Button>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 divide-x px-0 py-3" style={{ borderColor: 'oklch(0.922 0 0)' }}>
                    <div className="flex flex-col items-center gap-0.5 px-3">
                      <span className="text-xs text-gray-400">Días</span>
                      <span className="text-base font-semibold text-gray-700">{report.workDays}</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5 px-3">
                      <span className="text-xs text-gray-400">Total</span>
                      <span className="text-base font-bold" style={{ color: 'oklch(0.65 0.15 250)' }}>
                        {formatDuration(report.totalMs)}
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5 px-3">
                      <span className="text-xs text-gray-400">Promedio</span>
                      <span className="text-base font-semibold text-gray-700">
                        {report.workDays > 0 ? formatDuration(avgMs) : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Expand button */}
                  <button
                    className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-gray-400 border-t hover:bg-gray-50 transition-colors"
                    style={{ borderColor: 'oklch(0.922 0 0)' }}
                    onClick={() => setExpandedEmployee(isExpanded ? null : report.employeeId)}
                  >
                    {isExpanded ? (
                      <>
                        <ChevronDown size={14} />
                        Ocultar días
                      </>
                    ) : (
                      <>
                        <ChevronRight size={14} />
                        Ver días ({report.days.length})
                      </>
                    )}
                  </button>

                  {/* Day detail cards */}
                  {isExpanded && (
                    <div className="flex flex-col gap-2 px-3 pb-3 pt-1">
                      {report.days.map((day) => {
                        const sortedEntries = [...day.entries].sort((a, b) => a - b)
                        const sortedExits = [...day.exits].sort((a, b) => a - b)
                        const pairs = Math.max(sortedEntries.length, sortedExits.length)
                        const feriado = isFeriado(day.date)

                        const scheduledMs = getScheduledMs(day.date, report.workSchedule ?? [])
                        const extraMs = scheduledMs > 0 && !day.inProgress ? Math.max(0, day.totalMs - scheduledMs) : 0

                        return (
                          <div
                            key={day.date}
                            className={`rounded-lg border px-3 py-2.5 ${feriado ? 'bg-red-50/40' : 'bg-gray-50/60'}`}
                            style={{ borderColor: 'oklch(0.922 0 0)' }}
                          >
                            {/* Date row */}
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-700">
                                  {formatDate(new Date(`${day.date}T12:00:00-03:00`).getTime())}
                                </span>
                                {feriado && (
                                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 font-medium shrink-0">
                                    {feriado}
                                  </span>
                                )}
                              </div>
                              {/* Total del día */}
                              {day.inProgress ? (
                                <span className="text-xs" style={{ color: 'oklch(0.75 0.18 60)' }}>En curso</span>
                              ) : day.totalMs > 0 ? (
                                <div className="text-right">
                                  <span className="text-sm font-semibold" style={{ color: 'oklch(0.65 0.15 250)' }}>
                                    {formatDuration(day.totalMs)}
                                  </span>
                                  {extraMs > 0 && (
                                    <div className="text-xs text-orange-500 font-medium">+{formatDuration(extraMs)} extra</div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-300 text-sm">—</span>
                              )}
                            </div>
                            {/* Entry/exit pairs */}
                            <div className="flex flex-col gap-1">
                              {Array.from({ length: pairs }).map((_, i) => {
                                const entry = sortedEntries[i]
                                const exit = sortedExits[i]
                                const pairMs = entry && exit ? exit - entry : null
                                return (
                                  <div key={i} className="flex items-center gap-2 text-sm">
                                    <span className={`font-mono ${entry ? 'text-green-600' : 'text-gray-300'}`}>
                                      {entry ? formatTime(entry) : '—:——'}
                                    </span>
                                    <span className="text-gray-300">→</span>
                                    {exit ? (
                                      <span className="font-mono text-orange-500">{formatTime(exit)}</span>
                                    ) : (
                                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 font-medium">
                                        En turno
                                      </span>
                                    )}
                                    {pairMs !== null && (
                                      <span className="text-xs text-gray-400 ml-1">
                                        ({formatDuration(pairMs)})
                                      </span>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* ── Desktop table layout (visible from md up) ── */}
          <div className="hidden md:block rounded-xl border bg-white overflow-hidden" style={{ borderColor: 'oklch(0.922 0 0)' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>Empleado</TableHead>
                  <TableHead className="text-center">Días</TableHead>
                  <TableHead className="text-center">Total horas</TableHead>
                  <TableHead className="text-center">Promedio/día</TableHead>
                  <TableHead className="w-10" />
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
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title="Descargar PDF"
                            onClick={(e) => {
                              e.stopPropagation()
                              generateEmployeePdf(report, fromDate, toDate)
                            }}
                          >
                            <FileDown size={15} className="text-gray-400 hover:text-indigo-600" />
                          </Button>
                        </TableCell>
                      </TableRow>

                      {isExpanded &&
                        report.days.map((day) => {
                          const sortedEntries = [...day.entries].sort((a, b) => a - b)
                          const sortedExits = [...day.exits].sort((a, b) => a - b)
                          const pairs = Math.max(sortedEntries.length, sortedExits.length)
                          const feriado = isFeriado(day.date)

                          const scheduledMs = getScheduledMs(day.date, report.workSchedule ?? [])
                          const extraMs = scheduledMs > 0 && !day.inProgress ? Math.max(0, day.totalMs - scheduledMs) : 0

                          return (
                            <TableRow key={day.date} className={`hover:bg-gray-50 ${feriado ? 'bg-red-50/40' : 'bg-gray-50/60'}`}>
                              <TableCell />
                              {/* Fecha */}
                              <TableCell className="pl-8">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-600">
                                    {formatDate(new Date(`${day.date}T12:00:00-03:00`).getTime())}
                                  </span>
                                  {feriado && (
                                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 font-medium shrink-0">
                                      {feriado}
                                    </span>
                                  )}
                                </div>
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
                                        <span className={`flex items-center gap-1 font-mono ${entry ? 'text-green-600' : 'text-gray-300'}`}>
                                          {entry ? formatTime(entry) : '—:——'}
                                        </span>
                                        <span className="text-gray-300">→</span>
                                        {exit ? (
                                          <span className="font-mono text-orange-500">{formatTime(exit)}</span>
                                        ) : (
                                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 font-medium">
                                            En turno
                                          </span>
                                        )}
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
                                  <div>
                                    <span className="text-sm font-semibold" style={{ color: 'oklch(0.65 0.15 250)' }}>
                                      {formatDuration(day.totalMs)}
                                    </span>
                                    {extraMs > 0 && (
                                      <div className="text-xs text-orange-500 font-medium">+{formatDuration(extraMs)} extra</div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-300 text-sm">—</span>
                                )}
                              </TableCell>
                              <TableCell />
                            </TableRow>
                          )
                        })}
                    </>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}
