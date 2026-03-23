import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import Link from 'next/link'
import AccessForm from './AccessForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PropertyAccessPage({ params }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { id } = await params

  const property = await db.property.findUnique({
    where: { id },
    select: {
      id:                 true,
      ownerId:            true,
      title:              true,
      accessCode:         true,
      wifiName:           true,
      wifiPassword:       true,
      floor:              true,
      accessInstructions: true,
      contactPhone:       true,
    },
  })

  if (!property) notFound()

  if (session.user.role === 'OWNER' && property.ownerId !== session.user.id) {
    redirect('/dashboard/properties')
  }

  const { ownerId: _, ...accessData } = property

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/dashboard/properties" className="hover:text-[#8b1a1a] transition-colors">
          Propriedades
        </Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-[#1a1a2e] font-medium">{accessData.title}</span>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-[#1a1a2e] font-medium">Dados de Acesso</span>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-[#1a1a2e] tracking-tight flex items-center gap-3">
          <span className="material-symbols-outlined text-[#8b1a1a] text-3xl">key</span>
          Dados de Acesso
        </h1>
        <p className="text-slate-500 mt-1">
          {accessData.title} — estes dados são partilhados com os hóspedes no check-in.
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <AccessForm property={accessData} />
      </div>
    </div>
  )
}
