import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

async function requireAuth(ctx: { auth: { getUserIdentity: () => Promise<unknown> } }) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error('No autorizado')
  return identity
}

export const listActive = query({
  args: { businessId: v.id('businesses') },
  handler: async (ctx, { businessId }) => {
    return await ctx.db
      .query('employees')
      .withIndex('by_businessId_isActive', (q) =>
        q.eq('businessId', businessId).eq('isActive', true)
      )
      .collect()
  },
})

export const listAll = query({
  args: { businessId: v.id('businesses') },
  handler: async (ctx, { businessId }) => {
    await requireAuth(ctx)
    return await ctx.db
      .query('employees')
      .withIndex('by_businessId', (q) => q.eq('businessId', businessId))
      .order('desc')
      .collect()
  },
})

export const getById = query({
  args: { id: v.id('employees') },
  handler: async (ctx, { id }) => {
    await requireAuth(ctx)
    return await ctx.db.get(id)
  },
})

export const create = mutation({
  args: {
    businessId: v.id('businesses'),
    name: v.string(),
    documentId: v.string(),
  },
  handler: async (ctx, { businessId, name, documentId }) => {
    await requireAuth(ctx)
    const existing = await ctx.db
      .query('employees')
      .withIndex('by_businessId_documentId', (q) => q.eq('businessId', businessId).eq('documentId', documentId))
      .first()
    if (existing) throw new Error('Ya existe un empleado con ese documento en este negocio')

    const now = Date.now()
    return await ctx.db.insert('employees', {
      businessId,
      name,
      documentId,
      isActive: true,
      faceDescriptors: [],
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const createWithDescriptors = mutation({
  args: {
    businessId: v.id('businesses'),
    name: v.string(),
    documentId: v.string(),
    descriptors: v.array(v.array(v.float64())),
  },
  handler: async (ctx, { businessId, name, documentId, descriptors }) => {
    await requireAuth(ctx)
    const existing = await ctx.db
      .query('employees')
      .withIndex('by_businessId_documentId', (q) => q.eq('businessId', businessId).eq('documentId', documentId))
      .first()
    if (existing) throw new Error('Ya existe un empleado con ese documento en este negocio')
    const now = Date.now()
    return await ctx.db.insert('employees', {
      businessId,
      name,
      documentId,
      isActive: true,
      faceDescriptors: descriptors,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const setFaceDescriptors = mutation({
  args: {
    id: v.id('employees'),
    descriptors: v.array(v.array(v.float64())),
  },
  handler: async (ctx, { id, descriptors }) => {
    await requireAuth(ctx)
    await ctx.db.patch(id, {
      faceDescriptors: descriptors,
      updatedAt: Date.now(),
    })
  },
})

export const deactivate = mutation({
  args: { id: v.id('employees') },
  handler: async (ctx, { id }) => {
    await requireAuth(ctx)
    await ctx.db.patch(id, { isActive: false, updatedAt: Date.now() })
  },
})

export const activate = mutation({
  args: { id: v.id('employees') },
  handler: async (ctx, { id }) => {
    await requireAuth(ctx)
    await ctx.db.patch(id, { isActive: true, updatedAt: Date.now() })
  },
})

export const update = mutation({
  args: {
    id: v.id('employees'),
    name: v.string(),
    documentId: v.string(),
  },
  handler: async (ctx, { id, name, documentId }) => {
    await requireAuth(ctx)
    const employee = await ctx.db.get(id)
    if (!employee) throw new Error('Empleado no encontrado')
    const existing = await ctx.db
      .query('employees')
      .withIndex('by_businessId_documentId', (q) => q.eq('businessId', employee.businessId).eq('documentId', documentId))
      .first()
    if (existing && existing._id !== id) throw new Error('Ya existe un empleado con ese documento en este negocio')
    await ctx.db.patch(id, { name, documentId, updatedAt: Date.now() })
  },
})

export const deleteEmployee = mutation({
  args: { id: v.id('employees') },
  handler: async (ctx, { id }) => {
    await requireAuth(ctx)
    await ctx.db.delete(id)
  },
})

export const generatePhotoUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx)
    return await ctx.storage.generateUploadUrl()
  },
})

export const setPhotoStorageId = mutation({
  args: {
    id: v.id('employees'),
    storageId: v.id('_storage'),
  },
  handler: async (ctx, { id, storageId }) => {
    await requireAuth(ctx)
    await ctx.db.patch(id, { photoStorageId: storageId, updatedAt: Date.now() })
  },
})

export const getPhotoUrl = query({
  args: { storageId: v.id('_storage') },
  handler: async (ctx, { storageId }) => {
    return await ctx.storage.getUrl(storageId)
  },
})

export const updateSchedule = mutation({
  args: {
    id: v.id('employees'),
    workSchedule: v.array(v.object({
      dayOfWeek: v.number(),
      startTime: v.string(),
      endTime: v.string(),
    })),
  },
  handler: async (ctx, { id, workSchedule }) => {
    await requireAuth(ctx)
    await ctx.db.patch(id, { workSchedule, updatedAt: Date.now() })
  },
})
