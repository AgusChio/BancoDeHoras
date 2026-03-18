import { createFileRoute } from '@tanstack/react-router'
import { NewBusinessForm } from '@/Businesses/Components/NewBusinessForm'

export const Route = createFileRoute('/admin/businesses/new')({
  component: NewBusinessForm,
})
