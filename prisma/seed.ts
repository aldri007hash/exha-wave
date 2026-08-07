import { PrismaClient, Role, Tier, UserStatus, OrderStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Mulai seeding data...')

  // 1. Buat Super Admin
  const adminHash = bcrypt.hashSync('Admin123!', 10)
  await prisma.user.upsert({
    where: { email: 'admin@exhawave.com' },
    update: {},
    create: {
      name: 'Super Admin',
      username: 'superadmin',
      email: 'admin@exhawave.com',
      password: adminHash,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      phone: '085799428700',
    },
  })
  console.log('✅ Super Admin dibuat')

  // 2. Buat User Demo
  const userHash = bcrypt.hashSync('user1234', 10)
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@exhawave.com' },
    update: {},
    create: {
      name: 'Demo User',
      username: 'demouser',
      email: 'demo@exhawave.com',
      password: userHash,
      role: 'USER',
      status: 'ACTIVE',
      phone: '08123456789',
    },
  })
  await prisma.wallet.create({ data: { userId: demoUser.id, balance: 50000 } })
  console.log('✅ Demo User dibuat')

  // 3. Buat Metode Pembayaran
  const paymentMethods = [
    { name: 'QRIS', type: 'QRIS', accountNumber: '08123456789', accountName: 'Exha Wave', instructions: '1. Buka aplikasi pembayaran (GoPay, OVO, DANA, atau mobile banking).\n2. Pilih menu QRIS / Scan QR.\n3. Scan kode QRIS yang tertera.\n4. Masukkan nominal sesuai total pembayaran Anda.\n5. Konfirmasi dan selesaikan pembayaran.\n6. Setelah berhasil, unggah bukti pembayaran di halaman My Orders.' },
    { name: 'DANA', type: 'EWALLET', accountNumber: '085799428700', accountName: 'Exha Wave', instructions: '1. Buka aplikasi DANA.\n2. Pilih "Send" atau "Kirim".\n3. Masukkan nomor tujuan: 085799428700.\n4. Masukkan nominal sesuai total pembayaran.\n5. Konfirmasi dan selesaikan pembayaran.' },
    { name: 'OVO', type: 'EWALLET', accountNumber: '085799428700', accountName: 'Exha Wave', instructions: '1. Buka aplikasi OVO.\n2. Pilih "Transfer".\n3. Masukkan nomor tujuan: 085799428700.\n4. Masukkan nominal sesuai total pembayaran.\n5. Konfirmasi dan selesaikan pembayaran.' },
    { name: 'GoPay', type: 'EWALLET', accountNumber: '085799428700', accountName: 'Exha Wave', instructions: '1. Buka aplikasi Gojek.\n2. Pilih "GoPay" > "Transfer".\n3. Masukkan nomor tujuan: 085799428700.\n4. Masukkan nominal sesuai total pembayaran.\n5. Konfirmasi dan selesaikan pembayaran.' },
    { name: 'Bank BRI', type: 'BANK', accountNumber: '1234567890', accountName: 'Exha Wave', instructions: '1. Buka mobile banking atau ATM BRI.\n2. Pilih "Transfer" > "Ke Rek BRI".\n3. Masukkan nomor rekening: 1234567890.\n4. Masukkan nominal sesuai total pembayaran.\n5. Konfirmasi dan selesaikan pembayaran.' },
  ]
  for (const pm of paymentMethods) {
    await prisma.paymentMethod.create({ data: pm })
  }
  console.log('✅ Metode Pembayaran dibuat')

  // 4. Buat Platform dan Layanan
  const platformsData = [
    {
      name: 'Instagram', slug: 'instagram',
      services: [
        { name: 'Like (Bot)', slug: 'like-bot', minOrder: 1000, pricePerUnit: 25000, hasGaransi: true, badge: 'popular' },
        { name: 'Like (Real)', slug: 'like-real', minOrder: 10, pricePerUnit: 8000, hasGaransi: false },
        { name: 'Follow (Bot)', slug: 'follow-bot', minOrder: 1000, pricePerUnit: 30000, hasGaransi: true },
        { name: 'Follow (Real)', slug: 'follow-real', minOrder: 10, pricePerUnit: 8000, hasGaransi: false },
        { name: 'Comment (Real)', slug: 'comment-real', minOrder: 10, pricePerUnit: 20000, hasGaransi: false },
        { name: 'View', slug: 'view', minOrder: 1000, pricePerUnit: 25000, hasGaransi: true, badge: 'hemat' },
        { name: 'Save', slug: 'save', minOrder: 1000, pricePerUnit: 25000, hasGaransi: true },
        { name: 'Share (Bot)', slug: 'share-bot', minOrder: 1000, pricePerUnit: 25000, hasGaransi: true },
        { name: 'Share (Real)', slug: 'share-real', minOrder: 10, pricePerUnit: 8000, hasGaransi: false },
        { name: 'Repost (Real)', slug: 'repost-real', minOrder: 10, pricePerUnit: 8000, hasGaransi: false },
        { name: 'Save (Real)', slug: 'save-real', minOrder: 10, pricePerUnit: 8000, hasGaransi: false },
        { name: 'Report (Post/Profile)', slug: 'report', minOrder: 10, pricePerUnit: 8000, hasGaransi: false },
        { name: 'Starter (Bundle)', slug: 'starter-bundle', minOrder: 1, pricePerUnit: 99000, type: 'BUNDLE', hasGaransi: false },
      ]
    },
    {
      name: 'TikTok', slug: 'tiktok',
      services: [
        { name: 'Follower (Real)', slug: 'follower-real', minOrder: 10, pricePerUnit: 10000, hasGaransi: false },
        { name: 'Like + View', slug: 'like-view', minOrder: 1000, pricePerUnit: 25000, hasGaransi: true },
        { name: 'Video View', slug: 'video-view', minOrder: 1000, pricePerUnit: 25000, hasGaransi: true },
        { name: 'Comment (Real)', slug: 'comment-real', minOrder: 10, pricePerUnit: 20000, hasGaransi: false },
        { name: 'Save', slug: 'save', minOrder: 1000, pricePerUnit: 25000, hasGaransi: true },
        { name: 'Report Akun/Postingan', slug: 'report', minOrder: 10, pricePerUnit: 8000, hasGaransi: false },
      ]
    },
    {
      name: 'Facebook', slug: 'facebook',
      services: [
        { name: 'Follow Page/Profile', slug: 'follow', minOrder: 1000, pricePerUnit: 30000, hasGaransi: true },
        { name: 'Like', slug: 'like', minOrder: 1000, pricePerUnit: 25000, hasGaransi: true },
        { name: 'Comment (Real)', slug: 'comment-real', minOrder: 10, pricePerUnit: 20000, hasGaransi: false },
        { name: 'View', slug: 'view', minOrder: 1000, pricePerUnit: 25000, hasGaransi: true },
      ]
    },
    {
      name: 'YouTube', slug: 'youtube',
      services: [
        { name: 'Comment (Real)', slug: 'comment-real', minOrder: 10, pricePerUnit: 20000, hasGaransi: false },
        { name: 'Like (Real)', slug: 'like-real', minOrder: 10, pricePerUnit: 7000, hasGaransi: false },
      ]
    },
    {
      name: 'Twitter', slug: 'twitter',
      services: [
        { name: 'Follower (Real)', slug: 'follower-real', minOrder: 10, pricePerUnit: 10000, hasGaransi: false },
        { name: 'Retweet (Real)', slug: 'retweet-real', minOrder: 10, pricePerUnit: 7000, hasGaransi: false },
        { name: 'Video View', slug: 'video-view', minOrder: 1000, pricePerUnit: 30000, hasGaransi: true },
      ]
    },
    {
      name: 'LinkedIn', slug: 'linkedin',
      services: [
        { name: 'Comment (Real)', slug: 'comment-real', minOrder: 10, pricePerUnit: 50000, hasGaransi: false },
      ]
    },
    {
      name: 'Threads', slug: 'threads',
      services: [
        { name: 'Comment (Real)', slug: 'comment-real', minOrder: 10, pricePerUnit: 20000, hasGaransi: false },
      ]
    },
    {
      name: 'Website', slug: 'website',
      services: [
        { name: 'Website Polling', slug: 'polling', minOrder: 100, pricePerUnit: 80000, hasGaransi: false },
        { name: 'Website Google Form', slug: 'google-form', minOrder: 100, pricePerUnit: 85000, hasGaransi: true },
      ]
    },
    {
      name: 'Spam Sosmed', slug: 'spam-sosmed',
      services: [
        { name: 'Spam Call', slug: 'spam-call', minOrder: 10, pricePerUnit: 20000, hasGaransi: false },
        { name: 'Spam Chat', slug: 'spam-chat', minOrder: 10, pricePerUnit: 15000, hasGaransi: false },
      ]
    },
    {
      name: 'Layanan lain By WA', slug: 'layanan-wa',
      services: [
        { name: 'Request Order', slug: 'request-order', minOrder: 1, pricePerUnit: 500, hasGaransi: false },
      ]
    },
  ]

  for (const pData of platformsData) {
    const platform = await prisma.platform.create({
      data: {
        name: pData.name,
        slug: pData.slug,
        services: {
          create: pData.services.map(s => ({
            name: s.name,
            slug: s.slug,
            minOrder: s.minOrder,
            pricePerUnit: s.pricePerUnit,
            type: (s as any).type || 'SINGLE',
            hasGaransi: s.hasGaransi,
            badge: (s as any).badge || null,
          }))
        }
      }
    })
    console.log(`✅ Platform ${platform.name} dibuat dengan ${pData.services.length} layanan`)
  }

  // 5. Buat Pengaturan Default
  const settings = [
    { key: 'siteTitle', value: 'Exha Wave' },
    { key: 'minTopup', value: '15000' },
    { key: 'maxTopup', value: '1000000' },
    { key: 'pointValue', value: '0.1' },
    { key: 'batasAutoCancel', value: '24' },
    { key: 'supportContact', value: '085799428700' },
  ]
  for (const s of settings) {
    await prisma.setting.upsert({ where: { key: s.key }, update: { value: s.value }, create: s })
  }
  console.log('✅ Pengaturan default dibuat')

  console.log('🎉 Seeding selesai!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
