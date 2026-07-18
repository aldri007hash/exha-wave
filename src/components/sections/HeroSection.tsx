"use client"
import { useEffect, useRef, useState } from "react"
import * as THREE from "three"

const durations = [5000, 5000, 10000]

export default function HeroSection() {
  const canvas1Ref = useRef<HTMLDivElement>(null)
  const canvas2Ref = useRef<HTMLDivElement>(null)
  const canvas3Ref = useRef<HTMLDivElement>(null)

  const [animIndex, setAnimIndex] = useState(0)

  useEffect(() => {
    if (!canvas1Ref.current) return
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000, 0)
    canvas1Ref.current.appendChild(renderer.domElement)

    const particlesGeom = new THREE.BufferGeometry()
    const particlesCount = 800
    const posArray = new Float32Array(particlesCount * 3)
    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 10
    }
    particlesGeom.setAttribute("position", new THREE.BufferAttribute(posArray, 3))
    const particlesMat = new THREE.PointsMaterial({ size: 0.02, color: 0x0066ff, blending: THREE.AdditiveBlending })
    const particlesMesh = new THREE.Points(particlesGeom, particlesMat)
    scene.add(particlesMesh)

    camera.position.z = 3

    let animationId: number
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      particlesMesh.rotation.y += 0.0003
      particlesMesh.rotation.x += 0.0001
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(animationId)
      if (canvas1Ref.current?.contains(renderer.domElement)) {
        canvas1Ref.current.removeChild(renderer.domElement)
      }
    }
  }, [])

  useEffect(() => {
    if (!canvas2Ref.current) return
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000, 0)
    canvas2Ref.current.appendChild(renderer.domElement)

    const starsGeom = new THREE.BufferGeometry()
    const starsCount = 2000
    const starsPos = new Float32Array(starsCount * 3)
    for (let i = 0; i < starsCount * 3; i += 3) {
      starsPos[i] = (Math.random() - 0.5) * 30
      starsPos[i + 1] = (Math.random() - 0.5) * 30
      starsPos[i + 2] = (Math.random() - 0.5) * 30
    }
    starsGeom.setAttribute("position", new THREE.BufferAttribute(starsPos, 3))
    const starsMat = new THREE.PointsMaterial({ size: 0.05, color: 0xffffff })
    const stars = new THREE.Points(starsGeom, starsMat)
    scene.add(stars)

    const meteors: THREE.Mesh[] = []
    const meteorGeom = new THREE.SphereGeometry(0.1, 8, 8)
    const meteorColors = [0xff6600, 0xff3300, 0xffcc00, 0xff9900]
    for (let i = 0; i < 15; i++) {
      const color = meteorColors[Math.floor(Math.random() * meteorColors.length)]
      const meteorMat = new THREE.MeshBasicMaterial({ color })
      const meteor = new THREE.Mesh(meteorGeom, meteorMat)
      meteor.position.set((Math.random() - 0.5) * 20, Math.random() * 10 + 5, (Math.random() - 0.5) * 20)
      meteor.userData = {
        speed: 0.02 + Math.random() * 0.08,
        direction: new THREE.Vector3((Math.random() - 0.5) * 0.3, -1, (Math.random() - 0.5) * 0.3).normalize(),
      }
      scene.add(meteor)
      meteors.push(meteor)
    }

    camera.position.z = 6

    let animationId: number
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      stars.rotation.y += 0.0001
      stars.rotation.x += 0.00005
      for (const meteor of meteors) {
        meteor.position.add(meteor.userData.direction.clone().multiplyScalar(meteor.userData.speed))
        if (meteor.position.y < -5) {
          meteor.position.set((Math.random() - 0.5) * 20, Math.random() * 10 + 5, (Math.random() - 0.5) * 20)
          meteor.userData.speed = 0.02 + Math.random() * 0.08
          meteor.userData.direction.set((Math.random() - 0.5) * 0.3, -1, (Math.random() - 0.5) * 0.3).normalize()
        }
      }
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(animationId)
      if (canvas2Ref.current?.contains(renderer.domElement)) {
        canvas2Ref.current.removeChild(renderer.domElement)
      }
    }
  }, [])

  useEffect(() => {
    if (!canvas3Ref.current) return
    const canvas = document.createElement("canvas")
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const ctx = canvas.getContext("2d")!
    canvas3Ref.current.appendChild(canvas)

    const platforms = [
      { name: "TikTok", color: "#000000", text: "♪", bg: "#ff0050" },
      { name: "Instagram", color: "#E1306C", text: "📷", bg: "#feda75" },
      { name: "YouTube", color: "#FF0000", text: "▶", bg: "#ffffff" },
    ]

    interface Particle {
      x: number
      y: number
      vx: number
      vy: number
      life: number
      maxLife: number
      color: string
      size: number
    }

    let particles: Particle[] = []
    let currentPlatformIndex = 0
    let iconPhase: "grow" | "hold" | "explode" = "grow"
    let phaseStartTime = performance.now()
    const iconMaxScale = 80
    const iconX = canvas.width / 2
    const iconY = canvas.height / 2

    const animate = (timestamp: number) => {
      const elapsed = (timestamp - phaseStartTime) / 1000
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.life--
        if (p.life <= 0) { particles.splice(i, 1); continue }
        const alpha = p.life / p.maxLife
        ctx.globalAlpha = alpha
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      const platform = platforms[currentPlatformIndex]
      const safeScale = Math.max(0, Math.min(iconMaxScale, elapsed * 40))

      if (iconPhase === "grow") {
        ctx.fillStyle = platform.bg
        ctx.beginPath()
        ctx.arc(iconX, iconY, safeScale, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = platform.color
        ctx.font = `${safeScale * 1.2}px Arial`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(platform.text, iconX, iconY)
        if (safeScale >= iconMaxScale) { iconPhase = "hold"; phaseStartTime = timestamp }
      } else if (iconPhase === "hold") {
        ctx.fillStyle = platform.bg
        ctx.beginPath()
        ctx.arc(iconX, iconY, iconMaxScale, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = platform.color
        ctx.font = `${iconMaxScale * 1.2}px Arial`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(platform.text, iconX, iconY)
        if (elapsed >= 1) {
          iconPhase = "explode"; phaseStartTime = timestamp
          const count = 80
          for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count
            const speed = 2 + Math.random() * 6
            particles.push({
              x: iconX, y: iconY,
              vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
              life: 30 + Math.random() * 30, maxLife: 60,
              color: platform.bg, size: 2 + Math.random() * 6,
            })
          }
          currentPlatformIndex++
          if (currentPlatformIndex >= platforms.length) currentPlatformIndex = 0
          iconPhase = "grow"
          phaseStartTime = timestamp
        }
      }
      requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)

    return () => {
      if (canvas3Ref.current?.contains(canvas)) canvas3Ref.current.removeChild(canvas)
    }
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      setAnimIndex((prev) => (prev + 1) % durations.length)
    }, durations[animIndex])
    return () => clearTimeout(timeout)
  }, [animIndex])

  return (
    <section id="beranda" className="relative h-screen flex items-center justify-center overflow-hidden">
      <div ref={canvas1Ref} className="absolute inset-0 z-0 transition-opacity duration-1000" style={{ opacity: animIndex === 0 ? 1 : 0 }} />
      <div ref={canvas2Ref} className="absolute inset-0 z-0 transition-opacity duration-1000" style={{ opacity: animIndex === 1 ? 1 : 0 }} />
      <div ref={canvas3Ref} className="absolute inset-0 z-0 transition-opacity duration-1000" style={{ opacity: animIndex === 2 ? 1 : 0 }} />
      
      {/* Glassmorphism Container */}
      <div className="relative z-10 text-center px-4 py-8 rounded-3xl backdrop-blur-md bg-white/10 dark:bg-black/20 border border-white/20 shadow-2xl max-w-3xl mx-auto">
        <h1 className="font-heading text-5xl md:text-7xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent drop-shadow-lg">
          Dominasi Media Sosialmu dengan Exha Wave
        </h1>
        <p className="text-lg md:text-xl text-gray-100 max-w-2xl mx-auto mb-4">
          Solusi all-in-one untuk meningkatkan engagement. Dari TikTok hingga YouTube, kami hadir dengan layanan yang cepat, aman, dan terjangkau.
        </p>
        <p className="text-md text-gray-300 mb-8">
          Ribuan pelanggan telah membuktikan. Sekarang giliranmu!
        </p>
        <div className="flex justify-center gap-4">
          <a href="#layanan" className="ripple inline-block bg-primary text-white px-8 py-3 rounded-full font-semibold text-lg hover:bg-primary/80 transition shadow-lg">
            Lihat Layanan
          </a>
          <a href="https://api.whatsapp.com/send/?phone=6285799428700&text&type=phone_number&app_absent=0" target="_blank" className="ripple inline-block bg-green-500 text-white px-8 py-3 rounded-full font-semibold text-lg hover:bg-green-600 transition shadow-lg">
            Hubungi WhatsApp
          </a>
        </div>
      </div>
    </section>
  )
}