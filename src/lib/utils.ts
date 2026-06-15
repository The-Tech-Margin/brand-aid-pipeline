// Shared class-name helper: merge conditional classes and de-dupe Tailwind utilities.
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Combine class values (clsx) then resolve conflicting Tailwind classes (twMerge). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
