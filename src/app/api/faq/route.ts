import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const faqs = await prisma.faq.findMany({ orderBy: { order: "asc" } })
  return NextResponse.json({ faqs })
}