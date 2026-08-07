import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import CopyButton from "./CopyButton"
import { formatCurrency } from "@/lib/utils"
import WelcomeBonus from "@/components/WelcomeBonus"
import DashboardBanner from "@/components/DashboardBanner"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  let user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      orders: { orderBy: { createdAt: "desc" }, take: 5 },
      referralsMade: true,
      referralsUsed: { include: { referrer: { select: { name: true } } } },
      wallet: true,
    },
  })

  if (!user) redirect("/login")

  const now = new Date()
  const lastLogin = user.lastLoginAt ? new Date(user.lastLoginAt) : null
  const diffHours = lastLogin ? (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60) : 25

  if (!lastLogin || diffHours >= 24) {
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: now, points: { increment: 10 } } })
    user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        orders: { orderBy: { createdAt: "desc" }, take: 5 },
        referralsMade: true,
        referralsUsed: { include: { referrer: { select: { name: true } } } },
        wallet: true,
      },
    })
  }

  if (!user) redirect("/login")

  const orderCounts = {
    PROCESSING: user.orders.filter(o => o.status === "PROCESSING").length,
    PROGRESS: user.orders.filter(o => o.status === "PROGRESS").length,
    PARTIAL: user.orders.filter(o => o.status === "PARTIAL").length,
    COMPLETED: user.orders.filter(o => o.status === "COMPLETED").length,
  }

  const referralCode = user.referralCode || "-"
  const totalReferrals = user.referralsMade.length
  const totalReferralPoints = user.referralsMade.reduce((sum, ref) => sum + ref.pointsGiven, 0)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const hasSpunToday = user.lastSpinDate ? new Date(user.lastSpinDate) >= today : false

  const walletBalance = user.wallet?.balance || 0

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <WelcomeBonus />
      <DashboardBanner />
      <h1 className="font-heading text-3xl font-bold mb-6">Dashboard</h1>

      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-3 mb-6 text-sm text-green-900 dark:text-green-200">
        👋 Selamat datang kembali, {user.name}! Saldo kamu: <strong className="text-green-700 dark:text-green-300">{formatCurrency(walletBalance)}</strong>. Ada Promo Setiap Hari Disini!
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Processing" value={orderCounts.PROCESSING} color="blue" />
        <StatCard label="Progress" value={orderCounts.PROGRESS} color="yellow" />
        <StatCard label="Partial" value={orderCounts.PARTIAL} color="orange" />
        <StatCard label="Completed" value={orderCounts.COMPLETED} color="green" />
      </div>

      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-500">Saldo Exha</span>
          <span className="font-bold text-green-500">{formatCurrency(walletBalance)}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-500">Exha Points</span>
          <span className="font-bold text-primary">{user.points} poin</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Tier</span>
          <span className="font-bold">{user.tier}</span>
        </div>
        {user.totalSpent > 0 && (
          <div className="flex justify-between items-center mt-2">
            <span className="text-gray-500">Total Belanja</span>
            <span className="font-bold">{formatCurrency(user.totalSpent)}</span>
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <h2 className="font-heading text-xl font-semibold mb-4">Kode Referral Kamu</h2>
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg font-mono text-lg">{referralCode}</div>
          <CopyButton text={referralCode} />
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Total Orang Diajak</p>
            <p className="text-xl font-bold">{totalReferrals}</p>
          </div>
          <div>
            <p className="text-gray-500">Poin dari Referral</p>
            <p className="text-xl font-bold">+{totalReferralPoints}</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <h2 className="font-heading text-xl font-semibold mb-4">🎡 Spin Wheel Harian</h2>
        {hasSpunToday ? (
          <p className="text-gray-500">Kamu sudah spin hari ini. Kembali besok!</p>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-3">Putar roda keberuntungan dan dapatkan Exha Points gratis setiap hari!</p>
            <Link href="/spin" className="inline-block bg-primary text-white px-6 py-2 rounded-full font-semibold">Spin Sekarang</Link>
          </>
        )}
      </div>

      <div className="flex gap-4 flex-wrap">
        <Link href="/orders" className="bg-primary text-white px-6 py-2 rounded-full">My Orders</Link>
        <Link href="/profile" className="border border-border px-6 py-2 rounded-full">Profile</Link>
        <Link href="/topup" className="bg-green-500 text-white px-6 py-2 rounded-full">Topup Saldo</Link>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    blue: "text-blue-500",
    yellow: "text-yellow-500",
    orange: "text-orange-500",
    green: "text-green-500",
  }
  return (
    <div className="bg-card border border-border rounded-xl p-4 text-center">
      <p className={`text-2xl font-bold ${colorMap[color]}`}>{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  )
}
