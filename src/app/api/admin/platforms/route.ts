import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || ((session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") && session.user.role !== "SUPER_ADMIN")) return new Response("Unauthorized", { status: 401 })
  const { name, slug } = await req.json()
  await prisma.platform.create({ data: { name, slug } })
  return new Response("OK", { status: 201 })
}