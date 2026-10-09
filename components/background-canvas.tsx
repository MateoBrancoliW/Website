"use client"

import { Canvas, useFrame, useLoader, useThree, type ThreeEvent } from "@react-three/fiber"
import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import * as THREE from "three"
import { STLLoader } from "three/examples/jsm/loaders/STLLoader"
import { useGLTF } from "@react-three/drei"
import { projects } from "@/content/projects"
import { featuredModels, type FeaturedModel } from "@/lib/featured-models"
import { updateLocatorFromObject } from "@/lib/locator-bridge"
import { useOverlayNav } from "./use-overlay-nav"
import { useDevTheme, randomMeshColor, type BlendOverride } from "./dev-theme"

// ──────────────────────────────────────────────────────────────────────────────
// Tunables
// ──────────────────────────────────────────────────────────────────────────────
// Many scene parameters (dot count/size/opacity/radius, rotation speeds, mesh
// base scale, world offset, blend-mode override) now live in the dev theme —
// see `components/dev-theme.tsx`. The defaults there match what we used to
// hard-code here. Tinker live in dev with the ⚙ Dev panel (top-left).
//
// The constants below are the *non-tunable* ones — either too noisy or too
// structural to expose as sliders right now.

// Render one mesh per featuredModels row. If projects[] is shorter (e.g. you
// dropped in a new STL row without adding a matching project yet), the extra
// slots get a synthesized placeholder project so the mesh still renders and
// is clickable — see `projectForSlot`. This makes "add an STL" a one-line
// change in featured-models.ts.
const FEATURED_COUNT = featuredModels.length

/** projects[i] if present, otherwise a synthesized placeholder. */
function projectForSlot(i: number) {
  const p = projects[i]
  if (p) return p
  return {
    slug: `mesh-${i}`,
    title: `Untitled mesh ${i}`,
    excerpt: "No project entry yet — add one in content/projects.ts.",
    content: [
      "This mesh has a model in `lib/featured-models.ts` but no matching",
      "entry in `content/projects.ts`. Add one at the same index to give it",
      "a real title and write-up.",
    ],
  } as (typeof projects)[number]
}

if (process.env.NODE_ENV !== "production") {
  if (projects.length < featuredModels.length) {
    // eslint-disable-next-line no-console
    console.warn(
      `[BackgroundCanvas] ${featuredModels.length} meshes but only ` +
        `${projects.length} projects — slots ${projects.length}…` +
        `${featuredModels.length - 1} use placeholder project data. Add ` +
        `matching entries in content/projects.ts to give them real content.`,
    )
  }
}

// The slug we treat as "open AboutDialog" instead of "open ProjectDialog".
// Also drives where the onboarding hint pulse is pinned.
export const ABOUT_MESH_SLUG = "about-me"

// Hover-engage buffer: hovering a mesh "arms" it for this long. A click near
// the armed mesh's current screen position within the window opens it — even
// if the (small / pulsing / drifting) mesh has moved off the cursor.
const ENGAGE_MS = 2500
// "Near" radius in NDC units (clip space is -1..1, so 2 = full viewport
// width). 0.18 ≈ 9% of half-width ≈ a forgiving click target around the mesh.
const ENGAGE_NDC_RADIUS = 0.18

// Reused scratch vector so the per-frame NDC projection doesn't allocate.
const _ndcScratch = new THREE.Vector3()

// Engagement controller — shared down to each mesh shell + read by the
// Canvas's onPointerMissed handler.
type Engagement = {
  arm: (slug: string, action: () => void) => void
  reportNdc: (slug: string, x: number, y: number) => void
}
// Breathing pulse: gentle scale wobble. Frequency is set inline below (slow,
// ~12s per breath); amplitude controls how much each mesh swells.
const PULSE_AMOUNT = 0.07
const PULSE_FREQ = 0.5 // radians/sec → ~12.5s per full breath cycle
const HOVER_SCALE_MAX = 1.9
const HOVER_LERP_SPEED = 8
// Spin rates. Idle is slow — meshes turn lazily on their own axes. Hover
// ramps them up to grab attention but stays below the original 3.2 chaos.
const IDLE_SPIN_RATE = 0.35
// Hovered spin — eased down a bit so a hovered mesh turns at a calmer,
// more inspectable pace (was 2.4).
const HOVER_SPIN_RATE = 1.5

// Per-mesh drift around the slot anchor. Kept *small* relative to the world
// rotation — drift is a subtle shimmer on top of the shared dot motion.
const DRIFT_AMPLITUDE = 0.06
const DRIFT_SPEED = 0.3

// Entrance animation. Every mesh (procedural or loaded) grows in from zero
// instead of popping into existence the frame its file finishes loading.
// Meshes are staggered by slot index so they arrive as a gentle cascade even
// when all the files land at once.
const APPEAR_DURATION = 0.9 // seconds
const APPEAR_STAGGER = 0.08 // seconds between consecutive slots

// Time (s) the first featured mesh rendered. Stagger delays are measured from
// here, so a model that finishes loading late appears right away instead of
// waiting out its full stagger again.
let sceneT0: number | null = null

/** easeOutBack — overshoots slightly, then settles. */
function easeOutBack(x: number) {
  const c1 = 1.4
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2)
}

// Kick off every model download as soon as this module loads (client only),
// in parallel, rather than one-by-one as each mesh component mounts.
if (typeof window !== "undefined") {
  for (const m of featuredModels) {
    if (m.kind === "glb") useGLTF.preload(m.path)
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Background dot field
// ──────────────────────────────────────────────────────────────────────────────
function DotField() {
  const { dotCount, dotSize, dotOpacity, dotRadius } = useDevTheme()

  const positions = useMemo(() => {
    const arr = new Float32Array(dotCount * 3)
    for (let i = 0; i < dotCount; i++) {
      const r = dotRadius * Math.cbrt(Math.random())
      const u = Math.random()
      const v = Math.random()
      const theta = 2 * Math.PI * u
      const phi = Math.acos(2 * v - 1)
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      arr[i * 3 + 2] = r * Math.cos(phi)
    }
    return arr
  }, [dotCount, dotRadius])

  return (
    <points>
      {/* `key={dotCount}` forces React to discard and recreate the buffer
          when the array length changes — otherwise the GPU buffer would be
          out of sync with the JS array and you'd see stale dots. */}
      <bufferGeometry key={dotCount}>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={dotSize}
        sizeAttenuation
        color="#101010"
        opacity={dotOpacity}
        transparent
      />
    </points>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Featured-mesh architecture
//
// React's hooks-can't-be-conditional rule meant we couldn't call useLoader
// only-when-this-mesh-is-STL inside a single FeaturedMesh component. Earlier
// the workaround was calling useLoader unconditionally with a fallback path —
// hacky and wasted a network request per geom-mesh.
//
// The clean architecture:
//   • <FeaturedMeshShell>  → owns ALL the animation/interaction logic and
//                            renders the actual <mesh>. Takes geometry as a
//                            prop. Knows nothing about how the geometry was
//                            built.
//   • <GeomFeaturedMesh>   → builds procedural geometry synchronously via
//                            buildGeometry(), then renders the shell.
//   • <STLFeaturedMesh>    → calls useLoader(STLLoader, model.path), clones
//                            the loaded geometry (so multiple instances of
//                            the same file don't share state), normalizes
//                            (bbox → uniform scale → center → vertex
//                            normals), then renders the shell.
//
//   • <GLBFeaturedMesh>    → same, for optimized .glb files from `pnpm models`
//                            (the default — see lib/featured-models.ts).
//
// Scene picks the right one by `model.kind`. Loaded
// instances are wrapped individually in <Suspense> so one slow STL doesn't
// block other meshes from rendering.
// ──────────────────────────────────────────────────────────────────────────────

type DriftParams = {
  // Three independent sine waves give a Lissajous-like float without ever
  // repeating exactly — visually reads as random gentle motion.
  fx: number; fy: number; fz: number
  px: number; py: number; pz: number
  ax: number; ay: number; az: number  // per-axis amplitude in [0, 1]
}

type SharedMeshProps = {
  anchor: THREE.Vector3
  spinAxis: THREE.Vector3
  phase: number
  drift: DriftParams
  model: FeaturedModel
  locatorId: string
  onSelect: () => void
  baseScale: number
  blendOverride: BlendOverride
  colorOverride: string
  opacity: number
  engagement: Engagement
  /** This slot's place in the entrance cascade, in seconds after the first mesh. */
  appearDelay: number
}

type ShellProps = SharedMeshProps & {
  geometry: THREE.BufferGeometry
}

// ─── Shell — animation + interaction logic, geometry passed in ──────────────
function FeaturedMeshShell({
  anchor,
  spinAxis,
  phase,
  drift,
  model,
  locatorId,
  onSelect,
  blendOverride,
  colorOverride,
  opacity,
  geometry,
  engagement,
  appearDelay,
}: ShellProps) {
  const groupRef = useRef<THREE.Group>(null) // drift + pulse/hover scale
  const meshRef = useRef<THREE.Mesh>(null) // visible mesh; spins
  const [hovered, setHovered] = useState(false)
  const hoverTRef = useRef(0) // eased 0..1
  const appearStartRef = useRef<number | null>(null) // clock time of first frame
  const { camera } = useThree()

  // Reset body cursor on unmount so a stale "pointer" doesn't linger.
  useEffect(() => () => {
    document.body.style.cursor = ""
  }, [])

  const material = useMemo(
    () => buildMaterial(model, blendOverride, colorOverride, opacity),
    [model, blendOverride, colorOverride, opacity],
  )

  // Invisible collider radius from the geometry's bounding sphere × margin.
  // The collider is a sphere (rotation-invariant), so it stays a stable click
  // target even while the visible mesh spins fast on hover — and it's bigger
  // than the visible mesh, so small/thin meshes are easy to hit.
  const hitRadius = useMemo(() => {
    geometry.computeBoundingSphere()
    const r = geometry.boundingSphere?.radius ?? 0.3
    // Snug to the mesh (≈0.8× its bounding sphere) so the collider doesn't
    // protrude far past the visible geometry — adjacent meshes stay hoverable.
    // Small floor keeps tiny meshes from becoming un-clickable.
    return Math.max(r * 0.8, 0.25)
  }, [geometry])

  useFrame((_, dt) => {
    const group = groupRef.current
    const mesh = meshRef.current
    if (!group || !mesh) return

    const t = performance.now() * 0.001

    // Entrance: 0 → 1 over APPEAR_DURATION. Starts at the later of "now"
    // (first frame after this mesh mounted / its model loaded) and this
    // slot's place in the cascade.
    if (sceneT0 === null) sceneT0 = t
    if (appearStartRef.current === null) appearStartRef.current = Math.max(t, sceneT0 + appearDelay)
    const appearRaw = (t - appearStartRef.current) / APPEAR_DURATION
    const appear = appearRaw <= 0 ? 0 : appearRaw >= 1 ? 1 : easeOutBack(appearRaw)
    // Hide entirely until the entrance starts (scale 0 can still z-fight).
    group.visible = appearRaw > 0

    // Ease hover 0..1
    const target = hovered ? 1 : 0
    hoverTRef.current += (target - hoverTRef.current) * Math.min(1, dt * HOVER_LERP_SPEED)

    // Pulse (idle breathing) + hover scale applied to the GROUP, so the
    // collider scales with the visible mesh and always wraps it.
    const pulse = 1 + Math.sin(t * PULSE_FREQ + phase) * PULSE_AMOUNT
    const hoverScale = 1 + hoverTRef.current * (HOVER_SCALE_MAX - 1)
    group.scale.setScalar(Math.max(appear, 1e-4) * pulse * hoverScale)

    // Drift the group around the slot anchor.
    const ts = t * DRIFT_SPEED
    group.position.set(
      anchor.x + Math.sin(ts * drift.fx + drift.px) * DRIFT_AMPLITUDE * drift.ax,
      anchor.y + Math.sin(ts * drift.fy + drift.py) * DRIFT_AMPLITUDE * drift.ay,
      anchor.z + Math.sin(ts * drift.fz + drift.pz) * DRIFT_AMPLITUDE * drift.az,
    )

    // Spin only the visible mesh (collider sphere is rotation-invariant).
    const spinRate = IDLE_SPIN_RATE + hoverTRef.current * (HOVER_SPIN_RATE - IDLE_SPIN_RATE)
    mesh.rotateOnAxis(spinAxis, dt * spinRate)

    // Pin the DOM locator to the group's screen position.
    updateLocatorFromObject(camera, group, locatorId)

    // Report screen position (NDC) for the engagement near-click.
    group.getWorldPosition(_ndcScratch)
    _ndcScratch.project(camera)
    engagement.reportNdc(locatorId, _ndcScratch.x, _ndcScratch.y)
  })

  function handlePointerOver(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation()
    setHovered(true)
    document.body.style.cursor = "pointer"
    // Arm this mesh: a near-click within ENGAGE_MS will trigger onSelect even
    // if the cursor isn't exactly on the (small/moving) mesh at click time.
    engagement.arm(locatorId, onSelect)
    window.dispatchEvent(new CustomEvent("locators:hover", { detail: { id: locatorId } }))
  }
  function handlePointerOut(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation()
    setHovered(false)
    document.body.style.cursor = ""
    window.dispatchEvent(new CustomEvent("locators:hover", { detail: { id: null } }))
  }
  function handleClick(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation()
    onSelect()
  }

  return (
    <group ref={groupRef} position={anchor}>
      {/* Visible mesh — spins; raycast disabled so all pointer events go to
          the collider below (reliable target even while the mesh spins). */}
      <mesh ref={meshRef} geometry={geometry} material={material} raycast={() => null} />

      {/* Invisible sphere collider — owns hover/click. `colorWrite={false}`
          draws nothing; it's still raycast-able because it stays visible. */}
      <mesh
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <sphereGeometry args={[hitRadius, 12, 12]} />
        <meshBasicMaterial colorWrite={false} depthWrite={false} />
      </mesh>
    </group>
  )
}

// ─── Geom specialization — synchronous procedural geometry ──────────────────
function GeomFeaturedMesh(props: SharedMeshProps) {
  const geometry = useMemo(
    () => buildGeometry(props.model, props.baseScale),
    [props.model, props.baseScale],
  )
  return <FeaturedMeshShell {...props} geometry={geometry} />
}

// ─── Error boundary for STL loading ─────────────────────────────────────────
// `useLoader` throws when the STL fetch fails (e.g. 404 because the file
// isn't in public/models/ yet). <Suspense> only catches *pending* promises
// — for real errors we need a class-component error boundary. Without this,
// a single missing STL kills the entire Canvas tree.
//
// On error, we log which path failed and render nothing for that slot. The
// other meshes are unaffected; the user can drop the missing file into
// public/models/ and refresh.
class STLLoadBoundary extends Component<
  { children: ReactNode; path: string; fallback?: ReactNode },
  { errored: boolean }
> {
  state = { errored: false }
  static getDerivedStateFromError() {
    return { errored: true }
  }
  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.warn(
      `[BackgroundCanvas] model failed to load (check the file exists in ` +
        `public/models/ — run \`pnpm models\` — and the path/case matches): ${this.props.path}`,
      error,
    )
  }
  render() {
    if (this.state.errored) return this.props.fallback ?? null
    return this.props.children
  }
}

// ─── STL specialization — async load via Suspense ───────────────────────────
function STLFeaturedMesh(props: SharedMeshProps) {
  // Narrow the union — this component is only mounted when kind === "stl".
  const stlModel = props.model as Extract<FeaturedModel, { kind: "stl" }>

  // useLoader is cached by URL, so repeated paths share the network fetch.
  // It throws a promise during loading → Suspense in Scene catches it.
  const loaded = useLoader(STLLoader, stlModel.path)

  // Clone before mutating so we don't pollute the cached geometry — other
  // instances loading the same path would otherwise inherit our scale/center
  // mutations. Then normalize: fit the BOUNDING-SPHERE RADIUS to
  // (baseScale * scale).
  //
  // Why bounding sphere (not bounding box max-dim):
  //   • A geom shape like IcosahedronGeometry(r) has bounding-sphere radius
  //     r. Matching STLs to the same sphere radius makes them visually
  //     comparable in screen size regardless of CAD authoring scale.
  //   • Box max-dim normalization makes FLAT objects (e.g. the grating)
  //     paper-thin: dims (100, 100, 1) → (0.32, 0.32, 0.0032). With sphere
  //     normalization the same object lands at ~(0.45, 0.45, 0.0045) — still
  //     thin but actually visible. Drop in any STL with scale: 1 and it
  //     should sit alongside the geom shapes without further tweaking.
  const geometry = useMemo(() => {
    const g = normalizeGeometry(loaded.clone(), props.baseScale * stlModel.scale)
    g.computeVertexNormals()
    return g
  }, [loaded, props.baseScale, stlModel.scale])

  return <FeaturedMeshShell {...props} geometry={geometry} />
}

// ─── GLB specialization — optimized models from `pnpm models` ───────────────
// These are decimated + meshopt-compressed (≈100 KB each vs. 5–25 MB STLs).
// drei's useGLTF decodes meshopt in WASM off the hot path, and every file was
// already requested in parallel by the preload at the top of this module.
function GLBFeaturedMesh(props: SharedMeshProps) {
  const glbModel = props.model as Extract<FeaturedModel, { kind: "glb" }>
  const gltf = useGLTF(glbModel.path)

  const geometry = useMemo(
    () => normalizeGeometry(extractGeometry(gltf.scene), props.baseScale * glbModel.scale),
    [gltf, props.baseScale, glbModel.scale],
  )
  useEffect(() => () => geometry.dispose(), [geometry])

  return <FeaturedMeshShell {...props} geometry={geometry} />
}

/**
 * Pull the first mesh's geometry out of a loaded glTF scene as a plain,
 * float, non-shared BufferGeometry in model space.
 *
 * The optimizer quantizes positions (int16 + a node transform that maps them
 * back to real units), so we read every vertex through `getX/Y/Z` — which
 * de-normalizes — into a fresh Float32Array, then bake the node's world
 * transform in. Without this the shape comes out squashed into a unit cube.
 */
function extractGeometry(root: THREE.Object3D): THREE.BufferGeometry {
  let found: THREE.Mesh | null = null
  root.traverse((o) => {
    if (!found && (o as THREE.Mesh).isMesh) found = o as THREE.Mesh
  })
  const mesh = found as THREE.Mesh | null
  if (!mesh) return new THREE.SphereGeometry(1, 16, 12)

  root.updateMatrixWorld(true)
  const src = mesh.geometry.getAttribute("position")
  const pos = new Float32Array(src.count * 3)
  for (let i = 0; i < src.count; i++) {
    pos[i * 3] = src.getX(i)
    pos[i * 3 + 1] = src.getY(i)
    pos[i * 3 + 2] = src.getZ(i)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3))
  const index = mesh.geometry.getIndex()
  if (index) g.setIndex(index.clone())
  g.applyMatrix4(mesh.matrixWorld)
  return g
}

/**
 * Center a geometry and scale it so its BOUNDING-SPHERE radius equals
 * `targetRadius`. Mutates and returns `g`.
 *
 * Why bounding sphere (not bounding box max-dim):
 *   • A geom shape like IcosahedronGeometry(r) has bounding-sphere radius r.
 *     Matching models to the same sphere radius makes them visually
 *     comparable in screen size regardless of CAD authoring scale.
 *   • Box max-dim normalization makes FLAT objects (e.g. the grating)
 *     paper-thin. With sphere normalization they stay thin but visible.
 */
function normalizeGeometry(g: THREE.BufferGeometry, targetRadius: number) {
  g.center()
  g.computeBoundingSphere()
  const radius = g.boundingSphere?.radius ?? 1
  const norm = targetRadius / Math.max(radius, 1e-6)
  g.scale(norm, norm, norm)
  g.computeBoundingSphere()
  return g
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

function buildGeometry(model: FeaturedModel, baseScale: number): THREE.BufferGeometry {
  // Only called for procedural ("geom") models — STL geometry is built inside
  // STLFeaturedMesh after the file loads. If we ever get here with kind:"stl"
  // it means routing in <Scene> is broken; fall back to a sphere so the slot
  // at least renders something instead of crashing.
  if (model.kind !== "geom") {
    return new THREE.SphereGeometry(baseScale * model.scale, 16, 12)
  }

  const s = baseScale * model.scale
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

function buildMaterial(
  model: FeaturedModel,
  blendOverride: BlendOverride,
  colorOverride: string,
  opacity: number,
): THREE.Material {
  // Color override (set in the dev panel) wins over the per-mesh color when
  // it's a non-empty string. Empty string means "use per-mesh".
  const color = colorOverride || model.color || "#171717"

  // Resolve the effective blend mode: the dev-theme override wins unless it's
  // "as-configured", in which case we use the mesh's own setting (defaulting
  // to "normal" if unset).
  const effectiveBlend =
    blendOverride === "as-configured"
      ? (model.blendMode ?? "normal")
      : blendOverride

  // Solid meshes use MeshStandardMaterial regardless of blend mode — that
  // way the lights produce per-pixel shading, and the negative-blend
  // subtract reads as a depth gradient instead of a flat silhouette. (Old
  // build used MeshBasicMaterial for negative-blend, which gave a uniform
  // color and made convex meshes look 2D.)
  //
  // Wireframe variants stick with MeshBasicMaterial since lighting wireframe
  // strokes looks muddy.
  const useWireBasic = model.materialVariant === "wire"

  const material = useWireBasic
    ? new THREE.MeshBasicMaterial({
        color,
        wireframe: true,
      })
    : new THREE.MeshStandardMaterial({
        color,
        roughness: 0.35,
        metalness: 0.05,
        flatShading: true,
      })

  // Per-mesh blend modes. With "negative" we configure CustomBlending so the
  // framebuffer is replaced by (background - color * SRC_ALPHA). On a white
  // background that yields the inverse of the mesh's color; over other
  // meshes it subtracts again, creating the "negate on overlap" effect.
  switch (effectiveBlend) {
    case "additive":
      material.blending = THREE.AdditiveBlending
      material.transparent = true
      material.depthWrite = false
      break
    case "negative":
      // RGB:   dst_new = dst*One − src*src.a      (subtract input color × opacity)
      // Alpha: dst_new = dst*One + src*Zero       (keep dst alpha at 1)
      //
      // Using SrcAlphaFactor on src lets `material.opacity` directly control
      // how strong the negative-subtract is (0 = invisible, 1 = full subtract).
      //
      // The separate alpha equation is critical: without it, ReverseSubtract
      // also runs on alpha (dst.a − src.a) → after the first mesh the pixel
      // becomes transparent and the CSS bg-white shows through, making every
      // mesh look white instead of its inverse-color.
      material.blending = THREE.CustomBlending
      material.blendEquation = THREE.ReverseSubtractEquation
      material.blendSrc = THREE.SrcAlphaFactor
      material.blendDst = THREE.OneFactor
      material.blendEquationAlpha = THREE.AddEquation
      material.blendSrcAlpha = THREE.ZeroFactor
      material.blendDstAlpha = THREE.OneFactor
      material.transparent = true
      // Don't write OR test depth — otherwise meshes occlude each other and
      // the inverse-of-inverse overlap blending never happens. Every fragment
      // contributes to the framebuffer regardless of distance.
      material.depthWrite = false
      material.depthTest = false
      break
    case "normal":
    default:
      // Leave material at Three's defaults.
      break
  }

  // Apply opacity from the dev panel. We always set `transparent` when
  // opacity is below 1 so the alpha channel is respected by Three's compositor.
  material.opacity = opacity
  if (opacity < 1) material.transparent = true

  return material
}

// ──────────────────────────────────────────────────────────────────────────────
// Scene root (rotates as a unit)
// ──────────────────────────────────────────────────────────────────────────────
function Scene({
  onProjectOpen,
  onAboutOpen,
  engagement,
}: {
  onProjectOpen: (slug: string) => void
  onAboutOpen: () => void
  engagement: Engagement
}) {
  const {
    rotationY,
    rotationX,
    worldOffsetX,
    meshBaseScale,
    meshBlendOverride,
    meshColorOverride,
    meshOpacity,
    meshColorSeed,
  } = useDevTheme()

  const worldRef = useRef<THREE.Group>(null)
  const slots = useMemo(() => {
    const base = layoutFeaturedSlots(FEATURED_COUNT)
    // The about-me mesh sits at array index 0, which the Fibonacci layout
    // places at the top pole of the sphere — barely visible on page load
    // (it lands near y_ndc ≈ +1, clipped to the top edge). Override its
    // anchor to a front-of-sphere, center-ish position so the user sees it
    // immediately. It still rotates with the world group, so it'll travel
    // around the scene over time, just starting from a guaranteed-visible
    // spot.
    const aboutIdx = projects.findIndex((p) => p.slug === ABOUT_MESH_SLUG)
    if (aboutIdx >= 0 && base[aboutIdx]) {
      base[aboutIdx] = {
        ...base[aboutIdx],
        anchor: new THREE.Vector3(1.7, 0.4, 2.2),
      }
    }
    return base
  }, [])

  useFrame((_, dt) => {
    if (worldRef.current) {
      worldRef.current.rotation.y += dt * rotationY
      worldRef.current.rotation.x += dt * rotationX
    }
  })

  return (
    <>
      {/*
        Clear the WebGL canvas to opaque white. Required for the "negative"
        blend mode on meshes — that mode subtracts the mesh color from the
        framebuffer, so the framebuffer needs to actually contain something
        (otherwise alpha=0 and CSS white shows through, making every mesh
        look white).
      */}
      <color attach="background" args={["#ffffff"]} />
    <group ref={worldRef} position={[worldOffsetX, 0, 0]}>
      <DotField />
      {slots.map((slot, i) => {
        const model = featuredModels[i]
        if (!model) return null
        const project = projectForSlot(i)
        const isAbout = project.slug === ABOUT_MESH_SLUG

        const shared: SharedMeshProps = {
          anchor: slot.anchor,
          spinAxis: slot.spinAxis,
          phase: slot.phase,
          drift: slot.drift,
          model,
          locatorId: project.slug,
          baseScale: meshBaseScale,
          blendOverride: meshBlendOverride,
          // Randomized palette (seed > 0) wins; else the single global
          // override; else "" → the mesh keeps its configured color.
          colorOverride:
            meshColorSeed > 0 ? randomMeshColor(i, meshColorSeed) : meshColorOverride,
          opacity: meshOpacity,
          engagement,
          appearDelay: i * APPEAR_STAGGER,
          onSelect: () => {
            if (isAbout) {
              // Tell the onboarding hint it can disappear now — the user
              // has discovered (and clicked) the About mesh.
              window.dispatchEvent(new CustomEvent("about:hint-dismissed"))
              onAboutOpen()
            } else {
              onProjectOpen(project.slug)
            }
          },
        }

        // Loaded models (GLB / STL) load async → wrap each in its own
        // Suspense boundary (catches loading) AND an STLLoadBoundary
        // (catches errors like a 404 on the file). On failure the
        // boundary renders a wireframe placeholder (dev) so it's obvious
        // which slot's file is missing; in prod it renders nothing.
        // Geom meshes are synchronous — no Suspense / boundary needed.
        if (model.kind === "stl" || model.kind === "glb") {
          const fallback =
            process.env.NODE_ENV === "development" ? (
              <GeomFeaturedMesh
                {...shared}
                model={{
                  kind: "geom",
                  shape: "octa",
                  scale: model.scale,
                  materialVariant: "wire",
                  color: model.color,
                  blendMode: model.blendMode,
                }}
              />
            ) : null
          return (
            <STLLoadBoundary key={project.slug} path={model.path} fallback={fallback}>
              <Suspense fallback={null}>
                {model.kind === "glb" ? <GLBFeaturedMesh {...shared} /> : <STLFeaturedMesh {...shared} />}
              </Suspense>
            </STLLoadBoundary>
          )
        }
        return <GeomFeaturedMesh key={project.slug} {...shared} />
      })}
    </group>
    </>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Triadic-on-overlap blending lived here briefly via a HalfFloat
// EffectComposer + abs() post-pass. It DID produce the triadic third color
// at overlap regions — but the abs() applied globally made the entire
// canvas read as one solid surface (no breathing room within a mesh, no
// transparent feel between them). The visual regression wasn't worth the
// payoff, so we rolled it back to plain auto-render.
//
// Net effect for now: overlapping negative-blend meshes still clamp to
// (near-)black because an 8-bit framebuffer can't represent the negative
// values needed for inversion-of-inversion. If we want triadic overlap
// again, it'll need a more localized fix (e.g. dedicated overlap-mask pass
// that only applies abs() where two+ meshes actually overlap) instead of a
// global post-process.
// ──────────────────────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────────────────────────
// Public wrapper — mounts the Canvas, provides lights, bridges context
// ──────────────────────────────────────────────────────────────────────────────
export function BackgroundCanvas() {
  const { openProject, openAbout } = useOverlayNav()
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Armed-mesh state for the hover-engage buffer. A ref (not state) so the
  // per-frame reportNdc updates don't trigger re-renders.
  const armedRef = useRef<{
    slug: string
    action: () => void
    until: number
    ndcX: number
    ndcY: number
  } | null>(null)

  const engagement = useMemo<Engagement>(
    () => ({
      arm: (slug, action) => {
        armedRef.current = {
          slug,
          action,
          until: performance.now() + ENGAGE_MS,
          ndcX: 0,
          ndcY: 0,
        }
      },
      reportNdc: (slug, x, y) => {
        if (armedRef.current?.slug === slug) {
          armedRef.current.ndcX = x
          armedRef.current.ndcY = y
        }
      },
    }),
    [],
  )

  // Fires when a click hits no 3D object. If a mesh is armed and the click
  // landed near its current screen position within the window, open it.
  const handlePointerMissed = (e: MouseEvent) => {
    const armed = armedRef.current
    if (!armed) return
    if (performance.now() > armed.until) {
      armedRef.current = null
      return
    }
    const rect = wrapperRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0 || rect.height === 0) return
    const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1
    const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1
    const dx = ndcX - armed.ndcX
    const dy = ndcY - armed.ndcY
    if (Math.hypot(dx, dy) <= ENGAGE_NDC_RADIUS) {
      armed.action()
      armedRef.current = null
    }
  }

  return (
    // `absolute` (not `fixed`) on purpose: the canvas needs to live in the
    // SAME stacking context as <HeroNameTag /> so the latter's
    // `mix-blend-difference` can blend against the WebGL output. The
    // viewport-fill responsibility moves up to the isolation parent in
    // `app/page.tsx`.
    <div ref={wrapperRef} aria-hidden="false" className="pointer-events-auto absolute inset-0 bg-white">
      <Canvas
        className="absolute inset-0"
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ antialias: true }}
        onPointerMissed={handlePointerMissed}
      >
        {/* Lighting tuned for the negative-blend overlap math:
            - High ambient so colors are mostly uniform across each mesh
              (uniform color → cleaner subtract on overlap).
            - Light directional pass for a little 3D depth without sucking
              brightness out of the shadow side. */}
        <ambientLight intensity={0.95} />
        <directionalLight position={[2.5, 3, 4]} intensity={0.4} />
        <directionalLight position={[-3, -1, -2]} intensity={0.15} />
        <Scene onProjectOpen={openProject} onAboutOpen={openAbout} engagement={engagement} />
      </Canvas>

      {/* Top/bottom readability gradients removed — they read as faint
          horizontal lines on a white background and the chrome (Contact /
          ©2027 / MBW) reads fine on its own thanks to mix-blend-difference. */}
    </div>
  )
}
