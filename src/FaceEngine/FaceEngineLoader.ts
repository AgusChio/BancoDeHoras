import * as faceapi from 'face-api.js'

const MODEL_URL = '/models'

let loaded = false
let loading: Promise<void> | null = null

export async function loadFaceModels(): Promise<void> {
  if (loaded) return
  if (loading) return loading

  loading = Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]).then(() => {
    loaded = true
  })

  return loading
}

export { faceapi }
