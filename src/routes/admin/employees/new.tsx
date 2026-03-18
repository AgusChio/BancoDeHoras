import { createFileRoute } from '@tanstack/react-router'
import { NewEmployeePage } from '@/Employees/Components/NewEmployeePage'

export const Route = createFileRoute('/admin/employees/new')({
  component: NewEmployeePage,
})
