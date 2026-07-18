"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Faq {
  id: string
  question: string
  answer: string
  order: number
}

export default function FaqList({ faqs }: { faqs: Faq[] }) {
  const [items, setItems] = useState(faqs)
  const router = useRouter()

  const addFaq = async () => {
    const question = prompt("Pertanyaan")
    const answer = prompt("Jawaban")
    if (!question || !answer) return
    await fetch("/api/admin/faq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, answer, order: items.length }),
    })
    router.refresh()
  }

  const deleteFaq = async (id: string) => {
    await fetch(`/api/admin/faq/${id}`, { method: "DELETE" })
    router.refresh()
  }

  return (
    <div>
      <button onClick={addFaq} className="bg-primary text-white px-4 py-2 rounded mb-4">+ Tambah FAQ</button>
      <div className="space-y-3">
        {items.map((faq, idx) => (
          <div key={faq.id} className="bg-card p-3 rounded border">
            <p className="font-semibold">{idx+1}. {faq.question}</p>
            <p className="text-sm text-gray-600">{faq.answer}</p>
            <button onClick={() => deleteFaq(faq.id)} className="text-red-500 text-xs mt-1">Hapus</button>
          </div>
        ))}
      </div>
    </div>
  )
}