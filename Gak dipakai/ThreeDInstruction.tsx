"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

export default function ThreeDInstruction({ orderId, paymentDetails, onFinish }: { orderId: string; paymentDetails: any; onFinish: () => void }) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [canFinish, setCanFinish] = useState(false)

  useEffect(() => {
    if (!mountRef.current) return
    // Setup scene
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, mountRef.current.clientWidth / 300, 0.1, 1000)
    camera.position.z = 5
    const renderer = new THREE.WebGLRenderer({ alpha: true })
    renderer.setSize(mountRef.current.clientWidth, 300)
    renderer.setClearColor(0x000000, 0)
    mountRef.current.appendChild(renderer.domElement)

    // Lighting
    const light = new THREE.AmbientLight(0xffffff, 0.8)
    scene.add(light)
    const dirLight = new THREE.DirectionalLight(0x0066FF, 0.6)
    dirLight.position.set(0, 0, 10)
    scene.add(dirLight)

    // Load logo texture (ganti dengan logo Exha Wave)
    const textureLoader = new THREE.TextureLoader()
    const logoTexture = textureLoader.load("/logo.png") // pastikan file ada
    const geometry = new THREE.PlaneGeometry(2, 2)
    const material = new THREE.MeshStandardMaterial({ map: logoTexture, transparent: true, side: THREE.DoubleSide })
    const logo = new THREE.Mesh(geometry, material)
    scene.add(logo)

    // Particles
    const particlesGeometry = new THREE.BufferGeometry()
    const particlesCount = 200
    const posArray = new Float32Array(particlesCount * 3)
    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 10
    }
    particlesGeometry.setAttribute("position", new THREE.BufferAttribute(posArray, 3))
    const particlesMaterial = new THREE.PointsMaterial({ size: 0.02, color: 0x00E5FF })
    const particles = new THREE.Points(particlesGeometry, particlesMaterial)
    scene.add(particles)

    // Animation loop
    let animationId: number
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      logo.rotation.y += 0.005
      logo.rotation.x += 0.002
      particles.rotation.y += 0.001
      renderer.render(scene, camera)
    }
    animate()

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId)
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement)
      }
    }
  }, [])

  // Timer 10 detik
  useEffect(() => {
    const timer = setTimeout(() => setCanFinish(true), 10000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="text-center">
      <div ref={mountRef} className="w-full h-[300px] mb-4" />
      <h2 className="font-heading text-xl font-bold mb-2">Pesanan Berhasil Dibuat</h2>
      <p className="text-sm mb-1">Order ID: {orderId}</p>
      <div className="bg-card p-4 rounded-xl border max-w-sm mx-auto mb-4">
        <p className="font-semibold mb-2">Instruksi Pembayaran</p>
        {/* Tampilkan detail sesuai paymentDetails */}
        {paymentDetails?.accountNumber && <p>Nomor Rekening: {paymentDetails.accountNumber}</p>}
        {paymentDetails?.qrCode && <img src={paymentDetails.qrCode} alt="QR Code" className="mx-auto my-2 w-48" />}
        <p className="text-xs text-gray-500 mt-2">Silakan lakukan pembayaran sesuai metode yang dipilih. Admin akan memverifikasi pesanan Anda.</p>
      </div>
      <button
        onClick={onFinish}
        disabled={!canFinish}
        className={`px-6 py-2 rounded-full font-semibold ${canFinish ? "bg-primary text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
      >
        {canFinish ? "Selesai" : "Tunggu 10 detik..."}
      </button>
    </div>
  )
}