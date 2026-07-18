import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember Me", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.password) return null

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
        if (!isPasswordValid) return null

        if (user.status === "BANNED") {
          throw new Error(`Akun Anda telah diblokir. Alasan: ${user.banReason || "Tidak ada alasan"}`)
        }

        if (user.status === "SUSPENDED" && user.suspendUntil) {
          if (new Date() < new Date(user.suspendUntil)) {
            throw new Error(`Akun Anda ditangguhkan hingga ${user.suspendUntil.toLocaleDateString("id-ID")}. Alasan: ${user.banReason || "Tidak ada alasan"}`)
          } else {
            await prisma.user.update({
              where: { id: user.id },
              data: { status: "ACTIVE", suspendUntil: null, banReason: null },
            })
          }
        }

        if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
          try {
            await prisma.activityLog.create({
              data: {
                userId: user.id,
                action: "LOGIN",
                ip: "unknown",
                userAgent: "unknown",
              },
            })
            await prisma.user.update({
              where: { id: user.id },
              data: { lastLoginAt: new Date() },
            })
          } catch (err) {
            console.error("Gagal mencatat activity log:", err)
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
          rememberMe: credentials.rememberMe === "true",
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true, // ⚠️ development HTTP, production harus true
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.rememberMe = (user as any).rememberMe || false
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        ;(session as any).rememberMe = token.rememberMe
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
}