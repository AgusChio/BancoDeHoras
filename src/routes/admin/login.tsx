import { createFileRoute } from '@tanstack/react-router'
import { LoginForm } from '@/Auth/Components/LoginForm'

export const Route = createFileRoute('/admin/login')({
  component: LoginForm,
})
