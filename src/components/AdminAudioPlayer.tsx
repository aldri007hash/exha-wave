"use client"
import { useAudio } from "@/context/AudioContext"
import { X, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Disc3 } from "lucide-react"
import { useState, useEffect } from "react"

export default function AdminAudioPlayer() {
  const {
    tracks,
    currentIndex,
    isPlaying,
    togglePlay,
    nextTrack,
    prevTrack,
    volume,
    setVolume,
    currentTime,
    duration,
    seek,
    closePlayer
  } = useAudio()

  const [show, setShow] = useState(false)

  // Tampilkan player jika ada track yang diputar
  useEffect(() => {
    if (currentIndex >= 0 && tracks[currentIndex]) {
      setShow(true)
    } else {
      setShow(false)
    }
  }, [currentIndex, tracks])

  if (!show || currentIndex < 0 || !tracks[currentIndex]) return null

  const track = tracks[currentIndex]

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60)
    const s = Math.floor(t % 60)
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-gray-900/95 backdrop-blur-xl border-t border-gray-700 px-4 py-3 text-white shadow-2xl animate-in slide-in-from-bottom">
      {/* Animasi Piringan Hitam 3D */}
      <div className="absolute -top-10 right-4 w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent shadow-lg overflow-hidden opacity-20 pointer-events-none">
        <div className={`w-full h-full rounded-full border-4 border-white/30 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }}>
          <div className="w-2 h-2 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto flex items-center gap-4">
        {/* Tombol Close */}
        <button onClick={closePlayer} className="p-1 hover:bg-gray-700 rounded-full" title="Tutup">
          <X size={18} />
        </button>

        {/* Info Track */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{track.title}</p>
          <p className="text-xs text-gray-400">{track.category}</p>
        </div>

        {/* Kontrol */}
        <div className="flex items-center gap-1">
          <button onClick={prevTrack} className="p-1.5 hover:bg-gray-700 rounded-full" title="Sebelumnya">
            <SkipBack size={18} />
          </button>
          <button onClick={togglePlay} className="p-2 bg-primary rounded-full hover:bg-primary/80" title={isPlaying ? "Pause" : "Play"}>
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button onClick={nextTrack} className="p-1.5 hover:bg-gray-700 rounded-full" title="Selanjutnya">
            <SkipForward size={18} />
          </button>
        </div>

        {/* Progress */}
        <div className="hidden sm:flex items-center gap-2 flex-1">
          <span className="text-xs w-10 text-right">{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={(e) => seek(Number(e.target.value))}
            className="w-full h-1 bg-gray-600 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full"
          />
          <span className="text-xs w-10">{formatTime(duration)}</span>
        </div>

        {/* Volume */}
        <div className="hidden sm:flex items-center gap-2">
          <button onClick={() => setVolume(volume > 0 ? 0 : 1)} className="p-1 hover:bg-gray-700 rounded-full">
            {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-20 h-1 bg-gray-600 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>
      </div>
    </div>
  )
}
