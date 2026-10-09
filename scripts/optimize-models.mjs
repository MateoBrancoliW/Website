#!/usr/bin/env node
/**
 * Convert the source STL models into small, web-ready GLB files.
 *
 *   models-src/*.stl  ──►  public/models/*.glb
 *
 * Usage:   pnpm models            (converts everything)
 *          pnpm models kart       (only files whose name contains "kart")
 *
 * What it does to each model:
 *   1. Parses the (binary or ASCII) STL.
 *   2. Welds duplicate vertices (STL stores every triangle separately).
 *   3. Simplifies to at most TRIANGLE_BUDGET triangles with meshoptimizer.
 *      The featured meshes are only a few hundred pixels on screen, so
 *      500k-triangle CAD exports are ~20x more detail than anyone can see.
 *   4. Quantizes + meshopt-compresses the vertex/index data.
 *
 * Normals are intentionally NOT stored: the materials use flatShading, which
 * derives normals on the GPU per-pixel.
 *
 * Per-file overrides live in OVERRIDES below — raise a model's budget if the
 * simplified version loses detail you care about.
 */
import { readFile, readdir, writeFile, mkdir, stat } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { Document, Logger, NodeIO } from "@gltf-transform/core"
import { EXTMeshoptCompression, KHRMeshQuantization } from "@gltf-transform/extensions"
import { weld, simplify, quantize, meshopt, dedup, prune } from "@gltf-transform/functions"
import { MeshoptSimplifier, MeshoptEncoder } from "meshoptimizer"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const SRC_DIR = path.join(ROOT, "models-src")
const OUT_DIR = path.join(ROOT, "public", "models")

const TRIANGLE_BUDGET = 30_000
// Max geometric error the simplifier may introduce, relative to model size.
// 0.004 ≈ 0.4% of the model's extent — invisible at on-screen sizes.
const SIMPLIFY_ERROR = 0.004

/** @type {Record<string, { budget?: number }>} keyed by file basename (no ext) */
const OVERRIDES = {
  // Dense breadboard: pin holes + wires soften noticeably at 30k.
  board: { budget: 60_000 },
}

// ─── STL parsing ────────────────────────────────────────────────────────────
function parseSTL(buf) {
  const isBinary = (() => {
    if (buf.length < 84) return false
    const n = buf.readUInt32LE(80)
    return 84 + n * 50 === buf.length
  })()
  if (isBinary) {
    const n = buf.readUInt32LE(80)
    const pos = new Float32Array(n * 9)
    for (let i = 0; i < n; i++) {
      const o = 84 + i * 50 + 12 // skip the facet normal
      for (let k = 0; k < 9; k++) pos[i * 9 + k] = buf.readFloatLE(o + k * 4)
    }
    return pos
  }
  // ASCII fallback
  const text = buf.toString("utf8")
  const nums = []
  const re = /vertex\s+([-+\d.eE]+)\s+([-+\d.eE]+)\s+([-+\d.eE]+)/g
  let m
  while ((m = re.exec(text))) nums.push(+m[1], +m[2], +m[3])
  return new Float32Array(nums)
}

// ─── Conversion ─────────────────────────────────────────────────────────────
async function convert(file, io) {
  const name = path.basename(file, path.extname(file))
  const budget = OVERRIDES[name]?.budget ?? TRIANGLE_BUDGET
  const positions = parseSTL(await readFile(file))
  const inTris = positions.length / 9

  const doc = new Document().setLogger(new Logger(Logger.Verbosity.WARN))
  const buffer = doc.createBuffer()
  const posAcc = doc
    .createAccessor("POSITION")
    .setType("VEC3")
    .setArray(positions)
    .setBuffer(buffer)
  const prim = doc.createPrimitive().setAttribute("POSITION", posAcc)
  const mesh = doc.createMesh(name).addPrimitive(prim)
  const node = doc.createNode(name).setMesh(mesh)
  doc.createScene().addChild(node)

  await doc.transform(weld())
  if (inTris > budget) {
    await doc.transform(
      simplify({ simplifier: MeshoptSimplifier, ratio: budget / inTris, error: SIMPLIFY_ERROR, lockBorder: false }),
    )
  }
  await doc.transform(dedup(), prune(), quantize(), meshopt({ encoder: MeshoptEncoder, level: "medium" }))

  const outTris = doc.getRoot().listMeshes()[0].listPrimitives()[0].getIndices()?.getCount() / 3
  const outFile = path.join(OUT_DIR, `${name}.glb`)
  await io.write(outFile, doc)
  const [a, b] = [await stat(file), await stat(outFile)]
  console.log(
    `${name.padEnd(16)} ${String(inTris).padStart(8)} → ${String(outTris).padStart(6)} tris   ` +
      `${(a.size / 1e6).toFixed(1).padStart(5)} MB → ${(b.size / 1e3).toFixed(0).padStart(5)} KB`,
  )
}

async function main() {
  await MeshoptSimplifier.ready
  await MeshoptEncoder.ready
  await mkdir(OUT_DIR, { recursive: true })
  const io = new NodeIO()
    .registerExtensions([EXTMeshoptCompression, KHRMeshQuantization])
    .registerDependencies({ "meshopt.encoder": MeshoptEncoder })

  const filter = process.argv[2]?.toLowerCase()
  const files = (await readdir(SRC_DIR))
    .filter((f) => f.toLowerCase().endsWith(".stl"))
    .filter((f) => !filter || f.toLowerCase().includes(filter))
    .map((f) => path.join(SRC_DIR, f))
  if (!files.length) {
    console.log(`No .stl files found in ${path.relative(ROOT, SRC_DIR)}/`)
    return
  }
  for (const f of files) await convert(f, io)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
