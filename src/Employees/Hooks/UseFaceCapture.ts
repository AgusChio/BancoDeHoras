import { useState, useRef, useCallback } from 'react'
import { faceapi, loadFaceModels } from '@/FaceEngine/FaceEngineLoader'

export type CaptureStatus = 'idle' | 'loading' | 'ready' | 'capturing' | 'success' | 'error'

export interface CapturedDescriptor {
  descriptor: Float32Array
  imageData: string // base64 PNG para preview
}

export function useFaceCapture() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [status, setStatus] = useState<CaptureStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const startCamera = useCallback(async () => {
    setStatus('loading')
    setErrorMessage('')
    try {
      await loadFaceModels()
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setStatus('ready')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al iniciar cámara')
      setStatus('error')
    }
  }, [])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setStatus('idle')
  }, [])

  const capture = useCallback(async (): Promise<CapturedDescriptor | null> => {
    if (!videoRef.current || status !== 'ready') return null
    setStatus('capturing')

    try {
      const options = new faceapi.TinyFaceDetectorOptions({
        inputSize: 320,
        scoreThreshold: 0.5,
      })
      const result = await faceapi
        .detectSingleFace(videoRef.current, options)
        .withFaceLandmarks()
        .withFaceDescriptor()

      if (!result) {
        setStatus('ready')
        return null
      }

      // Capturar frame como imagen
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(videoRef.current, 0, 0)
      const imageData = canvas.toDataURL('image/jpeg', 0.8)

      setStatus('success')
      return { descriptor: result.descriptor, imageData }
    } catch {
      setStatus('ready')
      return null
    }
  }, [status])

  const resetToReady = useCallback(() => {
    setStatus(streamRef.current ? 'ready' : 'idle')
  }, [])

  return { videoRef, status, errorMessage, startCamera, stopCamera, capture, resetToReady }
}
