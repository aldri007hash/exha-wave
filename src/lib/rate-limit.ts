import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
})

const limiters: Record<string, Ratelimit> = {
  login: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "15 m"), analytics: true, prefix: "ratelimit:login" }),
  forgot: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(3, "1 h"), analytics: true, prefix: "ratelimit:forgot" }),
  reseller: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, "1 m"), analytics: true, prefix: "ratelimit:reseller" }),
  chat: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, "1 m"), analytics: true, prefix: "ratelimit:chat" }),
  refund: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "15 m"), analytics: true, prefix: "ratelimit:refund" }),
  topup: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "15 m"), analytics: true, prefix: "ratelimit:topup" }),
  orders: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "1 m"), analytics: true, prefix: "ratelimit:orders" }),
}

export async function rateLimit(identifier: string, type: string): Promise<{ success: boolean; remaining: number }> {
  const limiter = limiters[type]
  if (!limiter) return { success: true, remaining: 999 }
  try {
    const { success, remaining } = await limiter.limit(identifier)
    return { success, remaining }
  } catch (error) {
    console.error(`Rate limit error (${type}):`, error)
    return { success: true, remaining: 999 }
  }
}
