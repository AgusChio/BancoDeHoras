import { mutation, query, internalMutation } from './_generated/server'
import { v } from 'convex/values'

async function requireAuth(ctx: { auth: { getUserIdentity: () => Promise<unknown> } }) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error('No autorizado')
  return identity
}

/** Registra entrada o salida. Auto-detecta el tipo basado en el último registro. */
export const recordCheckIn = mutation({
  args: {
    employeeId: v.id('employees'),
    faceConfidence: v.float64(),
    deviceInfo: v.optional(v.string()),
  },
  handler: async (ctx, { employeeId, faceConfidence, deviceInfo }) => {
    const last = await ctx.db
      .query('attendanceRecords')
      .withIndex('by_employee_timestamp', (q) => q.eq('employeeId', employeeId))
      .order('desc')
      .first()

    const type: 'entry' | 'exit' = !last || last.type === 'exit' ? 'entry' : 'exit'

    await ctx.db.insert('attendanceRecords', {
      employeeId,
      type,
      timestamp: Date.now(),
      faceConfidence,
      deviceInfo,
    })

    return { type }
  },
})

/** Devuelve el último registro de un empleado */
export const getLastRecord = query({
  args: { employeeId: v.id('employees') },
  handler: async (ctx, { employeeId }) => {
    return await ctx.db
      .query('attendanceRecords')
      .withIndex('by_employee_timestamp', (q) => q.eq('employeeId', employeeId))
      .order('desc')
      .first()
  },
})

/** Admin: inserta manualmente un registro de entrada o salida */
export const adminManualRecord = mutation({
  args: {
    employeeId: v.id('employees'),
    type: v.union(v.literal('entry'), v.literal('exit')),
    timestamp: v.number(),
  },
  handler: async (ctx, { employeeId, type, timestamp }) => {
    await requireAuth(ctx)
    await ctx.db.insert('attendanceRecords', {
      employeeId,
      type,
      timestamp,
      faceConfidence: 1,
      deviceInfo: 'admin-manual',
    })
  },
})

/** Admin: elimina un registro por id */
export const adminDeleteRecord = mutation({
  args: { recordId: v.id('attendanceRecords') },
  handler: async (ctx, { recordId }) => {
    await requireAuth(ctx)
    await ctx.db.delete(recordId)
  },
})

/** Lista registros en un rango de timestamps UTC, filtrado por negocio y opcionalmente por empleado */
export const listByDateRange = query({
  args: {
    businessId: v.id('businesses'),
    fromTimestamp: v.number(),
    toTimestamp: v.number(),
    employeeId: v.optional(v.id('employees')),
  },
  handler: async (ctx, { businessId, fromTimestamp, toTimestamp, employeeId }) => {
    await requireAuth(ctx)

    let records
    if (employeeId) {
      records = await ctx.db
        .query('attendanceRecords')
        .withIndex('by_employee_timestamp', (q) =>
          q.eq('employeeId', employeeId).gte('timestamp', fromTimestamp)
        )
        .filter((q) => q.lte(q.field('timestamp'), toTimestamp))
        .order('desc')
        .collect()
    } else {
      // Get all employees for this business, then fetch their records
      const employees = await ctx.db
        .query('employees')
        .withIndex('by_businessId', (q) => q.eq('businessId', businessId))
        .collect()
      const employeeIds = new Set(employees.map((e) => e._id))

      const allRecords = await ctx.db
        .query('attendanceRecords')
        .withIndex('by_timestamp', (q) =>
          q.gte('timestamp', fromTimestamp).lte('timestamp', toTimestamp)
        )
        .order('desc')
        .collect()

      records = allRecords.filter((r) => employeeIds.has(r.employeeId))
    }

    const employeeIds = [...new Set(records.map((r) => r.employeeId))]
    const employees = await Promise.all(employeeIds.map((id) => ctx.db.get(id)))
    const employeeMap = Object.fromEntries(
      employees.filter(Boolean).map((e) => [e!._id, e])
    )

    return records.map((r) => ({
      ...r,
      employee: employeeMap[r.employeeId] ?? null,
    }))
  },
})

/** Cron: cierra turnos abiertos de empleados que superaron su horario de salida */
export const processAutoCheckout = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric', month: '2-digit', day: '2-digit',
    })
    const timeFormatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'America/Argentina/Buenos_Aires',
      hour: '2-digit', minute: '2-digit', hour12: false,
    })
    const todayAR = formatter.format(now)
    const nowTimeAR = timeFormatter.format(now) // "HH:MM"

    const employees = await ctx.db.query('employees')
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect()

    for (const employee of employees) {
      if (!employee.workSchedule || employee.workSchedule.length === 0) continue

      // Get day of week in Argentina timezone
      const dayOfWeek = new Date(todayAR + 'T12:00:00-03:00').getDay()
      const schedule = employee.workSchedule.find((s) => s.dayOfWeek === dayOfWeek)
      if (!schedule) continue

      // Only process if current time is past scheduled end
      if (nowTimeAR <= schedule.endTime) continue

      // Check if last record is an open entry
      const lastRecord = await ctx.db
        .query('attendanceRecords')
        .withIndex('by_employee_timestamp', (q) => q.eq('employeeId', employee._id))
        .order('desc')
        .first()

      if (!lastRecord || lastRecord.type !== 'entry') continue

      // Check the entry was today in Argentina
      const entryDateAR = formatter.format(lastRecord.timestamp)
      if (entryDateAR !== todayAR) continue

      // Insert exit at scheduled end time
      const [h, m] = schedule.endTime.split(':').map(Number)
      const [y, mo, d] = todayAR.split('-').map(Number)
      // Argentina is UTC-3
      const exitTs = Date.UTC(y, mo - 1, d, h + 3, m, 0)

      await ctx.db.insert('attendanceRecords', {
        employeeId: employee._id,
        type: 'exit',
        timestamp: exitTs,
        faceConfidence: 1,
        deviceInfo: 'auto-checkout',
      })
    }
  },
})
