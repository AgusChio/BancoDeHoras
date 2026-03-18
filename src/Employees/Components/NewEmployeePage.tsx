import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useAutoSelectBusiness } from '@/Shared/Hooks/UseAutoSelectBusiness'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/Shared/Components/PageHeader'
import { FaceCaptureWizard } from './FaceCaptureWizard'
import type { Id } from '../../../convex/_generated/dataModel'

type Step = 'form' | 'face'

export function NewEmployeePage() {
  const navigate = useNavigate()
  const { businesses, selectedBusinessId: autoBusinessId, showSelector } = useAutoSelectBusiness()

  const [step, setStep] = useState<Step>('form')
  const [businessId, setBusinessId] = useState<Id<'businesses'> | ''>('')
  const [name, setName] = useState('')
  const [documentId, setDocumentId] = useState('')
  const [nameError, setNameError] = useState('')
  const [docError, setDocError] = useState('')
  const [bizError, setBizError] = useState('')

  const effectiveBusinessId = (businessId || autoBusinessId) as Id<'businesses'>

  function validate() {
    let valid = true
    if (!effectiveBusinessId) { setBizError('Seleccioná un negocio'); valid = false } else { setBizError('') }
    if (name.trim().length < 2) { setNameError('El nombre debe tener al menos 2 caracteres'); valid = false } else { setNameError('') }
    if (!documentId.trim()) { setDocError('El documento es obligatorio'); valid = false } else { setDocError('') }
    return valid
  }

  function handleContinue(e: React.FormEvent) {
    e.preventDefault()
    if (validate()) setStep('face')
  }

  return (
    <div>
      <PageHeader
        title={step === 'form' ? 'Agregar empleado' : 'Configurar reconocimiento facial'}
        description={
          step === 'form'
            ? 'Ingresá los datos del nuevo empleado'
            : 'Capturá 3 fotos para completar el registro'
        }
        action={
          <Button
            variant="ghost"
            onClick={() => step === 'face' ? setStep('form') : navigate({ to: '/admin/employees' })}
            className="gap-2"
          >
            <ArrowLeft size={16} />
            Volver
          </Button>
        }
      />

      <div className="max-w-md">
        <Card>
          <CardContent className="pt-6">
            {step === 'form' ? (
              <form onSubmit={handleContinue} className="flex flex-col gap-4">
                {showSelector && (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="businessId">Negocio</Label>
                    <Select value={businessId} onValueChange={(v) => setBusinessId(v as Id<'businesses'>)}>
                      <SelectTrigger id="businessId">
                        <SelectValue placeholder="Seleccioná un negocio">
                          {businessId
                            ? (businesses?.find((b) => b._id === businessId)?.name ?? 'Cargando...')
                            : 'Seleccioná un negocio'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {businesses?.map((b) => (
                          <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {bizError && <p className="text-xs text-red-500">{bizError}</p>}
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name">Nombre completo</Label>
                  <Input id="name" placeholder="Juan Pérez" value={name} onChange={(e) => setName(e.target.value)} />
                  {nameError && <p className="text-xs text-red-500">{nameError}</p>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="documentId">Documento (DNI)</Label>
                  <Input id="documentId" placeholder="12345678" value={documentId} onChange={(e) => setDocumentId(e.target.value)} />
                  {docError && <p className="text-xs text-red-500">{docError}</p>}
                </div>

                <Button type="submit" className="w-full text-white mt-2" style={{ backgroundColor: 'oklch(0.60 0.20 270)' }}>
                  Continuar →
                </Button>
              </form>
            ) : (
              <FaceCaptureWizard
                businessId={effectiveBusinessId}
                name={name.trim()}
                documentId={documentId.trim()}
                onComplete={() => navigate({ to: '/admin/employees' })}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
