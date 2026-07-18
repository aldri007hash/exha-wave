import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const faqs = await prisma.faq.findMany({ orderBy: { order: "asc" } })
    return NextResponse.json({ faqs })
  } catch (error) {
    console.error("Error fetching FAQs:", error)
    return NextResponse.json({ faqs: [] })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { question, answer } = await req.json()
    if (!question || !answer) {
      return NextResponse.json({ error: "Question and answer required" }, { status: 400 })
    }

    const count = await prisma.faq.count()
    await prisma.faq.create({
      data: { question, answer, order: count + 1 },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error creating FAQ:", error)
    return NextResponse.json({ error: "Failed to create FAQ" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id, question, answer } = await req.json()
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

    await prisma.faq.update({ where: { id }, data: { question, answer } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating FAQ:", error)
    return NextResponse.json({ error: "Failed to update FAQ" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN"))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

    await prisma.faq.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting FAQ:", error)
    return NextResponse.json({ error: "Failed to delete FAQ" }, { status: 500 })
  }
}