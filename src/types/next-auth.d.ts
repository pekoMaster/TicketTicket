import { DefaultSession, DefaultUser } from "next-auth"
import { DefaultJWT } from "next-auth/jwt"
import { UserRole } from "./index"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      dbId?: string
      role?: UserRole
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    dbId?: string
    role?: UserRole
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string
    dbUserId?: string
    provider?: string
    providerAccountId?: string
    role?: UserRole
  }
}
