import { prisma } from "@/lib/prisma"
import Link from "next/link"

export default async function LeaderboardPage() {
  const byPoints = await prisma.user.findMany({
    where: { role: "USER", status: "ACTIVE" },
    orderBy: { points: "desc" },
    take: 10,
    select: { name: true, points: true, tier: true },
  })

  const bySpent = await prisma.user.findMany({
    where: { role: "USER", status: "ACTIVE" },
    orderBy: { totalSpent: "desc" },
    take: 10,
    select: { name: true, totalSpent: true, tier: true },
  })

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="font-heading text-3xl font-bold text-center mb-8">Leaderboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-heading text-xl font-semibold mb-4">Top 10 Exha Points</h2>
          {byPoints.length === 0 ? (
            <p className="text-gray-500">Belum ada data.</p>
          ) : (
            <div className="space-y-2">
              {byPoints.map((user, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-primary">#{idx + 1}</span>
                    <span>{user.name}</span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{user.tier}</span>
                  </div>
                  <span className="font-semibold">{user.points} pts</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-heading text-xl font-semibold mb-4">Top 10 Total Belanja</h2>
          {bySpent.length === 0 ? (
            <p className="text-gray-500">Belum ada data.</p>
          ) : (
            <div className="space-y-2">
              {bySpent.map((user, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-primary">#{idx + 1}</span>
                    <span>{user.name}</span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{user.tier}</span>
                  </div>
                  <span className="font-semibold">Rp {user.totalSpent.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}