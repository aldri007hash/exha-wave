import { GoogleGenerativeAI } from "@google/generative-ai"
import { localChat } from "@/lib/chat-local"

const apiKey = process.env.GEMINI_API_KEY || ""
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null

export async function chatWithGemini(message: string, history: { role: string; content: string }[]): Promise<string> {
  if (!genAI) return localChat(message)

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
    const chat = model.startChat({
      history: history.map(h => ({
        role: h.role === "ai" ? "model" : "user",
        parts: [{ text: h.content }],
      })),
    })
    const result = await chat.sendMessage(message)
    const text = result.response.text()
    if (!text || text.trim() === "") return localChat(message)
    return text
  } catch (error) {
    console.error("Gemini error, fallback to local:", error)
    return localChat(message)
  }
}