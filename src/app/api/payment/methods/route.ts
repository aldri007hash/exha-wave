import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const methods = await prisma.paymentMethod.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      type: true,
      accountNumber: true,
      accountName: true,
      instructions: true,
      qrisImage: true,
      isActive: true,
    },
  })
  return NextResponse.json({ methods })
}
