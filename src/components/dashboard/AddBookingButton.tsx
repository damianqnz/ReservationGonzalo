'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import AddBookingModal, { type PropertyOption } from './AddBookingModal'

interface Props {
  properties: PropertyOption[]
}

export default function AddBookingButton({ properties }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  function handleCreated() {
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-[#8b1a1a] text-white px-5 py-2.5 rounded-2xl font-semibold flex items-center gap-2 shadow-lg shadow-red-900/10 hover:opacity-90 transition-all active:scale-95 text-sm"
      >
        <Plus size={16} />
        Adicionar Reserva
      </button>

      <AddBookingModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onCreated={handleCreated}
        properties={properties}
      />
    </>
  )
}
