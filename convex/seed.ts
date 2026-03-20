import { query } from './_generated/server'

// Devuelve true si ya existe al menos un usuario administrador registrado.
// Se usa en el frontend para decidir si mostrar "Crear cuenta" o "Iniciar sesión".
export const hasAdmin = query({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.db.query('users').first()
    return user !== null
  },
})
