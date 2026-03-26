import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { isFeriado } from '@/Shared/Lib/Holidays'
import type { EmployeeReport } from '../../../convex/reports'

type WorkSlot = { dayOfWeek: number; startTime: string; endTime: string }

function formatTime(ts: number): string {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(ts)
}

function formatMs(ms: number): string {
  const totalMin = Math.floor(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function getScheduledMs(date: string, schedule: WorkSlot[]): number {
  const dow = new Date(date + 'T12:00:00-03:00').getDay()
  const slot = schedule.find((s) => s.dayOfWeek === dow)
  if (!slot) return 0
  const [sh, sm] = slot.startTime.split(':').map(Number)
  const [eh, em] = slot.endTime.split(':').map(Number)
  return ((eh * 60 + em) - (sh * 60 + sm)) * 60000
}

function getDayName(date: string): string {
  const dow = new Date(date + 'T12:00:00-03:00').getDay()
  return ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][dow]
}

export function generateEmployeePdf(
  report: EmployeeReport,
  fromDate: string,
  toDate: string,
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const schedule = report.workSchedule ?? []

  // Header
  doc.setFontSize(18)
  doc.setTextColor(60, 60, 140)
  doc.text('Banco de Horas', 14, 18)

  doc.setFontSize(12)
  doc.setTextColor(40, 40, 40)
  doc.text(report.employeeName, 14, 27)

  doc.setFontSize(9)
  doc.setTextColor(120, 120, 120)
  doc.text(`Período: ${fromDate} → ${toDate}`, 14, 33)

  let totalExtraMs = 0

  const rows = report.days.map((day) => {
    const feriado = isFeriado(day.date)
    const sorted = {
      entries: [...day.entries].sort((a, b) => a - b),
      exits: [...day.exits].sort((a, b) => a - b),
    }
    const entry = sorted.entries[0] ? formatTime(sorted.entries[0]) : '—'
    const exit = sorted.exits[0] ? formatTime(sorted.exits[0]) : day.inProgress ? 'En turno' : '—'

    const scheduledMs = getScheduledMs(day.date, schedule)
    const extraMs = scheduledMs > 0 ? Math.max(0, day.totalMs - scheduledMs) : 0
    if (!day.inProgress) totalExtraMs += extraMs

    const dateLabel = feriado ? `${day.date} ★` : day.date
    return {
      cells: [
        dateLabel,
        getDayName(day.date),
        entry,
        exit,
        day.inProgress ? 'En curso' : formatMs(day.totalMs),
        extraMs > 0 ? `+${formatMs(extraMs)}` : '—',
        feriado ?? '—',
      ],
      isHoliday: !!feriado,
      isAutoCheckout: day.exits.length > 0, // simplified
    }
  })

  autoTable(doc, {
    startY: 40,
    head: [['Fecha', 'Día', 'Entrada', 'Salida', 'Horas', 'Extras', 'Feriado']],
    body: rows.map((r) => r.cells),
    headStyles: {
      fillColor: [80, 60, 180],
      textColor: 255,
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 12 },
      2: { cellWidth: 20 },
      3: { cellWidth: 20 },
      4: { cellWidth: 18 },
      5: { cellWidth: 18, textColor: [200, 80, 0] },
      6: { cellWidth: 'auto', textColor: [150, 0, 0], fontStyle: 'italic' },
    },
    didParseCell(data) {
      // Highlight holiday rows in light red
      const row = rows[data.row.index]
      if (row?.isHoliday && data.section === 'body') {
        data.cell.styles.fillColor = [255, 235, 235]
      }
    },
    foot: [[
      { content: 'TOTAL', colSpan: 4, styles: { fontStyle: 'bold' } },
      { content: formatMs(report.totalMs), styles: { fontStyle: 'bold', textColor: [40, 40, 140] } },
      { content: totalExtraMs > 0 ? `+${formatMs(totalExtraMs)}` : '—', styles: { fontStyle: 'bold', textColor: [200, 80, 0] } },
      { content: '' },
    ]],
    footStyles: { fillColor: [240, 240, 255] },
  })

  doc.save(`reporte-${report.employeeName.replace(/\s+/g, '-')}-${fromDate}-${toDate}.pdf`)
}
