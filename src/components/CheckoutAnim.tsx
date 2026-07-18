"use client"
import { Canvas, useFrame } from "@react-three/fiber"
import { Float, Sparkles } from "@react-three/drei"
import { useRef } from "react"
import * as THREE from "three"

function Logo3D() {
  const meshRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.02
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += 0.01
      ringRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2) * 0.05)
    }
  })

  return (
    <>
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
        <mesh ref={meshRef} position={[0, 0, 0]}>
          <boxGeometry args={[1.5, 1.5, 0.3]} />
          <meshStandardMaterial color="#0066FF" roughness={0.2} metalness={0.8} />
        </mesh>
      </Float>
      <mesh ref={ringRef} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.2, 0.05, 16, 100]} />
        <meshStandardMaterial color="#00E5FF" emissive="#00E5FF" emissiveIntensity={0.5} roughness={0.1} metalness={0.9} />
      </mesh>
      <Sparkles count={50} scale={3} size={3} speed={0.3} color="#00E5FF" />
    </>
  )
}

export default function CheckoutAnim() {
  return (
    <div className="h-48">
      <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -5, -10]} intensity={0.5} color="#0066FF" />
        <Logo3D />
      </Canvas>
    </div>
  )
}