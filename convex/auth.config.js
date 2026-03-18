export default {
  providers: [
    {
      // Reemplazá con tu Clerk Issuer URL:
      // Dashboard de Clerk → tu app → Configure → Domains → Frontend API URL
      // Formato: https://<tu-instancia>.clerk.accounts.dev
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: 'convex',
    },
  ],
}
