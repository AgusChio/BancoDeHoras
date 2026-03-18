import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { AttendancePage } from '@/Attendance/Components/AttendancePage'

const attendanceSearchSchema = z.object({
  desde: z.string().optional(),
  hasta: z.string().optional(),
  empleadoId: z.string().optional(),
})

export const Route = createFileRoute('/admin/attendance/')({
  validateSearch: attendanceSearchSchema,
  component: AttendancePage,
})
