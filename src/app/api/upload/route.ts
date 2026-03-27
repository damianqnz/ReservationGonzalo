import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { uploadImage } from '@/lib/cloudinary-server'

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
    }
    if (session.user.role !== 'OWNER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get('file')
    const folder = formData.get('folder')

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ data: null, error: 'No file provided' }, { status: 400 })
    }
    if (!folder || typeof folder !== 'string' || !folder.trim()) {
      return NextResponse.json({ data: null, error: 'folder is required' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { data: null, error: 'Tipo de ficheiro não suportado. Use JPG, PNG ou WebP.' },
        { status: 400 }
      )
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { data: null, error: 'Ficheiro demasiado grande. Máximo 10 MB.' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await uploadImage(buffer, folder.trim())

    return NextResponse.json({ data: result, error: null }, { status: 201 })
  } catch (error) {
    console.error('[UPLOAD_POST]', error)
    return NextResponse.json(
      { data: null, error: 'Erro ao fazer upload da imagem.' },
      { status: 500 }
    )
  }
}
