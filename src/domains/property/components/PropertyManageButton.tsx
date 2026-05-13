'use client'

import { useState } from 'react'
import PropertyManageModal from './PropertyManageModal'

interface Props {
  property: { id: string; title: string; slug: string }
}

export default function PropertyManageButton({ property }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full text-center text-sm font-bold text-white bg-[#1a1a2e] rounded-xl py-2.5 hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2"
      >
        <span className="material-symbols-outlined text-base">tune</span>
        Gerir
      </button>

      <PropertyManageModal
        property={property}
        isOpen={open}
        onClose={() => setOpen(false)}
      />
    </>
  )
}
