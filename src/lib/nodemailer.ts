\import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

export async function sendContactEmail(data: {
  name: string
  email: string
  phone: string
  message: string
}) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: "exhagroup@gmail.com",
    subject: `Pesan dari ${data.name} via Exha Wave`,
    html: `
      <h3>Pesan Baru dari Form Kontak</h3>
      <p><strong>Nama:</strong> ${data.name}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Telepon:</strong> ${data.phone}</p>
      <p><strong>Pesan:</strong></p>
      <p>${data.message}</p>
    `,
  }

  await transporter.sendMail(mailOptions)
}

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
  }

  await transporter.sendMail(mailOptions)
}