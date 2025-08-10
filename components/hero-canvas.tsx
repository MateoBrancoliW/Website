"use client"

import { Canvas, useFrame } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import * as THREE from "three"

function ParticleField({ count = 1600, radius = 2.2 }: { count?: number; radius?: number }) {
  const pointsRef = useRef<THREE.Points>(null)

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = radius * Math.cbrt(Math.random())
      const u = Math.random()
      const v = Math.random()
      const theta = 2 * Math.PI * u
      const phi = Math.acos(2 * v - 1)
      const x = r * Math.sin(phi) * Math.cos(theta)
      const y = r * Math.sin(phi) * Math.sin(theta)
      const z = r * Math.cos(phi)
      arr.set([x, y, z], i * 3)
    }
    return arr
  }, [count, radius])

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.06
      pointsRef.current.rotation.x += delta * 0.015
    }

    // Example: drive a locator from the render loop with NDC
    // const t = performance.now() * 0.001
    // const x = Math.sin(t * 0.7) * 0.6
    // const y = Math.cos(t * 0.9) * 0.4
    // window.dispatchEvent(new CustomEvent("locators:update", { detail: { id: "project-two", ndc: { x, y } } }))
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach={"attributes-position"} count={positions.length / 3} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.014} sizeAttenuation color={"#111111"} opacity={0.85} transparent />
    </points>
  )
}

export function HeroCanvas() {
  return (
    <Canvas
      className="absolute inset-0 rounded-2xl"
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 5], fov: 50 }}
      gl={{ antialias: true }}
    >
      <ambientLight intensity={0.6} />
      <ParticleField />
    </Canvas>
  )
}
