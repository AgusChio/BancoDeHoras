import { useEffect } from 'react'
import { Camera, CheckCircle, RefreshCw, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFaceCapture, type CapturedDescriptor } from '../Hooks/UseFaceCapture'

interface FaceCaptureStepProps {
  stepNumber: number
  totalSteps: number
  prompt: string
  onCapture: (data: CapturedDescriptor) => void
}

export function FaceCaptureStep({
  stepNumber,
  totalSteps,
  prompt,
  onCapture,
}: FaceCaptureStepProps) {
  const { videoRef, status, errorMessage, startCamera, stopCamera, capture, resetToReady } =
    useFaceCapture()

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [startCamera, stopCamera])

  async function handleCapture() {
    const result = await capture()
    if (result) {
      onCapture(result)
    } else {
      resetToReady()
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-gray-500 text-center">
        Foto {stepNumber} de {totalSteps}: {prompt}
      </p>

      <div className="relative rounded-xl overflow-hidden bg-gray-900 w-full max-w-xs" style={{ aspectRatio: '3/4' }}>
        {/* Video */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted
          playsInline
          style={{ transform: 'scaleX(-1)' }}
        />

        {/* Oval mask overlay */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 300 400"
          preserveAspectRatio="none"
        >
          <defs>
            <mask id="face-mask">
              <rect width="300" height="400" fill="white" />
              <ellipse cx="150" cy="185" rx="100" ry="130" fill="black" />
            </mask>
          </defs>
          {/* Dark surround */}
          <rect width="300" height="400" fill="rgba(0,0,0,0.45)" mask="url(#face-mask)" />
          {/* Oval border */}
          <ellipse
            cx="150" cy="185" rx="100" ry="130"
            fill="none"
            stroke={status === 'ready' ? 'oklch(0.70 0.20 145)' : 'rgba(255,255,255,0.3)'}
            strokeWidth="2.5"
            strokeDasharray="8 5"
          />
        </svg>

        {/* Status overlay */}
        {(status === 'loading' || status === 'capturing') && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}

        {status === 'success' && (
          <div className="absolute inset-0 flex items-center justify-center bg-green-500/20">
            <CheckCircle
              className="h-12 w-12"
              style={{ color: 'oklch(0.70 0.20 145)' }}
            />
          </div>
        )}

        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-red-500/20 p-4">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <p className="text-white text-xs text-center">{errorMessage}</p>
          </div>
        )}
      </div>

      {status === 'ready' && (
        <p className="text-xs text-gray-500 text-center">
          Posicioná tu cara dentro del óvalo y presioná el botón
        </p>
      )}

      <div className="flex gap-2">
        {status === 'error' && (
          <Button variant="outline" size="sm" onClick={startCamera} className="gap-2">
            <RefreshCw size={14} />
            Reintentar
          </Button>
        )}
        <Button
          onClick={handleCapture}
          disabled={status !== 'ready'}
          className="gap-2 text-white"
          style={{ backgroundColor: 'oklch(0.70 0.20 145)' }}
        >
          <Camera size={16} />
          Capturar
        </Button>
      </div>
    </div>
  )
}
