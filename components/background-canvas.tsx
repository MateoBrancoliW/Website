"use client"

import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { useMemo, useRef } from "react"
import type * as THREE from "three"

// Minimal particle field for ambience; replace with your own renderer later.
function ParticleField({ count = 2000, radius = 2.4 }: { count?: number; radius?: number }) {
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
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.014} sizeAttenuation color="#101010" opacity={0.85} transparent />
    </points>
  )
}

export function BackgroundCanvas() {
  return (
    <div
      aria-hidden="false"
      className="pointer-events-auto fixed inset-0 z-0 bg-white"
      // You can swap this out for your own renderer root node later.
    >
      <Canvas
        className="absolute inset-0"
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ antialias: true }}
      >
        <ambientLight intensity={0.6} />
        <ParticleField />

        {/* CAD-like orbit with a horizon clamp so you never rotate under the scene */}
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.06}
          // Horizon clamp: never tilt below ground
          minPolarAngle={0.02}
          maxPolarAngle={Math.PI * 0.5 - 0.05}
          // Optional zoom guard-rails for readability
          minDistance={2.5}
          maxDistance={8}
          enablePan={false}
          // Leave autoRotate off since your scene is already rotating;
          // turn on if you want camera rotation instead of scene rotation.
          autoRotate={false}
          rotateSpeed={0.6}
          zoomSpeed={0.8}
        />
      </Canvas>

      {/* Readability gradient at top/bottom; remove if not needed */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/70 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/70 to-transparent" />
    </div>
  )
}
