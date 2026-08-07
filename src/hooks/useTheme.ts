"use client"
import { useEffect, useState } from "react"

type Theme = "light" | "dark" | "green" | "purple"

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("light")

  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null
    if (saved) {
      setThemeState(saved)
    } else {
      // Tentukan tema otomatis berdasarkan jam
      const hour = new Date().getHours()
      const autoTheme: Theme = (hour >= 18 || hour < 6) ? "dark" : "light"
      setThemeState(autoTheme)
      localStorage.setItem("theme", autoTheme)
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove("theme-dark", "theme-green", "theme-purple")
    if (theme !== "light") {
      root.classList.add(`theme-${theme}`)
    }
    localStorage.setItem("theme", theme)
  }, [theme])

  const setTheme = (t: Theme) => setThemeState(t)

  return { theme, setTheme }
}
