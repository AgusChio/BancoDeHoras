import { convexAuth } from '@convex-dev/auth/server'
import { Password } from '@convex-dev/auth/providers/Password'

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      sendResetPasswordEmail: async (_ctx, { email, token }) => {
        // Sin email configurado: el código aparece en los logs del dashboard de Convex
        // (dashboard.convex.dev → tu proyecto → Logs)
        console.log(`🔑 CÓDIGO DE RESET para ${email}: ${token}`)
      },
    }),
  ],
})
