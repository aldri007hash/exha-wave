import { prisma } from "@/lib/prisma"

export default async function LeaderboardPage() {
  let pointsLeaderboard: any[] = []
  let spentLeaderboard: any[] = []

  try {
    pointsLeaderboard = await prisma.user.findMany({
      orderBy: { points: "desc" },
      take: 10,
      select: { id: true, name: true, points: true },
    })

    spentLeaderboard = await prisma.user.findMany({
      orderBy: { totalSpent: "desc" },
      take: 10,
      select: { id: true, name: true, totalSpent: true },
    })
  } catch (error) {
    console.error("Gagal mengambil data leaderboard:", error)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="font-heading text-3xl font-bold mb-8 text-center">Leaderboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold text-xl mb-4">Top 10 Poin</h2>
          {pointsLeaderboard.length === 0 ? (
            <p className="text-gray-500">Belum ada data.</p>
          ) : (
            <div className="space-y-2">
              {pointsLeaderboard.map((user, idx) => (
                <div key={user.id} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg w-6">{idx + 1}</span>
                    <span>{user.name}</span>
                  </div>
                  <span className="text-primary font-semibold">{user.points} pts</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold text-xl mb-4">Top 10 Total Belanja</h2>
          {spentLeaderboard.length === 0 ? (
            <p className="text-gray-500">Belum ada data.</p>
          ) : (
            <div className="space-y-2">
              {spentLeaderboard.map((user, idx) => (
                <div key={user.id} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg w-6">{idx + 1}</span>
                    <span>{user.name}</span>
                  </div>
                  <span className="text-primary font-semibold">Rp {user.totalSpent.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
