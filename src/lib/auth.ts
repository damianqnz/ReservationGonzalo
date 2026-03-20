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
  callbacks: {
    /**
     * For Google OAuth sign-ins: assigns the correct role based on ADMIN_EMAILS
     * and OWNER_EMAILS env vars. Runs after the adapter creates the user in DB.
     * Any email not in those lists gets (or keeps) the GUEST role.
     */
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        const correctRole = getRoleForEmail(user.email)
        await db.user.update({
          where: { email: user.email },
          data: { role: correctRole },
        })
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