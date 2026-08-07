import "next-auth"

declare module "next-auth" {
  interface User {
    id: string
    role: string
    phone?: string | null
    rememberMe?: boolean
  }

  interface Session {
    user: User & {
      id: string
      role: string
      phone?: string | null
    }
    rememberMe?: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    phone?: string | null
    rememberMe?: boolean
  }
}
