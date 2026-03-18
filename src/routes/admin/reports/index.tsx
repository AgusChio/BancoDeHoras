import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { ReportsPage } from '@/Reports/Components/ReportsPage'

const reportsSearchSchema = z.object({
  desde: z.string().optional(),
  hasta: z.string().optional(),
  empleadoId: z.string().optional(),
})

export const Route = createFileRoute('/admin/reports/')({
  validateSearch: reportsSearchSchema,
  component: ReportsPage,
})
