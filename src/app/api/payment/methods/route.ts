import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const methods = await prisma.paymentMethod.findMany({ where: { isActive: true } })
  return NextResponse.json({ methods })
}