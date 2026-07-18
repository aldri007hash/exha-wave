import { prisma } from "@/lib/prisma"
import { formatCurrency } from "@/lib/utils"

export default async function LeaderboardPage() {
  const topPoints = await prisma.user.findMany({
    where: { role: "USER", status: "ACTIVE" },
    orderBy: { points: "desc" },
    take: 10,
    select: { name: true, points: true },
  })

  const topSpenders = await prisma.user.findMany({
    where: { role: "USER", status: "ACTIVE" },
    orderBy: { totalSpent: "desc" },
    take: 10,
    select: { name: true, totalSpent: true },
  })

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="font-heading text-3xl font-bold mb-8 text-center">Leaderboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-heading text-xl font-semibold mb-4">🏆 Top Poin Exha</h2>
          <ol className="space-y-3">
            {topPoints.map((user, index) => (
              <li key={index} className="flex justify-between items-center">
                <span className="font-medium">{index + 1}. {user.name}</span>
                <span className="text-primary font-bold">{user.points} poin</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-heading text-xl font-semibold mb-4">💰 Top Spender</h2>
          <ol className="space-y-3">
            {topSpenders.map((user, index) => (
              <li key={index} className="flex justify-between items-center">
                <span className="font-medium">{index + 1}. {user.name}</span>
                <span className="text-primary font-bold">{formatCurrency(user.totalSpent)}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}