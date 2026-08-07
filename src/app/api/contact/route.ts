import { NextResponse } from "next/server"
import { transporter } from "@/lib/nodemailer"

export async function POST(req: Request) {
  const { name, email, phone, message } = await req.json()

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Nama, email, dan pesan wajib diisi" }, { status: 400 })
  }

  try {
    await transporter.sendMail({
      from: `"${name}" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      subject: `[Kontak Exha Wave] Pesan dari ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #0066FF; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Pesan Kontak Baru</h1>
          </div>
          <div style="padding: 20px;">
            <p><strong>Nama:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            ${phone ? `<p><strong>Telepon:</strong> ${phone}</p>` : ""}
            <p><strong>Pesan:</strong></p>
            <p>${message}</p>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Gagal mengirim email kontak:", error)
    return NextResponse.json({ error: "Gagal mengirim pesan" }, { status: 500 })
  }
}
