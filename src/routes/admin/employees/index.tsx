import { createFileRoute } from '@tanstack/react-router'
import { EmployeeList } from '@/Employees/Components/EmployeeList'

export const Route = createFileRoute('/admin/employees/')({
  component: EmployeeList,
})
