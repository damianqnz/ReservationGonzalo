import type { NextConfig } from 'next'

const CSP = [
  "default-src 'self'",
  "script-src 'self' https://js.stripe.com https://embed.tawk.to",
  "frame-src https://js.stripe.com",
  "img-src 'self' data: blob: https://res.cloudinary.com https://lh3.googleusercontent.com https://images.unsplash.com https://picsum.photos https://imagedelivery.net",
  "connect-src 'self' https://api.stripe.com",
  "font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "worker-src 'self' blob:",
].join('; ')

const SECURITY_HEADERS = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Content-Security-Policy', value: CSP },
]

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: SECURITY_HEADERS,
      },
      {
        // HSTS solo aplica en HTTPS — solo en producción
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ]
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/**' },
      { protocol: 'https', hostname: 'imagedelivery.net', pathname: '/**' },
      { protocol: 'https', hostname: 'picsum.photos', pathname: '/**' },
    ],
  },
}

export default nextConfig