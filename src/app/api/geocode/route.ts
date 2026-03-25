import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  address: z.string().optional(),
  city: z.string().min(1, 'city is required'),
  country: z.string().optional(),
})

interface NominatimResult {
  lat: string
  lon: string
  display_name: string
}

/**
 * GET /api/geocode
 * Geocode an address using Nominatim (OpenStreetMap, no API key required).
 *
 * Query params: address?, city, country?
 * Returns: { data: { lat, lng, displayName } | null, error: string | null }
 */
export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams)
  const result = schema.safeParse(params)

  if (!result.success) {
    return NextResponse.json(
      { data: null, error: result.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const { address, city, country } = result.data
  const query = [address, city, country].filter(Boolean).join(', ')

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`

    const res = await fetch(url, {
      headers: { 'User-Agent': 'ReservationGonzalo/1.0 (contact@reservationgonzalo.pt)' },
      // Cache geocoding results for 24 h — addresses don't change often
      next: { revalidate: 86_400 },
    })

    if (!res.ok) {
      return NextResponse.json(
        { data: null, error: 'Serviço de geocodificação indisponível.' },
        { status: 502 },
      )
    }

    const data = (await res.json()) as NominatimResult[]

    if (!data.length) {
      return NextResponse.json(
        { data: null, error: 'Endereço não encontrado. Tente ser mais específico.' },
        { status: 404 },
      )
    }

    return NextResponse.json({
      data: {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name,
      },
      error: null,
    })
  } catch (error) {
    console.error('[geocode/GET]', error)
    return NextResponse.json(
      { data: null, error: 'Ocorreu um erro inesperado.' },
      { status: 500 },
    )
  }
}
