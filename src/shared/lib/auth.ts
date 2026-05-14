import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { db } from '@/shared/lib/db'
import { Role } from '@prisma/client'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())

const OWNER_EMAILS = (process.env.OWNER_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())

/**
 * Returns the appropriate Role for a given email based on env-configured lists.
 * Emails not in ADMIN_EMAILS or OWNER_EMAILS default to GUEST.
 */
function getRoleForEmail(email: string): Role {
  const lower = email.toLowerCase()
  if (ADMIN_EMAILS.includes(lower)) return Role.ADMIN
  if (OWNER_EMAILS.includes(lower)) return Role.OWNER
  return Role.GUEST
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user || !user.hashedPassword) return null

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.hashedPassword
        )

        if (!isValid) return null

        return user
      },
    }),
  ],
  events: {
    /**
     * Fires once when a user is first created by the PrismaAdapter.
     * Sets the role based on ADMIN_EMAILS / OWNER_EMAILS env vars.
     * Using events.createUser guarantees the record exists in DB.
     */
    async createUser({ user }) {
      if (user.email) {
        const correctRole = getRoleForEmail(user.email)
        await db.user.update({
          where: { id: user.id },
          data: { role: correctRole },
        })
      }
    },
  },
  callbacks: {
    /**
     * Allow all sign-ins — role-based routing is handled by middleware.
     */
    async signIn() {
      return true
    },

    /**
     * Persists id, role, and email into the JWT on first sign-in.
     * For Credentials: user comes from authorize() with DB role.
     * For Google OAuth: user comes from PrismaAdapter with DB role.
     */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role
        token.email = user.email
      }
      return token
    },

    /**
     * Exposes id, role, and email on the client-side session object.
     */
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.email = token.email as string
      }
      return session
    },
  },
})

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      email: string
      name?: string | null
      image?: string | null
    }
  }
}