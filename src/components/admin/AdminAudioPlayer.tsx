"use client"
import { useEffect, useRef, useState } from "react"
import { useAudio } from "@/context/AudioContext"
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, X, Square } from "lucide-react"
import * as THREE from "three"

export default function AdminAudioPlayer() {
  const { tracks, currentIndex, isPlaying, togglePlay, nextTrack, prevTrack, audioRef, setCurrentIndex } = useAudio()
  const canvasRef = useRef<HTMLDivElement>(null)
  const currentTrack = currentIndex >= 0 ? tracks[currentIndex] : null
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (!canvasRef.current || !visible) return
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(80, 80)
    canvasRef.current.appendChild(renderer.domElement)

    const geometry = new THREE.CylinderGeometry(0.35, 0.35, 0.04, 64)
    const material = new THREE.MeshStandardMaterial({ color: 0x0066FF, roughness: 0.2, metalness: 0.8 })
    const disc = new THREE.Mesh(geometry, material)
    scene.add(disc)

    const light = new THREE.DirectionalLight(0xffffff, 1)
    light.position.set(0, 0, 2)
    scene.add(light)
    scene.add(new THREE.AmbientLight(0x404040))
    camera.position.z = 1.2

    let animationId: number
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      if (isPlaying) disc.rotation.y += 0.02
      renderer.render(scene, camera)
    }
    animate()
    return () => {
      cancelAnimationFrame(animationId)
      if (canvasRef.current?.contains(renderer.domElement)) {
        canvasRef.current.removeChild(renderer.domElement)
      }
    }
  }, [isPlaying, visible])

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setCurrentIndex(-1)
  }

  if (!currentTrack || !visible) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 bg-card border border-border rounded-xl p-3 shadow-lg">
      <div ref={canvasRef} className="w-10 h-10" />
      <div className="flex flex-col min-w-[100px]">
        <p className="text-sm font-semibold truncate">{currentTrack.title || "Tanpa judul"}</p>
        <p className="text-xs text-gray-500">{currentTrack.category}</p>
        <input
          type="range"
          min="0"
          max={audioRef.current?.duration || 0}
          value={audioRef.current?.currentTime || 0}
          onChange={(e) => { if (audioRef.current) audioRef.current.currentTime = Number(e.target.value) }}
          className="w-full mt-1 h-1 accent-primary"
        />
      </div>
      <div className="flex items-center gap-1">
        <button onClick={prevTrack} className="p-1 hover:bg-primary/10 rounded"><SkipBack size={14} /></button>
        <button onClick={togglePlay} className="p-1 hover:bg-primary/10 rounded">{isPlaying ? <Pause size={14} /> : <Play size={14} />}</button>
        <button onClick={handleStop} className="p-1 hover:bg-primary/10 rounded"><Square size={14} /></button>
        <button onClick={nextTrack} className="p-1 hover:bg-primary/10 rounded"><SkipForward size={14} /></button>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => setVisible(false)} className="p-1 hover:bg-red-100 rounded"><X size={14} /></button>
        <button onClick={() => { /* volume control bisa ditambahkan */ }}>
          <Volume2 size={14} />
        </button>
      </div>
    </div>
  )
}