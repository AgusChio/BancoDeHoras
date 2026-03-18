import { useState, useCallback, useRef } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { buildMatcher, matchFace } from '@/FaceEngine/FaceMatcher'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import type { DetectionResult } from './UseFaceDetection'

export type KioskState = 'idle' | 'scanning' | 'matched' | 'no_match' | 'recording' | 'feedback' | 'error' | 'already_registered'

export interface MatchedEmployee {
  id: string
  name: string
  checkType: 'entry' | 'exit'
  distance: number
}

const COOLDOWN_MS = 30000

export function useKioskMachine(businessId: Id<'businesses'>) {
  const employees = useQuery(api.employees.listActive, { businessId })
  const recordCheckIn = useMutation(api.attendance.recordCheckIn)

  const [kioskState, setKioskState] = useState<KioskState>('idle')
  const [matchedEmployee, setMatchedEmployee] = useState<MatchedEmployee | null>(null)
  const lastMatchRef = useRef<{ id: string; time: number } | null>(null)
  const processingRef = useRef(false)

  const handleDetection = useCallback(
    async (result: DetectionResult | null) => {
      if (processingRef.current) return
      if (kioskState === 'feedback' || kioskState === 'recording') return

      if (!result) {
        setKioskState('idle')
        return
      }

      setKioskState('scanning')

      if (!employees || employees.length === 0) return

      const matcher = buildMatcher(employees)
      if (!matcher) return

      const match = matchFace(matcher, result.descriptor)

      if (!match) {
        setKioskState('no_match')
        setTimeout(() => setKioskState('idle'), 2000)
        return
      }

      // Cooldown: evitar registros duplicados
      const now = Date.now()
      if (
        lastMatchRef.current?.id === match.employeeId &&
        now - lastMatchRef.current.time < COOLDOWN_MS
      ) {
        if (kioskState === 'idle') {
          const emp = employees.find((e) => e._id === match.employeeId)
          if (emp) {
            setMatchedEmployee({ id: match.employeeId, name: emp.name, checkType: 'entry', distance: match.distance })
            setKioskState('already_registered')
            setTimeout(() => {
              setKioskState('idle')
              setMatchedEmployee(null)
            }, 3000)
          }
        }
        return
      }

      const employee = employees.find((e) => e._id === match.employeeId)
      if (!employee) return

      processingRef.current = true
      setKioskState('recording')

      try {
        const { type } = await recordCheckIn({
          employeeId: employee._id,
          faceConfidence: match.distance,
          deviceInfo: navigator.userAgent.slice(0, 100),
        })

        lastMatchRef.current = { id: match.employeeId, time: now }

        setMatchedEmployee({
          id: match.employeeId,
          name: employee.name,
          checkType: type,
          distance: match.distance,
        })
        setKioskState('feedback')

        setTimeout(() => {
          setKioskState('idle')
          setMatchedEmployee(null)
          processingRef.current = false
        }, 4000)
      } catch {
        setKioskState('error')
        setTimeout(() => {
          setKioskState('idle')
          processingRef.current = false
        }, 2000)
      }
    },
    [employees, kioskState, recordCheckIn],
  )

  return { kioskState, matchedEmployee, handleDetection, employees }
}
