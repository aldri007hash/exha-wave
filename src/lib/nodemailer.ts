import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
})

// Verifikasi koneksi saat startup
transporter.verify((error, success) => {
  if (error) {
    console.error("Nodemailer connection error:", error.message)
  } else {
    console.log("Nodemailer siap mengirim email")
  }
})

export { transporter }
