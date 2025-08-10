/*
Helpers to pin screen-space locators to moving Three.js objects.

Usage inside your render loop (React Three Fiber or raw Three.js):

import * as THREE from "three"
import { updateLocatorFromObject } from "@/lib/locator-bridge"

function usePinLocator(id: string, objRef: React.RefObject<THREE.Object3D>, camera: THREE.Camera) {
  useFrame(() => {
    if (!objRef.current) return
    updateLocatorFromObject(camera, objRef.current, id)
  })
}

Or imperatively:

updateLocatorFromVector(camera, someWorldPosition, "project-one")
*/

import * as THREE from "three"

export function updateLocatorFromVector(camera: THREE.Camera, world: THREE.Vector3, id: string): void {
  const ndc = world.clone().project(camera) // -> [-1..1] in x,y and z is clip depth
  window.dispatchEvent(
    new CustomEvent("locators:update", {
      detail: { id, ndc: { x: ndc.x, y: ndc.y, z: ndc.z } },
    }),
  )
}

export function updateLocatorFromObject(camera: THREE.Camera, obj: THREE.Object3D, id: string): void {
  const world = new THREE.Vector3()
  obj.getWorldPosition(world)
  updateLocatorFromVector(camera, world, id)
}
