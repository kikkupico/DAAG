// The island models are exported from Blender (metres, +Z up) with glTF's +Y-up conversion, so a
// Blender point (x, y, z) sits at (x, z, -y) in three.js. shots.json holds Blender coordinates.
import * as THREE from 'three';

export const blenderToThree = ([x, y, z]) => new THREE.Vector3(x, z, -y);
export const threeToBlender = (v) => [v.x, -v.z, v.y];

/** Blender coordinates rounded for shots.json. */
export const shotPoint = (v) => threeToBlender(v).map((n) => parseFloat(n.toFixed(2)));

/** Compass bearing (0 = north = Blender +Y, 90 = east = +X) to a unit vector in three.js space. */
export const bearingToThree = (deg) => {
  const r = (deg * Math.PI) / 180;
  return new THREE.Vector3(Math.sin(r), 0, -Math.cos(r));
};

/**
 * A shot's cam or target as Blender world coordinates, as world/src/shots_panels.place() reads it:
 * with a frame [x, y, floor z, door angle] the point is in the building's own frame (x along the
 * door's axis, y to its left); a height given as a string such as "+1.7" is that far above the ground.
 * groundAt(x, y) gives the ground's height there.
 */
export function shotToWorld(p, frame, groundAt) {
  let [x, y, z] = p;
  if (frame) {
    const [x0, y0, z0, a] = frame;
    const c = Math.cos(a), s = Math.sin(a);
    [x, y, z] = [x0 + x * c - y * s, y0 + x * s + y * c, z0 + z];
  } else if (typeof z === 'string') {
    z = groundAt(x, y) + parseFloat(z);
  }
  return [Number(x), Number(y), Number(z)];
}

/** The inverse of shotToWorld for a frame: a world point in the building's own frame. */
export function worldToFrame([x, y, z], [x0, y0, z0, a]) {
  const c = Math.cos(a), s = Math.sin(a);
  const dx = x - x0, dy = y - y0;
  return [dx * c + dy * s, -dx * s + dy * c, z - z0];
}
