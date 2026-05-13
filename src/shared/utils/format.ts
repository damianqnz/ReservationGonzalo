import { format, differenceInDays } from 'date-fns'

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
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export function generateConfirmationCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase()
}
