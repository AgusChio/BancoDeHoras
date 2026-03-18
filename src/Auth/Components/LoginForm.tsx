import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { SignIn, useAuth } from '@clerk/clerk-react'

export function LoginForm() {
  const { isSignedIn, isLoaded } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate({ to: '/admin/employees' })
    }
  }, [isSignedIn, isLoaded, navigate])

  return (
    <div
      className="flex h-screen items-center justify-center"
      style={{ backgroundColor: 'oklch(0.97 0 0)' }}
    >
      <SignIn
        routing="hash"
        appearance={{
          variables: {
            colorPrimary: 'oklch(0.60 0.20 270)',
            borderRadius: '0.75rem',
          },
        }}
      />
    </div>
  )
}
