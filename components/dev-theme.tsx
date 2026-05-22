"use client"

/**
 * Dev theme — live-adjustable scene parameters that persist across reloads.
 *
 * Architecture:
 *   • <DevThemeProvider>: holds the settings state, persists to localStorage.
 *   • useDevTheme(): hook returning the current settings (with defaults if no
 *     provider is mounted — so consumers can be used outside of the provider).
 *   • <DevPanel>: dev-only UI panel anchored top-left next to the Next.js
 *     indicator. Sliders / selects mutate settings; localStorage syncs on
 *     every change.
 *
 * Consumers (currently BackgroundCanvas + DotField) read from useDevTheme()
 * and re-render when settings change. They fall back to DEV_THEME_DEFAULTS
 * if no provider is mounted, so removing the panel from production doesn't
 * break the canvas.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

export type BlendOverride = "as-configured" | "normal" | "additive" | "negative"

export type DevTheme = {
  // Dot field
  dotCount: number
  dotSize: number
  dotOpacity: number
  dotRadius: number
  // Rotation
  rotationY: number
  rotationX: number
  // Featured meshes
  meshBaseScale: number
  worldOffsetX: number
  meshBlendOverride: BlendOverride
  /** When non-empty, overrides every mesh's color (hex string like "#ff00ff"). */
  meshColorOverride: string
  /** Material opacity for solid (non-wire) meshes. 0 = invisible, 1 = full. */
  meshOpacity: number
  /**
   * When > 0, each mesh gets a deterministic vivid color derived from
   * hash(slotIndex, seed) — a randomized rainbow palette. 0 = use the
   * per-mesh colors from featured-models.ts (or meshColorOverride). The
   * "Randomize" button sets a fresh seed.
   */
  meshColorSeed: number
}

export const DEV_THEME_DEFAULTS: DevTheme = {
  dotCount: 2600,
  dotSize: 0.034,
  dotOpacity: 0.7,
  dotRadius: 5.5,
  rotationY: 0.12,
  rotationX: 0.03,
  // Bumped from 0.24 → 0.32 so meshes read with more presence; the lit
  // standard material + larger silhouette makes the negative-blend depth
  // gradient much more visible too.
  meshBaseScale: 0.32,
  worldOffsetX: -1.4,
  meshBlendOverride: "as-configured",
  meshColorOverride: "",
  meshOpacity: 1,
  meshColorSeed: 0,
}

/**
 * Deterministic vivid color for a mesh slot under a given randomize seed.
 * Returns an `hsl(...)` string (THREE.Color parses it). Hue is hashed from
 * index + seed; saturation/lightness fixed high so the negative-blend output
 * stays vivid.
 */
export function randomMeshColor(index: number, seed: number): string {
  const x = Math.sin(index * 99.137 + seed * 0.0001) * 43758.5453
  const frac = x - Math.floor(x)
  const hue = Math.floor(frac * 360)
  return `hsl(${hue}, 90%, 55%)`
}

const STORAGE_KEY = "portfolio-dev-theme-v1"

type Ctx = {
  settings: DevTheme
  setSetting: <K extends keyof DevTheme>(key: K, value: DevTheme[K]) => void
  reset: () => void
}

const ThemeCtx = createContext<Ctx | null>(null)

export function DevThemeProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<DevTheme>(DEV_THEME_DEFAULTS)
  const [loaded, setLoaded] = useState(false)

  // Load from localStorage on first mount. We gate writeback on `loaded` so
  // the initial defaults don't overwrite a stored value before we've had a
  // chance to read it.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<DevTheme>
        setSettings({ ...DEV_THEME_DEFAULTS, ...parsed })
      }
    } catch {
      // localStorage unavailable or JSON broken — fall back to defaults.
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // ignore quota / privacy-mode failures
    }
  }, [settings, loaded])

  const setSetting: Ctx["setSetting"] = (key, value) =>
    setSettings((s) => ({ ...s, [key]: value }))

  const reset = () => setSettings(DEV_THEME_DEFAULTS)

  return (
    <ThemeCtx.Provider value={{ settings, setSetting, reset }}>
      {children}
    </ThemeCtx.Provider>
  )
}

/** Read-only access. Returns defaults if no provider is mounted. */
export function useDevTheme(): DevTheme {
  return useContext(ThemeCtx)?.settings ?? DEV_THEME_DEFAULTS
}

/** Full controls (settings + setters). Returns null if no provider. */
function useDevThemeControls(): Ctx | null {
  return useContext(ThemeCtx)
}

// ─── UI panel ────────────────────────────────────────────────────────────────
/**
 * DevPanel renders only when NODE_ENV === "development", so it disappears in
 * production builds. Position is top-left, offset right of the Next.js dev
 * indicator (which sits at ~10–14px top-left in dev).
 */
export function DevPanel() {
  const ctx = useDevThemeControls()
  const [open, setOpen] = useState(false)
  // Settings auto-save on every change (see DevThemeProvider). The Save
  // button below is mostly UX reassurance — pressing it flashes a "Saved!"
  // pill for ~1.2s. That tells the user the localStorage write happened.
  const [savedFlash, setSavedFlash] = useState(false)

  if (process.env.NODE_ENV !== "development") return null
  if (!ctx) return null

  const { settings, setSetting, reset } = ctx

  function flashSaved() {
    // The actual write happens automatically; we just trigger the visual.
    setSavedFlash(true)
    window.setTimeout(() => setSavedFlash(false), 1200)
  }

  return (
    <div className="pointer-events-auto fixed left-14 top-3 z-[60] font-sans text-gray-900">
      {open ? (
        <div className="w-72 rounded-lg border border-black/15 bg-white p-4 shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
            <strong className="text-sm">Dev theme</strong>
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={reset}
                className="rounded border border-black/15 px-2 py-0.5 hover:bg-gray-50"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close dev panel"
                className="rounded border border-black/15 px-2 py-0.5 hover:bg-gray-50"
              >
                ✕
              </button>
            </div>
          </div>

          <Slider
            label="Dot count"
            value={settings.dotCount}
            min={200}
            max={5000}
            step={100}
            onChange={(v) => setSetting("dotCount", v)}
            format={(v) => String(Math.round(v))}
          />
          <Slider
            label="Dot size"
            value={settings.dotSize}
            min={0.005}
            max={0.1}
            step={0.001}
            onChange={(v) => setSetting("dotSize", v)}
          />
          <Slider
            label="Dot opacity"
            value={settings.dotOpacity}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => setSetting("dotOpacity", v)}
          />
          <Slider
            label="Dot field radius"
            value={settings.dotRadius}
            min={1}
            max={10}
            step={0.1}
            onChange={(v) => setSetting("dotRadius", v)}
          />
          <Slider
            label="Rotation Y"
            value={settings.rotationY}
            min={0}
            max={0.5}
            step={0.005}
            onChange={(v) => setSetting("rotationY", v)}
          />
          <Slider
            label="Rotation X"
            value={settings.rotationX}
            min={0}
            max={0.5}
            step={0.005}
            onChange={(v) => setSetting("rotationX", v)}
          />
          <Slider
            label="Mesh base scale"
            value={settings.meshBaseScale}
            min={0.05}
            max={0.6}
            step={0.005}
            onChange={(v) => setSetting("meshBaseScale", v)}
          />
          <Slider
            label="World offset X"
            value={settings.worldOffsetX}
            min={-3}
            max={3}
            step={0.05}
            onChange={(v) => setSetting("worldOffsetX", v)}
          />

          <Slider
            label="Mesh opacity"
            value={settings.meshOpacity}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => setSetting("meshOpacity", v)}
          />

          <label className="mt-3 block text-xs">
            <div className="mb-1 font-medium">Mesh blend override</div>
            <select
              value={settings.meshBlendOverride}
              onChange={(e) =>
                setSetting("meshBlendOverride", e.target.value as BlendOverride)
              }
              className="w-full rounded border border-black/15 bg-white px-2 py-1 text-xs"
            >
              <option value="as-configured">as-configured (per-mesh)</option>
              <option value="normal">normal (everywhere)</option>
              <option value="additive">additive (everywhere)</option>
              <option value="negative">negative (everywhere)</option>
            </select>
          </label>

          {/* Color override — when active, every mesh ignores its own color
              and renders with this one. Combined with "negative" blend the
              on-screen appearance is the inverse of the chosen color. */}
          <div className="mt-3 text-xs">
            <div className="mb-1 font-medium">Mesh color override</div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.meshColorOverride || "#171717"}
                onChange={(e) => setSetting("meshColorOverride", e.target.value)}
                className="h-7 w-10 cursor-pointer rounded border border-black/15"
              />
              <input
                type="text"
                value={settings.meshColorOverride}
                onChange={(e) => setSetting("meshColorOverride", e.target.value)}
                placeholder="(per-mesh)"
                className="flex-1 rounded border border-black/15 bg-white px-2 py-1 font-mono text-[11px]"
              />
              {settings.meshColorOverride ? (
                <button
                  type="button"
                  onClick={() => setSetting("meshColorOverride", "")}
                  className="rounded border border-black/15 px-2 py-1 text-[10px] hover:bg-gray-50"
                  aria-label="Clear color override"
                >
                  ✕
                </button>
              ) : null}
            </div>
          </div>

          {/* Randomize — assigns each mesh a deterministic vivid hue from a
              fresh seed. Takes precedence over the single color override
              above. "Use configured" reverts to per-mesh colors. */}
          <div className="mt-3 text-xs">
            <div className="mb-1 font-medium">
              Mesh palette {settings.meshColorSeed > 0 ? "(randomized)" : "(configured)"}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSetting("meshColorSeed", Math.floor(Math.random() * 1e6) + 1)}
                className="flex-1 rounded border border-black/15 bg-white px-2 py-1 hover:bg-gray-50"
              >
                🎲 Randomize colors
              </button>
              {settings.meshColorSeed > 0 ? (
                <button
                  type="button"
                  onClick={() => setSetting("meshColorSeed", 0)}
                  className="rounded border border-black/15 bg-white px-2 py-1 hover:bg-gray-50"
                >
                  Use configured
                </button>
              ) : null}
            </div>
          </div>

          {/* Per-mesh STL upload — placeholder. Wiring this requires loading
              the file via STLLoader and patching `featuredModels[i]` at
              runtime. Left as a TODO so the affordance is at least visible
              in the panel. */}
          <div className="mt-3 rounded border border-dashed border-black/15 bg-gray-50 px-2 py-2 text-[11px] text-muted-foreground">
            STL upload — coming soon. Drop CADs into <code>public/models/</code>
            and wire them via <code>lib/featured-models.ts</code> for now.
          </div>

          {/* Save + status row. Auto-save handles persistence; the button
              just flashes confirmation. */}
          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={flashSaved}
              className="flex-1 rounded border border-black/20 bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800"
            >
              Save
            </button>
            <span
              className="text-[10px] uppercase tracking-wider text-emerald-600"
              style={{
                opacity: savedFlash ? 1 : 0,
                transition: "opacity 200ms ease",
              }}
            >
              ✓ Saved
            </span>
          </div>

          <p className="mt-3 text-[10px] text-muted-foreground">
            Settings auto-save to localStorage on every change. Refresh-safe.
            Dev only.
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-md border border-black/20 bg-white/90 px-2 py-1 text-xs font-medium shadow hover:bg-white"
        >
          ⚙ Dev
        </button>
      )}
    </div>
  )
}

// ─── small Slider helper used inside DevPanel ────────────────────────────────
function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (n: number) => void
  format?: (n: number) => string
}) {
  return (
    <label className="mb-2 block text-xs">
      <div className="flex items-baseline justify-between">
        <span>{label}</span>
        <span className="font-mono text-[11px] text-muted-foreground">
          {format ? format(value) : value.toFixed(3)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </label>
  )
}
