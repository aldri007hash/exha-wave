"use client"
import { createContext, useContext, useState, useRef, useEffect, ReactNode } from "react"

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
}

const AudioContext = createContext<AudioContextType | undefined>(undefined)

export function AudioProvider({ children }: { children: ReactNode }) {
  const [tracks, setTracks] = useState<Track[]>([])
  const [currentIndex, setCurrentIndex] = useState<number>(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const nextTrack = () => {
    if (currentIndex < tracks.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const prevTrack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  useEffect(() => {
    if (currentIndex >= 0 && tracks[currentIndex] && audioRef.current) {
      audioRef.current.src = tracks[currentIndex].fileUrl
      audioRef.current.play()
      setIsPlaying(true)
    }
  }, [currentIndex, tracks])

  return (
    <AudioContext.Provider value={{ tracks, setTracks, currentIndex, setCurrentIndex, isPlaying, togglePlay, nextTrack, prevTrack, audioRef }}>
      {children}
      <audio ref={audioRef} onEnded={nextTrack} className="hidden" />
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