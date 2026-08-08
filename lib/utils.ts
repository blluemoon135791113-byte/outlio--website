import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges Tailwind class names, resolving conflicts so the last value wins.
 *
 * `clsx` handles conditionals; `twMerge` resolves collisions like
 * `px-2 px-4` → `px-4`, which plain string concatenation gets wrong.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
