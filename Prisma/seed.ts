import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  // Buat akun admin
  const adminPassword = await bcrypt.hash("admin123", 12)
  await prisma.user.upsert({
    where: { email: "admin@exhawave.com" },
    update: {},
    create: {
      name: "Admin Exha",
      username: "admin",
      email: "admin@exhawave.com",
      password: adminPassword,
      role: "ADMIN",
    },
  })

  // Buat platform
  const platforms = [
    "TikTok", "Instagram", "Facebook", "X", "Threads", "LinkedIn", "YouTube"
  ]
  for (const name of platforms) {
    await prisma.platform.upsert({
      where: { slug: name.toLowerCase() },
      update: {},
      create: { name, slug: name.toLowerCase() },
    })
  }

  // Buat metode pembayaran
  const paymentMethods = [
    { name: "Transfer BCA", type: "bank_transfer", accountNumber: "1234567890", accountName: "Exha Wave", instructions: "Transfer ke rekening BCA 1234567890 a/n Exha Wave" },
    { name: "QRIS", type: "qris", instructions: "Scan QRIS berikut untuk pembayaran" },
    { name: "GoPay", type: "ewallet", accountNumber: "085799428700", instructions: "Transfer ke GoPay 085799428700" },
    { name: "OVO", type: "ewallet", accountNumber: "085799428700", instructions: "Transfer ke OVO 085799428700" },
    { name: "Dana", type: "ewallet", accountNumber: "085799428700", instructions: "Transfer ke Dana 085799428700" },
  ]
  for (const method of paymentMethods) {
    await prisma.paymentMethod.create({ data: method })
  }

  console.log("Seeder berhasil!")
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())