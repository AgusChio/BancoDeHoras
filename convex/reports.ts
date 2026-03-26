import { query } from './_generated/server'
import { v } from 'convex/values'

async function requireAuth(ctx: { auth: { getUserIdentity: () => Promise<unknown> } }) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error('No autorizado')
  return identity
}

export interface DayRecord {
  date: string
  entries: number[]
  exits: number[]
  totalMs: number
  inProgress: boolean
}

export interface EmployeeReport {
  employeeId: string
  employeeName: string
  totalMs: number
  workDays: number
  days: DayRecord[]
  workSchedule: { dayOfWeek: number; startTime: string; endTime: string }[]
}

/** Calcula horas trabajadas por empleado en un rango UTC, filtrado por negocio */
export const hoursByEmployee = query({
  args: {
    businessId: v.id('businesses'),
    fromTimestamp: v.number(),
    toTimestamp: v.number(),
    employeeId: v.optional(v.id('employees')),
  },
  handler: async (ctx, { businessId, fromTimestamp, toTimestamp, employeeId }) => {
    await requireAuth(ctx)

    const employees = employeeId
      ? [await ctx.db.get(employeeId)].filter(Boolean)
      : await ctx.db
          .query('employees')
          .withIndex('by_businessId_isActive', (q) =>
            q.eq('businessId', businessId).eq('isActive', true)
          )
          .collect()

    const results: EmployeeReport[] = []

    for (const employee of employees) {
      if (!employee) continue

      const records = await ctx.db
        .query('attendanceRecords')
        .withIndex('by_employee_timestamp', (q) =>
          q.eq('employeeId', employee._id).gte('timestamp', fromTimestamp)
        )
        .filter((q) => q.lte(q.field('timestamp'), toTimestamp))
        .order('asc')
        .collect()

      const dayMap = new Map<string, { entries: number[]; exits: number[] }>()

      for (const record of records) {
        const dateKey = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'America/Argentina/Buenos_Aires',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(new Date(record.timestamp))

        if (!dayMap.has(dateKey)) {
          dayMap.set(dateKey, { entries: [], exits: [] })
        }
        const day = dayMap.get(dateKey)!
        if (record.type === 'entry') {
          day.entries.push(record.timestamp)
        } else {
          day.exits.push(record.timestamp)
        }
      }

      const days: DayRecord[] = []
      let totalMs = 0

      for (const [date, { entries, exits }] of dayMap.entries()) {
        let dayMs = 0
        const pairs = Math.min(entries.length, exits.length)
        for (let i = 0; i < pairs; i++) {
          dayMs += exits[i] - entries[i]
        }
        const inProgress = entries.length > exits.length
        totalMs += dayMs
        days.push({ date, entries, exits, totalMs: dayMs, inProgress })
      }

      days.sort((a, b) => a.date.localeCompare(b.date))

      results.push({
        employeeId: employee._id,
        employeeName: employee.name,
        totalMs,
        workDays: days.filter((d) => d.totalMs > 0).length,
        days,
        workSchedule: employee.workSchedule ?? [],
      })
    }

    return results
  },
})
