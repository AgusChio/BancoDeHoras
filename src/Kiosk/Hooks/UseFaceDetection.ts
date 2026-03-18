import { useState, useRef, useCallback, useEffect } from 'react'
import { faceapi, loadFaceModels } from '@/FaceEngine/FaceEngineLoader'

export type DetectionStatus = 'loading' | 'ready' | 'detecting' | 'error'

export interface DetectionResult {
  descriptor: Float32Array
  box: { x: number; y: number; width: number; height: number }
}

interface UseFaceDetectionOptions {
  onDetection: (result: DetectionResult | null) => void
  intervalMs?: number
  enabled?: boolean
}

export function useFaceDetection({ onDetection, intervalMs = 500, enabled = true }: UseFaceDetectionOptions) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const runningRef = useRef(false)
  const [status, setStatus] = useState<DetectionStatus>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  const startDetection = useCallback(async () => {
    try {
      await loadFaceModels()
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setStatus('ready')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error de cámara')
      setStatus('error')
    }
  }, [])

  const stopDetection = useCallback(() => {
    runningRef.current = false
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  // Detection loop
  useEffect(() => {
    if (status !== 'ready' || !enabled) return

    runningRef.current = true
    const options = new faceapi.TinyFaceDetectorOptions({
      inputSize: 416,
      scoreThreshold: 0.5,
    })

    let timeout: ReturnType<typeof setTimeout>

    async function detect() {
      if (!runningRef.current || !videoRef.current) return
      if (videoRef.current.readyState < 2) {
        timeout = setTimeout(detect, 200)
        return
      }

      try {
        const result = await faceapi
          .detectSingleFace(videoRef.current, options)
          .withFaceLandmarks()
          .withFaceDescriptor()

        if (result && canvasRef.current) {
          const displaySize = {
            width: videoRef.current.offsetWidth,
            height: videoRef.current.offsetHeight,
          }
          faceapi.matchDimensions(canvasRef.current, displaySize)
          const resized = faceapi.resizeResults(result, displaySize)
          const ctx = canvasRef.current.getContext('2d')
          if (ctx) {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
            faceapi.draw.drawDetections(canvasRef.current, [resized])
          }
          onDetection({
            descriptor: result.descriptor,
            box: result.detection.box,
          })
        } else {
          if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d')
            ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
          }
          onDetection(null)
        }
      } catch {
        onDetection(null)
      }

      if (runningRef.current) {
        timeout = setTimeout(detect, intervalMs)
      }
    }

    detect()
    return () => {
      runningRef.current = false
      clearTimeout(timeout)
    }
  }, [status, enabled, intervalMs, onDetection])

  useEffect(() => {
    startDetection()
    return () => stopDetection()
  }, [startDetection, stopDetection])

  return { videoRef, canvasRef, status, errorMessage }
}
