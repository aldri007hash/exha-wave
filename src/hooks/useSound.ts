"use client"
import { useCallback } from "react"

let audioCtx: AudioContext | null = null

const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  return audioCtx
}

export function useClickSound() {
  const playClick = useCallback(() => {
    try {
      const ctx = getAudioContext()
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.frequency.value = 800
      oscillator.type = "sine"
      gainNode.gain.value = 0.05

      oscillator.start(ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
      oscillator.stop(ctx.currentTime + 0.1)
    } catch (e) {
      // Abaikan jika tidak ada izin atau error
    }
  }, [])

  return playClick
}