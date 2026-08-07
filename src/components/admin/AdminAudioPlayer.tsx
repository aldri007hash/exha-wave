"use client"
import { useAudio } from "@/context/AudioContext"
import { X, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react"

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "0:00"
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export default function AdminAudioPlayer() {
  const {
    tracks, currentIndex, isPlaying, togglePlay,
    nextTrack, prevTrack, setCurrentIndex, audioRef,
    volume, setVolume, currentTime, duration, seek, closePlayer
  } = useAudio()

  if (currentIndex < 0 || !tracks[currentIndex]) return null

  const currentTrack = tracks[currentIndex]

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    seek(Number(e.target.value))
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(e.target.value))
  }

  const toggleMute = () => {
    setVolume(volume > 0 ? 0 : 1)
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-gray-900 text-white rounded-2xl p-4 shadow-2xl w-[calc(100%-2rem)] max-w-[340px] animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400 flex items-center gap-1">
          🎵 Now Playing
        </span>
        <button onClick={closePlayer} className="text-gray-400 hover:text-white p-1" aria-label="Tutup player">
          <X size={16} />
        </button>
      </div>

      {/* Track info */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-lg">🎵</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{currentTrack.title || "Tanpa judul"}</p>
          <p className="text-xs text-gray-400">{currentTrack.category}</p>
        </div>
      </div>

      {/* Seek bar + durasi */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] text-gray-400 w-10 text-right">{formatTime(currentTime)}</span>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          className="flex-1 h-1 accent-primary cursor-pointer"
          aria-label="Seek"
        />
        <span className="text-[10px] text-gray-400 w-10">{formatTime(duration)}</span>
      </div>

      {/* Tombol kontrol */}
      <div className="flex items-center justify-center gap-2 mt-2">
        <button onClick={prevTrack} className="p-1.5 hover:bg-gray-700 rounded-full" title="Sebelumnya">
          <SkipBack size={16} />
        </button>
        <button onClick={togglePlay} className="p-2 bg-primary rounded-full hover:bg-primary/80" title={isPlaying ? "Jeda" : "Putar"}>
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button onClick={nextTrack} className="p-1.5 hover:bg-gray-700 rounded-full" title="Berikutnya">
          <SkipForward size={16} />
        </button>
      </div>

      {/* Volume slider */}
      <div className="flex items-center gap-2 mt-3">
        <button onClick={toggleMute} className="p-1 hover:bg-gray-700 rounded-full" title={volume > 0 ? "Bisukan" : "Bunyikan"}>
          {volume > 0 ? <Volume2 size={14} /> : <VolumeX size={14} />}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={handleVolumeChange}
          className="flex-1 h-1 accent-primary cursor-pointer"
          aria-label="Volume"
        />
        <span className="text-[10px] text-gray-400 w-8 text-right">{Math.round(volume * 100)}%</span>
      </div>

      {/* Daftar lagu (mini) */}
      {tracks.length > 1 && (
        <div className="mt-3 max-h-24 overflow-y-auto border-t border-gray-700 pt-2">
          <p className="text-[10px] text-gray-500 mb-1">Daftar Putar</p>
          {tracks.map((track, idx) => (
            <button
              key={track.id}
              onClick={() => setCurrentIndex(idx)}
              className={`w-full text-left text-xs py-1 px-2 rounded truncate flex items-center gap-2 ${
                idx === currentIndex ? "bg-primary/20 text-white font-medium" : "text-gray-400 hover:bg-gray-800"
              }`}
            >
              <span className="w-5 text-center text-[10px]">{idx + 1}</span>
              <span className="truncate">{track.title || "Tanpa judul"}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
