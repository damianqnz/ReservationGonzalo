'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface PendingPollingProps {
  bookingId: string
}

export default function PendingPolling({ bookingId: _bookingId }: PendingPollingProps) {
  const router = useRouter()

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh()
    }, 3000)

    return () => clearInterval(interval)
  }, [router])

  return (
    <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-xl">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
        <svg
          className="h-8 w-8 animate-spin text-blue-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </div>
      <h1 className="mb-3 text-xl font-bold font-display">A processar pagamento...</h1>
      <p className="text-gray-500">
        A aguardar confirmação do pagamento. Esta página actualiza-se automaticamente.
      </p>
    </div>
  )
}
