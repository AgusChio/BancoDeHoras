import { defineSchema, defineTable } from 'convex/server'
import { authTables } from '@convex-dev/auth/server'
import { v } from 'convex/values'

export default defineSchema({
  ...authTables,

  businesses: defineTable({
    name: v.string(),
    slug: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_slug', ['slug']),

  employees: defineTable({
    businessId: v.id('businesses'),
    name: v.string(),
    documentId: v.string(),
    isActive: v.boolean(),
    faceDescriptors: v.array(v.array(v.float64())),
    photoStorageId: v.optional(v.id('_storage')),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_documentId', ['documentId'])
    .index('by_isActive', ['isActive'])
    .index('by_businessId', ['businessId'])
    .index('by_businessId_isActive', ['businessId', 'isActive'])
    .index('by_businessId_documentId', ['businessId', 'documentId']),

  attendanceRecords: defineTable({
    employeeId: v.id('employees'),
    type: v.union(v.literal('entry'), v.literal('exit')),
    timestamp: v.number(),
    faceConfidence: v.float64(),
    deviceInfo: v.optional(v.string()),
  })
    .index('by_employee', ['employeeId'])
    .index('by_employee_timestamp', ['employeeId', 'timestamp'])
    .index('by_timestamp', ['timestamp']),
})
