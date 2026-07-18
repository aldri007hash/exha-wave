import { NextResponse } from "next/server"
import { sendContactEmail } from "@/lib/nodemailer"

export async function POST(req: Request) {
  const { name, email, phone, message } = await req.json()
  try {
    await sendContactEmail({ name, email, phone, message })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengirim email" }, { status: 500 })
  }
}