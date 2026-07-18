"use client"
import { useState, useEffect } from "react"

export default function AdminLeaderboardPage() {
  const [pointsLeaderboard, setPointsLeaderboard] = useState<any[]>([])
  const [spentLeaderboard, setSpentLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/leaderboard")
      .then(res => res.json())
      .then(data => {
        setPointsLeaderboard(data.pointsLeaderboard || [])
        setSpentLeaderboard(data.spentLeaderboard || [])
        setLoading(false)
      })
  }, [])

  if (loading) return <p className="text-center py-12">Memuat leaderboard...</p>

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold mb-6">Leaderboard</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="font-semibold mb-3">Top 10 Poin</h3>
          <div className="bg-card border border-border rounded-xl p-4">
            {pointsLeaderboard.map((user, idx) => (
              <div key={user.id} className="flex justify-between items-center py-2 border-b last:border-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg w-6">{idx + 1}</span>
                  <span>{user.name}</span>
                </div>
                <span className="text-primary font-semibold">{user.points} pts</span>
              </div>
            ))}
            {pointsLeaderboard.length === 0 && <p className="text-gray-500">Belum ada data.</p>}
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-3">Top 10 Total Belanja</h3>
          <div className="bg-card border border-border rounded-xl p-4">
            {spentLeaderboard.map((user, idx) => (
              <div key={user.id} className="flex justify-between items-center py-2 border-b last:border-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg w-6">{idx + 1}</span>
                  <span>{user.name}</span>
                </div>
                <span className="text-primary font-semibold">Rp {user.totalSpent.toLocaleString()}</span>
              </div>
            ))}
            {spentLeaderboard.length === 0 && <p className="text-gray-500">Belum ada data.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}