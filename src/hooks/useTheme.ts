"use client"
import { useEffect, useState } from "react"

type Theme = "light" | "dark" | "green" | "purple"

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("light")

  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null
    if (saved) setThemeState(saved)
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