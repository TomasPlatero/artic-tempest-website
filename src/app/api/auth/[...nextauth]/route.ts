// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth"
import { authOptions } from "@/infrastructure/auth/auth-options" // según tu estructura

export const runtime = "nodejs"

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
