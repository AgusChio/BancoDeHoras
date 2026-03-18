import { useState } from 'react'
import { useMutation } from 'convex/react'
import { CheckCircle, ChevronRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FaceCaptureStep } from './FaceCaptureStep'
import { toast } from 'sonner'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import type { CapturedDescriptor } from '../Hooks/UseFaceCapture'

const STEPS = [
  { prompt: 'Mirá directo a la cámara' },
  { prompt: 'Girá levemente hacia la izquierda' },
  { prompt: 'Girá levemente hacia la derecha' },
]

interface FaceCaptureWizardProps {
  businessId: Id<'businesses'>
  name: string
  documentId: string
  onComplete: () => void
}

export function FaceCaptureWizard({ businessId, name, documentId, onComplete }: FaceCaptureWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [captures, setCaptures] = useState<CapturedDescriptor[]>([])
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const createWithDescriptors = useMutation(api.employees.createWithDescriptors)

  async function handleCapture(data: CapturedDescriptor) {
    const newCaptures = [...captures, data]
    setCaptures(newCaptures)

    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1)
    } else {
      setSaving(true)
      try {
        const descriptors = newCaptures.map((c) => Array.from(c.descriptor))
        await createWithDescriptors({ businessId, name, documentId, descriptors })
        setDone(true)
        toast.success('Empleado creado con reconocimiento facial')
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : 'Error al guardar')
      } finally {
        setSaving(false)
      }
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <CheckCircle size={48} style={{ color: 'oklch(0.70 0.20 145)' }} />
        <p className="font-medium text-gray-900">¡Empleado creado!</p>
        <p className="text-sm text-gray-500 text-center">
          Ya puede fichar usando reconocimiento facial.
        </p>
        <Button onClick={onComplete} className="gap-2 text-white" style={{ backgroundColor: 'oklch(0.60 0.20 270)' }}>
          Finalizar
          <ChevronRight size={16} />
        </Button>
      </div>
    )
  }

  if (saving) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'oklch(0.60 0.20 270)' }} />
        <p className="text-sm text-gray-500">Creando empleado...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Progress */}
      <div className="flex gap-2">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-full transition-colors"
            style={{
              backgroundColor:
                i < captures.length
                  ? 'oklch(0.70 0.20 145)'
                  : i === currentStep
                    ? 'oklch(0.60 0.20 270)'
                    : 'oklch(0.922 0 0)',
            }}
          />
        ))}
      </div>

      <FaceCaptureStep
        key={currentStep}
        stepNumber={currentStep + 1}
        totalSteps={STEPS.length}
        prompt={STEPS[currentStep].prompt}
        onCapture={handleCapture}
      />
    </div>
  )
}
