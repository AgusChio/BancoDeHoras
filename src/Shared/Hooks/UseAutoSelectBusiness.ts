import { useState, useEffect } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'

export function useAutoSelectBusiness() {
  const businesses = useQuery(api.businesses.list)
  const [selectedBusinessId, setSelectedBusinessId] = useState<Id<'businesses'> | ''>('')

  // Auto-select when there's only one business
  useEffect(() => {
    if (businesses?.length === 1 && !selectedBusinessId) {
      setSelectedBusinessId(businesses[0]._id)
    }
  }, [businesses, selectedBusinessId])

  const showSelector = businesses !== undefined && businesses.length > 1

  return { businesses, selectedBusinessId, setSelectedBusinessId, showSelector }
}
