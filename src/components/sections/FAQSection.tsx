"use client"
import { useState } from "react"
import useSWR from "swr"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function FAQSection() {
  const { data, isLoading } = useSWR("/api/faq", fetcher)
  const faqs = data?.faqs || []
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section id="faq" className="py-16 bg-gradient-to-b from-background to-card">
      <div className="max-w-3xl mx-auto px-4">
        <motion.h2
          className="font-heading text-3xl font-bold mb-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Frequently Asked Questions
        </motion.h2>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
            ))}
          </div>
        ) : faqs.length === 0 ? (
          <p className="text-center text-gray-500">Belum ada pertanyaan.</p>
        ) : (
          <div className="space-y-4">
            {faqs.map((faq: any, index: number) => {
              const isOpen = openIndex === index
              return (
                <motion.div
                  key={faq.id}
                  className={`rounded-xl border backdrop-blur-sm transition-all duration-300 ${
                    isOpen
                      ? "bg-white/80 dark:bg-gray-800/80 border-primary/50 shadow-lg"
                      : "bg-white/40 dark:bg-gray-800/40 border-border hover:bg-white/60 dark:hover:bg-gray-800/60"
                  }`}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                >
                  <button
                    onClick={() => toggle(index)}
                    className="w-full flex justify-between items-center p-4 text-left"
                  >
                    <span className="font-semibold text-sm md:text-base">{faq.question}</span>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronDown size={18} className="text-primary" />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <p className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}