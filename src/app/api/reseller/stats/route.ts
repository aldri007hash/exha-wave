import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const resellerRequest = await prisma.resellerRequest.findFirst({ where: { email: session.user.email!, status: "APPROVED" }, include: { apiKey: true } })
  if (!resellerRequest?.apiKey) return NextResponse.json({ totalOrders: 0, totalApiCalls: 0 })
  const [totalOrders, totalApiCalls] = await Promise.all([
    prisma.order.count({ where: { userId: session.user.id, paymentMethod: "reseller_api" } }),
    prisma.order.count({ where: { userId: session.user.id } }),
  ])
  return NextResponse.json({ totalOrders, totalApiCalls })
}
