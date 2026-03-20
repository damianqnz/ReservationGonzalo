import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
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
     * For Google OAuth sign-ins: blocks GUEST users from accessing
     * the dashboard. New users are handled by the createUser event.
     * Existing users with OWNER or ADMIN role proceed normally.
     */
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        const existingUser = await db.user.findUnique({
          where: { email: user.email },
          select: { role: true },
        })
        // New users (not yet in DB) are handled by createUser event — allow
        if (existingUser &&
            existingUser.role !== 'OWNER' &&
            existingUser.role !== 'ADMIN') {
          return false
        }
      }
      return true
    },

    /**
     * Reads id and role from DB on every sign-in so the JWT always reflects
     * the current DB state. Works for both Google and Credentials providers.
     */
    async jwt({ token, user }) {
      if (user?.email) {
        const dbUser = await db.user.findUnique({
          where: { email: user.email },
          select: { id: true, role: true },
        })
        if (dbUser) {
          token.id = dbUser.id
          token.role = dbUser.role
        }
      }
      return token
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
})