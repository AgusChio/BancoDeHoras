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
  return ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'][dow]
}

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export function generateEmployeePdf(
  report: EmployeeReport,
  fromDate: string,
  toDate: string,
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  doc.setFont('helvetica')
  const schedule = report.workSchedule ?? []

  // Header
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(60, 60, 140)
  doc.text('Resumen de carga horaria', 14, 18)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(30, 30, 30)
  doc.text(report.employeeName, 14, 26)

  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text(`Periodo: ${fmtDate(fromDate)} al ${fmtDate(toDate)}`, 14, 32)

  let totalExtraMs = 0

  const rows = report.days.map((day) => {
    const feriado = isFeriado(day.date)
    const sorted = {
      entries: [...day.entries].sort((a, b) => a - b),
      exits: [...day.exits].sort((a, b) => a - b),
    }
    const entry = sorted.entries[0] ? formatTime(sorted.entries[0]) : '-'
    const exit = sorted.exits[0] ? formatTime(sorted.exits[0]) : day.inProgress ? 'En turno' : '-'

    const scheduledMs = getScheduledMs(day.date, schedule)
    const extraMs = scheduledMs > 0 ? Math.max(0, day.totalMs - scheduledMs) : 0
    if (!day.inProgress) totalExtraMs += extraMs

    return {
      cells: [
        fmtDate(day.date),
        getDayName(day.date),
        entry,
        exit,
        day.inProgress ? 'En curso' : formatMs(day.totalMs),
        extraMs > 0 ? `+${formatMs(extraMs)}` : '-',
        feriado ?? '-',
      ],
      isHoliday: !!feriado,
    }
  })

  autoTable(doc, {
    startY: 38,
    head: [['Fecha', 'Dia', 'Entrada', 'Salida', 'Horas', 'Extras', 'Feriado']],
    body: rows.map((r) => r.cells),
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [70, 55, 170],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      textColor: [30, 30, 30],
    },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 14 },
      2: { cellWidth: 20 },
      3: { cellWidth: 20 },
      4: { cellWidth: 20 },
      5: { cellWidth: 18, textColor: [180, 70, 0] },
      6: { cellWidth: 'auto', textColor: [160, 0, 0], fontStyle: 'italic' },
    },
    didParseCell(data) {
      if (rows[data.row.index]?.isHoliday && data.section === 'body') {
        data.cell.styles.fillColor = [255, 232, 232]
      }
    },
    foot: [[
      { content: 'TOTAL', colSpan: 4, styles: { fontStyle: 'bold', textColor: [30, 30, 30] } },
      { content: formatMs(report.totalMs), styles: { fontStyle: 'bold', textColor: [50, 50, 160] } },
      { content: totalExtraMs > 0 ? `+${formatMs(totalExtraMs)}` : '-', styles: { fontStyle: 'bold', textColor: [180, 70, 0] } },
      { content: '' },
    ]],
    footStyles: {
      fillColor: [230, 230, 250],
      textColor: [30, 30, 30],
      fontStyle: 'bold',
      fontSize: 9,
    },
  })

  doc.save(`reporte-${report.employeeName.replace(/\s+/g, '-')}-${fmtDate(fromDate)}-${fmtDate(toDate)}.pdf`)
}
