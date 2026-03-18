import { createFileRoute, Outlet } from '@tanstack/react-router'
import { AdminLayout } from '@/Shared/Components/AdminLayout'

export const Route = createFileRoute('/admin')({
  component: AdminLayoutWrapper,
})

function AdminLayoutWrapper() {
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  )
}
