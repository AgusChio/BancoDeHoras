import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertCircle, Clock, Loader2, ScanFace, UserX } from 'lucide-react'
import { useFaceDetection } from '../Hooks/UseFaceDetection'
import { useKioskMachine } from '../Hooks/UseKioskMachine'
import { KioskFeedback } from './KioskFeedback'
import type { DetectionResult } from '../Hooks/UseFaceDetection'
import type { Id } from '../../../convex/_generated/dataModel'

const stateColors: Record<string, string> = {
  idle: 'oklch(0.30 0 0)',
  scanning: 'oklch(0.60 0.20 270)',
  matched: 'oklch(0.70 0.20 145)',
  no_match: 'oklch(0.60 0.22 25)',
  recording: 'oklch(0.60 0.20 270)',
  feedback: 'oklch(0.70 0.20 145)',
  error: 'oklch(0.60 0.22 25)',
  already_registered: 'oklch(0.60 0.18 250)',
}

const stateMessages: Record<string, string> = {
  idle: '',
  scanning: 'Identificando...',
  matched: '¡Encontrado!',
  no_match: 'No reconocido',
  recording: 'Registrando...',
  feedback: '',
  error: 'Error al registrar',
  already_registered: '',
}

interface KioskCameraProps {
  businessId: Id<'businesses'>
}

export function KioskCamera({ businessId }: KioskCameraProps) {
  const { kioskState, matchedEmployee, handleDetection, employees } = useKioskMachine(businessId)
  const [isActive, setIsActive] = useState(false)
  const prevStateRef = useRef(kioskState)

  // Cuando termina el feedback o already_registered y vuelve a idle, desactivar
  useEffect(() => {
    if (prevStateRef.current !== 'idle' && kioskState === 'idle') {
      setIsActive(false)
    }
    prevStateRef.current = kioskState
  }, [kioskState])

  const onDetection = useCallback(
    (result: DetectionResult | null) => {
      handleDetection(result)
    },
    [handleDetection],
  )

  const { videoRef, canvasRef, status, errorMessage } = useFaceDetection({
    onDetection,
    intervalMs: 500,
    enabled: isActive && kioskState !== 'feedback' && kioskState !== 'recording' && kioskState !== 'already_registered',
  })

  const borderColor = isActive
    ? (stateColors[kioskState] ?? 'oklch(0.30 0 0)')
    : 'oklch(0.30 0 0)'
  const hasEmployees = employees && employees.length > 0
  const hasDescriptors = employees?.some((e) => e.faceDescriptors.length > 0)
  const showButton = status === 'ready' && hasDescriptors && kioskState === 'idle' && !isActive

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm sm:max-w-lg landscape:max-w-2xl">
      {/* Camera container */}
      <div
        className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border-4 transition-colors duration-300"
        style={{ borderColor, backgroundColor: 'oklch(0.08 0 0)' }}
      >
        {/* Video */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted
          playsInline
          style={{ transform: 'scaleX(-1)' }}
        />

        {/* Canvas overlay for face detection boxes */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ transform: 'scaleX(-1)' }}
        />

        {/* Loading state */}
        {status === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60">
            <Loader2
              className="h-10 w-10 animate-spin"
              style={{ color: 'oklch(0.60 0.20 270)' }}
            />
            <p className="text-sm" style={{ color: 'oklch(0.70 0 0)' }}>
              Cargando reconocimiento facial...
            </p>
          </div>
        )}

        {/* Camera error */}
        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 p-6">
            <AlertCircle size={40} style={{ color: 'oklch(0.60 0.22 25)' }} />
            <p className="text-sm text-center" style={{ color: 'oklch(0.80 0 0)' }}>
              {errorMessage || 'No se pudo acceder a la cámara'}
            </p>
          </div>
        )}

        {/* No employees / no descriptors warning */}
        {status === 'ready' && (!hasEmployees || !hasDescriptors) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50 p-6">
            <UserX size={36} style={{ color: 'oklch(0.75 0.18 60)' }} />
            <p className="text-sm text-center" style={{ color: 'oklch(0.80 0 0)' }}>
              No hay empleados con reconocimiento facial configurado.
              Agregá empleados desde el panel de admin.
            </p>
          </div>
        )}

        {/* Botón Fichar */}
        {showButton && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/40">
            <button
              onClick={() => setIsActive(true)}
              className="flex flex-col items-center gap-3 px-10 py-6 rounded-2xl font-bold text-white transition-transform active:scale-95"
              style={{ backgroundColor: 'oklch(0.60 0.20 270)', fontSize: '1.5rem' }}
            >
              <ScanFace size={48} />
              Fichar
            </button>
          </div>
        )}

        {/* Scanning indicator */}
        {isActive && kioskState === 'scanning' && (
          <div className="absolute top-3 right-3">
            <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5 bg-black/50">
              <div className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: 'oklch(0.60 0.20 270)' }} />
              <span className="text-xs text-white">Escaneando</span>
            </div>
          </div>
        )}

        {/* Feedback overlay */}
        {kioskState === 'feedback' && matchedEmployee && (
          <KioskFeedback employee={matchedEmployee} />
        )}

        {/* Already registered overlay */}
        {kioskState === 'already_registered' && matchedEmployee && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-6 rounded-2xl"
            style={{ backgroundColor: 'oklch(0.60 0.18 250 / 0.15)' }}
          >
            <div
              className="flex h-20 w-20 items-center justify-center rounded-full"
              style={{ backgroundColor: 'oklch(0.60 0.18 250)' }}
            >
              <Clock size={40} className="text-white" />
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold" style={{ color: 'oklch(0.60 0.18 250)' }}>
                Ya registrado
              </p>
              <p className="text-2xl font-medium mt-2" style={{ color: 'oklch(0.92 0 0)' }}>
                {matchedEmployee.name}
              </p>
              <p className="text-sm mt-2" style={{ color: 'oklch(0.65 0 0)' }}>
                Intentá nuevamente más tarde
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Status message — solo cuando está activo */}
      {isActive && kioskState !== 'feedback' && kioskState !== 'already_registered' && stateMessages[kioskState] && (
        <p
          className="text-lg font-medium transition-all duration-200"
          style={{ color: stateColors[kioskState] ?? 'oklch(0.65 0 0)' }}
        >
          {stateMessages[kioskState]}
        </p>
      )}
    </div>
  )
}
