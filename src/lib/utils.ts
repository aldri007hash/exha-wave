import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function calculateTier(totalSpent: number): string {
  if (totalSpent >= 500000) return "EXHAS_FRIEND"
  if (totalSpent >= 250000) return "GOLD"
  if (totalSpent >= 100000) return "SILVER"
  return "BRONZE"
}

export function calculatePoints(orderTotal: number): number {
  if (orderTotal >= 100000) return 50
  if (orderTotal >= 50000) return 20
  return 0
}

export function getPointsValue(points: number): number {
  return Math.floor(points / 100) * 10
}

export const platformColors: Record<string, { border: string; shadow: string; text: string; gradient: string }> = {
  TikTok: {
    border: "border-[#ff0050]",
    shadow: "shadow-[#ff0050]/20",
    text: "text-[#ff0050]",
    gradient: "from-[#ff0050] to-[#00f2ea]",
  },
  Instagram: {
    border: "border-[#E1306C]",
    shadow: "shadow-[#E1306C]/20",
    text: "text-[#E1306C]",
    gradient: "from-[#feda75] to-[#E1306C]",
  },
  YouTube: {
    border: "border-[#FF0000]",
    shadow: "shadow-[#FF0000]/20",
    text: "text-[#FF0000]",
    gradient: "from-[#FF0000] to-[#c4302b]",
  },
  Facebook: {
    border: "border-[#1877F2]",
    shadow: "shadow-[#1877F2]/20",
    text: "text-[#1877F2]",
    gradient: "from-[#1877F2] to-[#0c5dc7]",
  },
  X: {
    border: "border-gray-900 dark:border-white",
    shadow: "shadow-gray-900/20 dark:shadow-white/20",
    text: "text-gray-900 dark:text-white",
    gradient: "from-gray-900 to-gray-700 dark:from-white dark:to-gray-300",
  },
  Threads: {
    border: "border-black dark:border-white",
    shadow: "shadow-black/20 dark:shadow-white/20",
    text: "text-black dark:text-white",
    gradient: "from-black to-gray-800 dark:from-white dark:to-gray-200",
  },
  LinkedIn: {
    border: "border-[#0A66C2]",
    shadow: "shadow-[#0A66C2]/20",
    text: "text-[#0A66C2]",
    gradient: "from-[#0A66C2] to-[#004182]",
  },
}