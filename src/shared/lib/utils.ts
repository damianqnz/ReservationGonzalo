import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, differenceInDays } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatDate(date: Date | string, pattern = 'dd/MM/yyyy'): string {
  return format(new Date(date), pattern)
}

export function calculateNights(checkIn: Date | string, checkOut: Date | string): number {
  return differenceInDays(new Date(checkOut), new Date(checkIn))
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export function generateConfirmationCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase()
}
