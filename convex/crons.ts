import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

const crons = cronJobs()

crons.interval(
  'auto-checkout-open-shifts',
  { minutes: 30 },
  internal.attendance.processAutoCheckout,
)

export default crons
