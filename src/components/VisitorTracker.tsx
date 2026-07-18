"use client"
import { useEffect } from "react"

export default function VisitorTracker() {
  useEffect(() => {
    fetch("/api/visitor-log", { method: "POST" })
  }, [])
  return null
}