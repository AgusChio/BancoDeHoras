interface LoadingSpinnerProps {
  className?: string
}

export function LoadingSpinner({ className = '' }: LoadingSpinnerProps) {
  return (
    <div
      className={`h-8 w-8 animate-spin rounded-full border-4 border-t-transparent ${className}`}
      style={{ borderColor: 'oklch(0.60 0.20 270)', borderTopColor: 'transparent' }}
    />
  )
}
