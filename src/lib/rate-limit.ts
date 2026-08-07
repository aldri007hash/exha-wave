import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Buat rate limiter: 5 permintaan per 15 menit
const loginLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  analytics: true,
})

// Buat rate limiter: 3 permintaan per jam
const forgotLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "1 h"),
  analytics: true,
})

// Buat rate limiter: 30 permintaan per menit
const resellerLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1 m"),
  analytics: true,
})

// Buat rate limiter: 20 permintaan per menit
const chatLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 m"),
  analytics: true,
})

export async function rateLimit(
  identifier: string,
  type: "login" | "forgot" | "reseller" | "chat"
): Promise<{ success: boolean; remaining: number }> {
  let limiter: Ratelimit
  switch (type) {
    case "login": limiter = loginLimiter; break
    case "forgot": limiter = forgotLimiter; break
    case "reseller": limiter = resellerLimiter; break
    case "chat": limiter = chatLimiter; break
    default: limiter = loginLimiter
  }
  const result = await limiter.limit(identifier)
  return { success: result.success, remaining: result.remaining }
}
