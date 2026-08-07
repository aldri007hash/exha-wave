import fs from "fs"
import path from "path"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  const cacheDir = path.join(process.cwd(), "cache")
  // Pastikan folder cache ada
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true })
  }
  const cacheFile = path.join(cacheDir, "broadcast.json")
  let lastTime = 0

  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    start(controller) {
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"))
        } catch {}
      }, 15000)

      const checkInterval = setInterval(() => {
        try {
          if (fs.existsSync(cacheFile)) {
            const raw = fs.readFileSync(cacheFile, "utf-8")
            if (raw.trim()) {
              const data = JSON.parse(raw)
              if (data.time && data.time > lastTime && (Date.now() - data.time) < 30000) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
                lastTime = data.time
              }
            }
          }
        } catch (err) {
          // Abaikan error parsing
        }
      }, 1000)

      return () => {
        clearInterval(pingInterval)
        clearInterval(checkInterval)
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  })
}
