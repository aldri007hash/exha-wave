"use client"
import useSWR from "swr"
import { useEffect, useState } from "react"

const fetcher = (url: string) => fetch(url).then(res => res.json())

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (target <= 0) return
    const duration = 1500
    const step = Math.ceil(target / (duration / 16))
    const timer = setInterval(() => {
      setCurrent(prev => {
        const next = prev + step
        if (next >= target) {
          clearInterval(timer)
          return target
        }
        return next
      })
    }, 16)
    return () => clearInterval(timer)
  }, [target])

  return <span>{current.toLocaleString()}{suffix}</span>
}

export default function ProofSection() {
  const { data, isLoading } = useSWR("/api/proof", fetcher)
  const [startAnimation, setStartAnimation] = useState(false)

  const totalUsers = data?.totalUsers || 0
  const completedOrders = data?.completedOrders || 0
  const activePlatforms = data?.activePlatforms || 0
  const rating = data?.rating || "0.0"

  useEffect(() => {
    if (!isLoading) setStartAnimation(true)
  }, [isLoading])

  return (
    <section className="py-16 bg-background">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        <div>
          <p className="text-4xl font-bold text-primary">
            {startAnimation ? <AnimatedCounter target={totalUsers} suffix="+" /> : "0+"}
          </p>
          <p className="text-sm text-gray-500 mt-1">Klien Puas</p>
        </div>
        <div>
          <p className="text-4xl font-bold text-primary">
            {startAnimation ? <AnimatedCounter target={completedOrders} suffix="+" /> : "0+"}
          </p>
          <p className="text-sm text-gray-500 mt-1">Campaign Selesai</p>
        </div>
        <div>
          <p className="text-4xl font-bold text-primary">
            {startAnimation ? <AnimatedCounter target={activePlatforms} /> : "0"}
          </p>
          <p className="text-sm text-gray-500 mt-1">Platform Aktif</p>
        </div>
        <div>
          <p className="text-4xl font-bold text-primary">
            {startAnimation ? `⭐ ${rating}` : "⭐ 0.0"}
          </p>
          <p className="text-sm text-gray-500 mt-1">Rating Kepuasan</p>
        </div>
      </div>
    </section>
  )
}