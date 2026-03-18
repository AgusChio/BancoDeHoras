import type { Id } from '../../../convex/_generated/dataModel'

export interface Employee {
  _id: Id<'employees'>
  _creationTime: number
  name: string
  documentId: string
  isActive: boolean
  faceDescriptors: number[][]
  photoStorageId?: Id<'_storage'>
  createdAt: number
  updatedAt: number
}
