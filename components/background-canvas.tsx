"use client"

import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber"
import { useEffect, useMemo, useRef, useState } from "react"
import * as THREE from "three"
import { projects } from "@/content/projects"
import { featuredModels, type FeaturedModel } from "@/lib/featured-models"
import { updateLocatorFromObject } from "@/lib/locator-bridge"
import { useOverlayNav } from "./use-overlay-nav"

// ──────────────────────────────────────────────────────────────────────────────
// Tunables (Mateo's chosen values)
// ──────────────────────────────────────────────────────────────────────────────
const DOT_COUNT = 1700
// Sphere scaled further so dots have real depth: at world radius 5.5 and
// camera at z=5, dots near the front of the sphere pass *very* close to the
// camera (distance ~0.5 unit → much larger on screen) while back-of-sphere
// dots are ~10× farther — strong "diving in/out of the page" sensation.
const DOT_RADIUS = 5.5
// Larger base size so perspective makes the dot-size range much more
// noticeable. sizeAttenuation is true on the material so this scales by
// distance automatically.
const DOT_SIZE = 0.05
const DOT_OPACITY = 0.7
// World rotation bumped up so the shared sphere motion is clearly visible —
// meshes are children of the same group, so this is what makes them "travel
// with the dots". X kept at ~1/4 of Y for the same lazy tumble as before.
const ROTATION_SPEED_Y = 0.12
const ROTATION_SPEED_X = 0.03
// Horizontal offset of the entire 3D assembly (dots + meshes) in world units.
// Negative pushes it left in screen space. With camera at z=5 + fov=50, one
// "viewport width" at z=0 is ~4.66 world units, so -1.4 lands the sphere
// centered around the left ~25% of the viewport. Locator bridge uses
// getWorldPosition() so the project markers follow this offset automatically.
const WORLD_OFFSET_X = -1.4
// 13 mesh slots: index 0 is the about-me mesh, 1-12 are projects (10 real +
// 2 placeholders). Keep in sync with `projects` and `featuredModels`.
const FEATURED_COUNT = 13
// The slug we treat as "open AboutDialog" instead of "open ProjectDialog".
// Also drives where the onboarding hint pulse is pinned.
export const ABOUT_MESH_SLUG = "about-me"
// Mesh base scale bumped to keep their on-screen size proportional to the
// larger sphere; perspective makes them feel even more dynamic.
const FEATURED_BASE_SCALE = 0.24
// Breathing pulse: gentle scale wobble. Frequency is set inline below (slow,
// ~12s per breath); amplitude controls how much each mesh swells.
const PULSE_AMOUNT = 0.07
const PULSE_FREQ = 0.5 // radians/sec → ~12.5s per full breath cycle
const HOVER_SCALE_MAX = 1.9
const HOVER_LERP_SPEED = 8
// Spin rates. Idle is slow — meshes turn lazily on their own axes so they
// always feel alive without demanding attention. Hover spins them up fast for
// a clear "you're targeting this one" response, but kept below the original
// 3.2 chaos so it stays inspectable.
const IDLE_SPIN_RATE = 0.35
const HOVER_SPIN_RATE = 2.4

// Per-mesh drift around the slot anchor. Kept *small* relative to the world
// rotation — drift is a subtle shimmer on top of the shared dot motion, not a
// separate trajectory that makes meshes look detached from the dot field.
const DRIFT_AMPLITUDE = 0.06
const DRIFT_SPEED = 0.3

// ──────────────────────────────────────────────────────────────────────────────
// Background dot field
// ──────────────────────────────────────────────────────────────────────────────
function DotField({
  count = DOT_COUNT,
  radius = DOT_RADIUS,
}: {
  count?: number
  radius?: number
}) {
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = radius * Math.cbrt(Math.random())
      const u = Math.random()
      const v = Math.random()
      const theta = 2 * Math.PI * u
      const phi = Math.acos(2 * v - 1)
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      arr[i * 3 + 2] = r * Math.cos(phi)
    }
    return arr
  }, [count, radius])

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={DOT_SIZE}
        sizeAttenuation
        color="#101010"
        opacity={DOT_OPACITY}
        transparent
      />
    </points>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// One featured mesh
// ──────────────────────────────────────────────────────────────────────────────
type DriftParams = {
  // Three independent sine waves give a Lissajous-like float without ever
  // repeating exactly — visually reads as random gentle motion.
  fx: number; fy: number; fz: number
  px: number; py: number; pz: number
  ax: number; ay: number; az: number  // per-axis amplitude in [0, 1]
}

type FeaturedMeshProps = {
  anchor: THREE.Vector3
  spinAxis: THREE.Vector3
  phase: number
  drift: DriftParams
  model: FeaturedModel
  locatorId: string
  onSelect: () => void
}

function FeaturedMesh({
  anchor,
  spinAxis,
  phase,
  drift,
  model,
  locatorId,
  onSelect,
}: FeaturedMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const hoverTRef = useRef(0) // eased 0..1
  const { camera } = useThree()

  // Reset body cursor on unmount so a stale "pointer" doesn't linger.
  useEffect(() => () => {
    document.body.style.cursor = ""
  }, [])

  const geometry = useMemo(() => buildGeometry(model), [model])
  const material = useMemo(() => buildMaterial(model), [model])

  useFrame((_, dt) => {
    const mesh = meshRef.current
    if (!mesh) return

    // Pulse (idle breathing) + hover scale
    const t = performance.now() * 0.001
    const target = hovered ? 1 : 0
    hoverTRef.current += (target - hoverTRef.current) * Math.min(1, dt * HOVER_LERP_SPEED)
    const pulse = 1 + Math.sin(t * PULSE_FREQ + phase) * PULSE_AMOUNT
    const hoverScale = 1 + hoverTRef.current * (HOVER_SCALE_MAX - 1)
    mesh.scale.setScalar(pulse * hoverScale)

    // Drift around the slot anchor. Each axis has its own frequency, phase
    // and amplitude scaler, so no two meshes share a trajectory.
    const ts = t * DRIFT_SPEED
    mesh.position.set(
      anchor.x + Math.sin(ts * drift.fx + drift.px) * DRIFT_AMPLITUDE * drift.ax,
      anchor.y + Math.sin(ts * drift.fy + drift.py) * DRIFT_AMPLITUDE * drift.ay,
      anchor.z + Math.sin(ts * drift.fz + drift.pz) * DRIFT_AMPLITUDE * drift.az,
    )

    // Spin — interpolates from IDLE (fast) toward HOVER (slow) as the user
    // points at this mesh, so it settles into a readable rotation while hovered.
    const spinRate = IDLE_SPIN_RATE + hoverTRef.current * (HOVER_SPIN_RATE - IDLE_SPIN_RATE)
    mesh.rotateOnAxis(spinAxis, dt * spinRate)

    // Pin the DOM locator (project label) to this mesh's screen position
    updateLocatorFromObject(camera, mesh, locatorId)
  })

  function handlePointerOver(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation()
    setHovered(true)
    document.body.style.cursor = "pointer"
    // Broadcast: this mesh is hovered. Locator overlay shows preview;
    // signifier overlay fades itself out on the first such event.
    window.dispatchEvent(
      new CustomEvent("locators:hover", { detail: { id: locatorId } }),
    )
  }
  function handlePointerOut(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation()
    setHovered(false)
    document.body.style.cursor = ""
    window.dispatchEvent(
      new CustomEvent("locators:hover", { detail: { id: null } }),
    )
  }
  function handleClick(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation()
    onSelect()
  }

  return (
    <mesh
      ref={meshRef}
      // Initial position only — useFrame mutates mesh.position each frame
      // to apply the per-axis drift around the anchor.
      position={anchor}
      geometry={geometry}
      material={material}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    />
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Featured-mesh layout & helpers
// ──────────────────────────────────────────────────────────────────────────────
type Slot = {
  anchor: THREE.Vector3
  spinAxis: THREE.Vector3
  phase: number
  drift: DriftParams
}

/**
 * Deterministic Fibonacci-sphere layout with a small stable jitter,
 * so positions are consistent across reloads (no flicker, no SSR mismatch).
 * Each slot also carries unique drift parameters so the mesh swims around
 * its anchor on a Lissajous-style path that never repeats exactly.
 */
function layoutFeaturedSlots(count: number): Slot[] {
  const golden = Math.PI * (3 - Math.sqrt(5))
  const slots: Slot[] = []
  for (let i = 0; i < count; i++) {
    // Seeded pseudo-random — same input always returns the same output
    const seed = (n: number) => {
      const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453
      return x - Math.floor(x)
    }
    const y = 1 - (i / Math.max(1, count - 1)) * 2 // -1..1
    const rad = Math.sqrt(1 - y * y)
    const th = golden * i
    // Mesh orbit radius — sized so meshes pass near the camera and recede
    // deep behind origin as the sphere rotates. Combined with the larger
    // DOT_RADIUS, the dots remain a "field" around them.
    const jitterR = 2.7 + seed(0) * 1.0
    const anchor = new THREE.Vector3(
      Math.cos(th) * rad * jitterR + (seed(1) - 0.5) * 0.15,
      y * jitterR + (seed(2) - 0.5) * 0.15,
      Math.sin(th) * rad * jitterR + (seed(3) - 0.5) * 0.15,
    )
    const spinAxis = new THREE.Vector3(
      seed(4) - 0.5,
      seed(5) - 0.5,
      seed(6) - 0.5,
    ).normalize()
    const phase = seed(7) * Math.PI * 2
    const drift: DriftParams = {
      // Frequencies kept near 1 so motion stays mellow; ±0.5 spread keeps
      // each mesh on its own clock.
      fx: 0.6 + seed(8) * 0.9,
      fy: 0.6 + seed(9) * 0.9,
      fz: 0.6 + seed(10) * 0.9,
      px: seed(11) * Math.PI * 2,
      py: seed(12) * Math.PI * 2,
      pz: seed(13) * Math.PI * 2,
      // Amplitude per axis (0.4–1.0 of DRIFT_AMPLITUDE) — some meshes float
      // wider than others.
      ax: 0.4 + seed(14) * 0.6,
      ay: 0.4 + seed(15) * 0.6,
      az: 0.4 + seed(16) * 0.6,
    }
    slots.push({ anchor, spinAxis, phase, drift })
  }
  return slots
}

function buildGeometry(model: FeaturedModel): THREE.BufferGeometry {
  const s = FEATURED_BASE_SCALE * model.scale
  if (model.kind === "geom") {
    switch (model.shape) {
      case "icosa":
        return new THREE.IcosahedronGeometry(s, 0)
      case "octa":
        return new THREE.OctahedronGeometry(s, 0)
      case "dodeca":
        return new THREE.DodecahedronGeometry(s, 0)
      case "tetra":
        return new THREE.TetrahedronGeometry(s, 0)
      case "knot":
        return new THREE.TorusKnotGeometry(s * 0.7, s * 0.22, 80, 12)
      case "torus":
        return new THREE.TorusGeometry(s * 0.75, s * 0.28, 14, 28)
      default:
        return new THREE.IcosahedronGeometry(s, 0)
    }
  }
  // kind === "stl": placeholder until STL loading is wired in.
  // To enable: load with three's STLLoader on the client (e.g. via useLoader)
  // and pass the resulting BufferGeometry here. For now we draw a small sphere
  // so an unconfigured slot still renders.
  return new THREE.SphereGeometry(s, 16, 12)
}

function buildMaterial(model: FeaturedModel): THREE.Material {
  if (model.materialVariant === "wire") {
    return new THREE.MeshBasicMaterial({ color: "#171717", wireframe: true })
  }
  return new THREE.MeshStandardMaterial({
    color: "#171717",
    roughness: 0.35,
    metalness: 0.05,
    flatShading: true,
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// Scene root (rotates as a unit)
// ──────────────────────────────────────────────────────────────────────────────
function Scene({
  onProjectOpen,
  onAboutOpen,
}: {
  onProjectOpen: (slug: string) => void
  onAboutOpen: () => void
}) {
  const worldRef = useRef<THREE.Group>(null)
  const slots = useMemo(() => layoutFeaturedSlots(FEATURED_COUNT), [])

  useFrame((_, dt) => {
    if (worldRef.current) {
      worldRef.current.rotation.y += dt * ROTATION_SPEED_Y
      worldRef.current.rotation.x += dt * ROTATION_SPEED_X
    }
  })

  return (
    <group ref={worldRef} position={[WORLD_OFFSET_X, 0, 0]}>
      <DotField />
      {slots.map((slot, i) => {
        const project = projects[i]
        const model = featuredModels[i]
        if (!project || !model) return null
        const isAbout = project.slug === ABOUT_MESH_SLUG
        return (
          <FeaturedMesh
            key={project.slug}
            anchor={slot.anchor}
            spinAxis={slot.spinAxis}
            phase={slot.phase}
            drift={slot.drift}
            model={model}
            locatorId={project.slug}
            onSelect={() => {
              if (isAbout) {
                // Tell the onboarding hint it can disappear now — the user
                // has discovered (and clicked) the About mesh.
                window.dispatchEvent(new CustomEvent("about:hint-dismissed"))
                onAboutOpen()
              } else {
                onProjectOpen(project.slug)
              }
            }}
          />
        )
      })}
    </group>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Public wrapper — mounts the Canvas, provides lights, bridges context
// ──────────────────────────────────────────────────────────────────────────────
export function BackgroundCanvas() {
  const { openProject, openAbout } = useOverlayNav()

  return (
    // `absolute` (not `fixed`) on purpose: the canvas needs to live in the
    // SAME stacking context as <HeroNameTag /> so the latter's
    // `mix-blend-difference` can blend against the WebGL output. The
    // viewport-fill responsibility moves up to the isolation parent in
    // `app/page.tsx`.
    <div aria-hidden="false" className="pointer-events-auto absolute inset-0 bg-white">
      <Canvas
        className="absolute inset-0"
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ antialias: true }}
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[2.5, 3, 4]} intensity={0.9} />
        <directionalLight position={[-3, -1, -2]} intensity={0.35} />
        <Scene onProjectOpen={openProject} onAboutOpen={openAbout} />
      </Canvas>

      {/* Top/bottom readability gradients removed — they read as faint
          horizontal lines on a white background and the chrome (Contact /
          ©2027 / MBW) reads fine on its own thanks to mix-blend-difference. */}
    </div>
  )
}
