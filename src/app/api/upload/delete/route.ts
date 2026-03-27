import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { deleteImage } from '@/lib/cloudinary-server'

const bodySchema = z.object({
  publicId: z.string().min(1),
})

export async function DELETE(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
    }
    if (session.user.role !== 'OWNER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { publicId } = bodySchema.parse(body)

    await deleteImage(publicId)

    return NextResponse.json({ data: { success: true }, error: null })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { data: null, error: error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    console.error('[UPLOAD_DELETE]', error)
    return NextResponse.json(
      { data: null, error: 'Erro ao eliminar a imagem.' },
      { status: 500 }
    )
  }
}
