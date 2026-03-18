import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

async function requireAuth(ctx: { auth: { getUserIdentity: () => Promise<unknown> } }) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error('No autorizado')
  return identity
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx)
    return await ctx.db.query('businesses').order('desc').collect()
  },
})

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return await ctx.db
      .query('businesses')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .first()
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
  },
  handler: async (ctx, { name, slug }) => {
    await requireAuth(ctx)
    const existing = await ctx.db
      .query('businesses')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .first()
    if (existing) throw new Error('Ya existe un negocio con ese slug')
    const now = Date.now()
    return await ctx.db.insert('businesses', {
      name,
      slug,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const update = mutation({
  args: {
    id: v.id('businesses'),
    name: v.string(),
    slug: v.string(),
  },
  handler: async (ctx, { id, name, slug }) => {
    await requireAuth(ctx)
    const existing = await ctx.db
      .query('businesses')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .first()
    if (existing && existing._id !== id) throw new Error('Ya existe un negocio con ese slug')
    await ctx.db.patch(id, { name, slug, updatedAt: Date.now() })
  },
})

export const deleteById = mutation({
  args: { id: v.id('businesses') },
  handler: async (ctx, { id }) => {
    await requireAuth(ctx)
    await ctx.db.delete(id)
  },
})
