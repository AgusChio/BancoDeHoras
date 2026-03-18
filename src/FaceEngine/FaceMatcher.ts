import { faceapi } from './FaceEngineLoader'

export interface EmployeeWithDescriptors {
  _id: string
  name: string
  faceDescriptors: number[][]
}

export function buildMatcher(employees: EmployeeWithDescriptors[]): faceapi.FaceMatcher | null {
  const withDescriptors = employees.filter((e) => e.faceDescriptors.length > 0)
  if (withDescriptors.length === 0) return null

  const labeled = withDescriptors.map(
    (e) =>
      new faceapi.LabeledFaceDescriptors(
        e._id,
        e.faceDescriptors.map((d) => new Float32Array(d)),
      ),
  )

  return new faceapi.FaceMatcher(labeled, 0.55)
}

export function matchFace(
  matcher: faceapi.FaceMatcher,
  descriptor: Float32Array,
): { employeeId: string; distance: number } | null {
  const result = matcher.findBestMatch(descriptor)
  if (result.label === 'unknown') return null
  return { employeeId: result.label, distance: result.distance }
}
