import { createFileRoute } from '@tanstack/react-router'
import { BusinessList } from '@/Businesses/Components/BusinessList'

export const Route = createFileRoute('/admin/businesses/')({
  component: BusinessList,
})
