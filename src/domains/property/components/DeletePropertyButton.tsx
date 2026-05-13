'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import DeletePropertyModal from './DeletePropertyModal'

interface Props {
  property: { id: string; title: string }
}

export default function DeletePropertyButton({ property }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  function handleDeleted() {
    router.refresh()
  }

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true) }}
        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
        title="Eliminar propriedade"
      >
        <Trash2 size={15} />
      </button>

      <DeletePropertyModal
        property={property}
        isOpen={open}
        onClose={() => setOpen(false)}
        onDeleted={handleDeleted}
      />
    </>
  )
}
