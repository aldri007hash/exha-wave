import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await prisma.user.findUnique({ where: { email: credentials.email } })
        if (!user || !user.password) return null
        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) return null

        // Hanya ADMIN dan SUPER_ADMIN yang boleh login lewat credentials
        if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
          return null
        }

        return { id: user.id, email: user.email, name: user.name, role: user.role, image: user.image }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 hari (sebelumnya 30 hari)
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const existingUser = await prisma.user.findUnique({ where: { email: user.email! } })
        if (!existingUser) {
          const randomPassword = Math.random().toString(36).slice(-12)
          const hashedPassword = await bcrypt.hash(randomPassword, 10)
          const newUser = await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name || "Google User",
              username: user.email!.split("@")[0] + Math.random().toString(36).substring(2, 5),
              password: hashedPassword,
              role: "USER",
              status: "ACTIVE",
              image: user.image,
            },
          })
          await prisma.wallet.create({ data: { userId: newUser.id, balance: 0 } })
          user.id = newUser.id
          user.role = "USER"
        } else {
          user.id = existingUser.id
          user.role = existingUser.role
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
}
