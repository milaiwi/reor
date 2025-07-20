import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export * from './block-utils'
export { default as getNodeById } from './node-utils'
export * from './entity-id-url'
export { default as useSemanticCache } from './editor-state'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
