const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const notifications = await prisma.notification.findMany({
    where: {
      title: "Status Pesanan Diperbarui",
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })
  console.log("Jumlah notifikasi ditemukan:", notifications.length)
  notifications.forEach((n, i) => {
    console.log(`\n[${i+1}] ID: ${n.id}`)
    console.log(`    UserID: ${n.userId}`)
    console.log(`    Pesan: ${n.message}`)
    console.log(`    Tanggal: ${n.createdAt}`)
  })
  await prisma.$disconnect()
}

main()
