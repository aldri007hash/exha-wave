"use client"
import { useState, useEffect, useRef } from "react"
import useSWR from "swr"
import * as THREE from "three"
import { ChevronLeft, ChevronRight } from "lucide-react"

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function PromoBanner() {
  const { data, error, mutate } = useSWR("/api/promo", fetcher, { 
    refreshInterval: 60000,
    revalidateOnFocus: true,
    dedupingInterval: 5000
  })
  const promos = data?.promos || []
  const [current, setCurrent] = useState(0)
  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = () => { console.log("PromoBanner: refresh triggered"); mutate() }
    window.addEventListener("promo-updated", handler)
    window.addEventListener("storage", (e) => { if (e.key === "promoUpdated") handler() })
    return () => { window.removeEventListener("promo-updated", handler); window.removeEventListener("storage", handler) }
  }, [mutate])

  useEffect(() => {
    if (!canvasRef.current || promos.length === 0) return
    let animationId: number; let renderer: THREE.WebGLRenderer
    try {
      const scene = new THREE.Scene(); const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
      const width = canvasRef.current.offsetWidth || 600; renderer.setSize(width, 200); renderer.setClearColor(0x000000, 0)
      canvasRef.current.appendChild(renderer.domElement)
      const particlesGeom = new THREE.BufferGeometry(); const particlesCount = 200; const posArray = new Float32Array(particlesCount * 3)
      for (let i = 0; i < particlesCount * 3; i++) posArray[i] = (Math.random() - 0.5) * 5
      particlesGeom.setAttribute("position", new THREE.BufferAttribute(posArray, 3))
      const particlesMat = new THREE.PointsMaterial({ size: 0.03, color: 0x0066ff, blending: THREE.AdditiveBlending })
      const particlesMesh = new THREE.Points(particlesGeom, particlesMat); scene.add(particlesMesh); camera.position.z = 3
      const animate = () => { animationId = requestAnimationFrame(animate); particlesMesh.rotation.y += 0.002; renderer.render(scene, camera) }
      animate()
    } catch (err) { console.error("Three.js error:", err) }
    return () => { if (animationId) cancelAnimationFrame(animationId); if (renderer && canvasRef.current?.contains(renderer.domElement)) canvasRef.current.removeChild(renderer.domElement) }
  }, [promos, current])

  useEffect(() => {
    if (promos.length <= 1) return
    const interval = setInterval(() => { setCurrent(prev => (prev + 1) % promos.length) }, 5000)
    return () => clearInterval(interval)
  }, [promos])

  if (error) return null
  if (promos.length === 0) return null

  const promo = promos[current]
  const promoTypeLabel = promo.promoType === "DISKON_TANGGAL" ? "Diskon Topup" : "Diskon Layanan"

  return (
    <div className="relative h-[180px] md:h-[220px] overflow-hidden rounded-2xl mb-6 bg-gradient-to-br from-primary/30 to-accent/30">
      <div ref={canvasRef} className="absolute inset-0 z-0" />
      <div className="absolute inset-0 z-10 flex items-center justify-center text-center px-3 md:px-6">
        <div className="bg-white/80 dark:bg-black/50 backdrop-blur-md rounded-2xl p-4 md:p-6 max-w-[95%] md:max-w-lg w-full">
          <span className="text-[10px] md:text-xs text-gray-500 dark:text-gray-300 uppercase tracking-wider">{promoTypeLabel}</span>
          <h2 className="font-heading text-lg md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1 md:mb-2 line-clamp-1">{promo.title}</h2>
          {promo.description && (
            <p className="text-gray-600 dark:text-gray-200 text-xs md:text-sm mb-2 md:mb-4 line-clamp-2">{promo.description}</p>
          )}
          <div className="inline-block bg-primary text-white px-4 py-1.5 md:px-6 md:py-2 rounded-full font-semibold text-sm md:text-lg">
            Diskon {promo.discount}%
          </div>
          {promo.minAmount > 0 && (
            <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-300 mt-1 md:mt-2">Min. topup Rp {promo.minAmount.toLocaleString()}</p>
          )}
          {promo.jamMulai != null && (
            <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-300 mt-0.5 md:mt-1">Jam {promo.jamMulai}:00 - {promo.jamSelesai}:00 WIB</p>
          )}
          <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-300 mt-0.5 md:mt-1">
            Berlaku hingga {new Date(promo.endDate).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" })}
          </p>
        </div>
      </div>
      {promos.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 md:gap-2">
          <button onClick={() => setCurrent(prev => (prev - 1 + promos.length) % promos.length)} className="p-1 bg-white/50 dark:bg-white/30 rounded-full">
            <ChevronLeft size={14} className="text-gray-700 dark:text-white" />
          </button>
          {promos.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${i === current ? "bg-gray-800 dark:bg-white" : "bg-gray-400 dark:bg-white/50"}`} />
          ))}
          <button onClick={() => setCurrent(prev => (prev + 1) % promos.length)} className="p-1 bg-white/50 dark:bg-white/30 rounded-full">
            <ChevronRight size={14} className="text-gray-700 dark:text-white" />
          </button>
        </div>
      )}
    </div>
  )
}
