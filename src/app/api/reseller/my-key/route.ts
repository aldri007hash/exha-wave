import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Cari API key yang terkait dengan user ini (via ResellerRequest yang disetujui)
  const resellerRequest = await prisma.resellerRequest.findFirst({
    where: {
      email: session.user.email!,
      status: "APPROVED",
    },
    include: { apiKey: true },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({
    apiKey: resellerRequest?.apiKey || null,
  })
}
