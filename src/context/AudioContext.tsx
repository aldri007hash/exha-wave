"use client"
import { createContext, useContext, useState, useRef, useEffect, ReactNode, useCallback } from "react"

interface Track {
  id: string
  title: string
  category: string
  fileUrl: string
  order: number
}

interface AudioContextType {
  tracks: Track[]
  setTracks: (tracks: Track[]) => void
  currentIndex: number
  setCurrentIndex: (index: number) => void
  isPlaying: boolean
  togglePlay: () => void
  nextTrack: () => void
  prevTrack: () => void
  audioRef: React.RefObject<HTMLAudioElement | null>
  volume: number
  setVolume: (vol: number) => void
  currentTime: number
  duration: number
  seek: (time: number) => void
  closePlayer: () => void
}

const AudioContext = createContext<AudioContextType | undefined>(undefined)

export function AudioProvider({ children }: { children: ReactNode }) {
  const [tracks, setTracks] = useState<Track[]>([])
  const [currentIndex, setCurrentIndex] = useState<number>(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolumeState] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)
  const prevSrcRef = useRef<string>("")

  const togglePlay = useCallback(() => {
    if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play()
        setIsPlaying(true)
      } else {
        audioRef.current.pause()
        setIsPlaying(false)
      }
    }
  }, [])

  const nextTrack = useCallback(() => {
    setCurrentIndex(prev => {
      if (prev < 0 || tracks.length === 0) return prev
      if (prev < tracks.length - 1) return prev + 1
      return 0 // loop ke awal
    })
  }, [tracks.length])

  const prevTrack = useCallback(() => {
    setCurrentIndex(prev => {
      if (prev < 0 || tracks.length === 0) return prev
      if (prev > 0) return prev - 1
      return tracks.length - 1 // loop ke akhir
    })
  }, [tracks.length])

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }, [])

  const setVolume = useCallback((vol: number) => {
    const clamped = Math.min(1, Math.max(0, vol))
    if (audioRef.current) {
      audioRef.current.volume = clamped
    }
    setVolumeState(clamped)
  }, [])

  const closePlayer = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ""
    }
    setCurrentIndex(-1)
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    prevSrcRef.current = ""
  }, [])

  // Sinkronkan volume state ke audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  // Event listeners: timeupdate, loadedmetadata, ended
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration || 0)
    const onEnded = () => nextTrack()

    audio.addEventListener("timeupdate", updateTime)
    audio.addEventListener("loadedmetadata", updateDuration)
    audio.addEventListener("ended", onEnded)

    return () => {
      audio.removeEventListener("timeupdate", updateTime)
      audio.removeEventListener("loadedmetadata", updateDuration)
      audio.removeEventListener("ended", onEnded)
    }
  }, [nextTrack])

  // Ganti track setiap currentIndex berubah
  useEffect(() => {
    if (currentIndex >= 0 && currentIndex < tracks.length && audioRef.current) {
      const newSrc = tracks[currentIndex].fileUrl
      // Hanya ganti src jika berbeda untuk menghindari reset yang tidak perlu
      if (prevSrcRef.current !== newSrc) {
        prevSrcRef.current = newSrc
        audioRef.current.src = newSrc
        audioRef.current.play().catch(err => console.error("Gagal play:", err))
        setIsPlaying(true)
      } else if (audioRef.current.paused) {
        // Jika src sama tapi paused (misal karena pause manual), jangan otomatis play
        // Biarkan user kontrol
      }
    }
  }, [currentIndex, tracks])

  // Jika tracks kosong dan sedang playing, hentikan
  useEffect(() => {
    if (tracks.length === 0 && currentIndex >= 0) {
      closePlayer()
    }
  }, [tracks, currentIndex, closePlayer])

  return (
    <AudioContext.Provider value={{
      tracks, setTracks,
      currentIndex, setCurrentIndex,
      isPlaying, togglePlay,
      nextTrack, prevTrack,
      audioRef,
      volume, setVolume,
      currentTime, duration, seek,
      closePlayer
    }}>
      {children}
      <audio ref={audioRef} preload="auto" className="hidden" />
    </AudioContext.Provider>
  )
}

export const useAudio = () => {
  const context = useContext(AudioContext)
  if (context === undefined) {
    throw new Error("useAudio must be used within an AudioProvider")
  }
  return context
}
