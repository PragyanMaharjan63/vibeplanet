import * as THREE from 'three';

// Procedurally generates a color (and, for rocky worlds, a bump) map for
// each planet entirely in-browser via <canvas> — no image assets to ship,
// no network fetch, deterministic per planet id so the same world always
// looks the same on reload.

const SIZE_W = 256;
const SIZE_H = 128;

const PALETTES = {
  mercury: { dark: [96, 92, 86], light: [188, 182, 172] },
  venus: { dark: [178, 148, 102], light: [238, 218, 176] },
  earth: {
    oceanDeep: [10, 30, 68],
    ocean: [22, 62, 116],
    land: [58, 102, 54],
    landDry: [138, 116, 66],
    cloud: [255, 255, 255],
    ice: [232, 240, 250],
  },
  mars: { dark: [116, 54, 34], light: [206, 140, 104], ice: [235, 225, 215] },
  jupiter: { bandA: [196, 158, 110], bandB: [150, 108, 72], bandC: [226, 202, 164], spot: [176, 86, 58] },
  saturn: { bandA: [225, 201, 150], bandB: [190, 162, 112], bandC: [240, 226, 190] },
  uranus: { bandA: [163, 216, 222], bandB: [132, 190, 200] },
  neptune: { bandA: [78, 108, 214], bandB: [44, 70, 168] },
};

const BUMP_TYPES = new Set(['cratered', 'dusty', 'earth']);

function mulberry32(seed) {
  let a = seed | 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return h;
}

// One octave of tileable (in x) value noise, bilinear-sampled.
function makeOctave(rng, gridSize) {
  const grid = new Float32Array(gridSize * gridSize);
  for (let i = 0; i < grid.length; i++) grid[i] = rng();
  return function sample(x, y) {
    const gx = ((x % 1) + 1) % 1 * gridSize;
    const gy = Math.max(0, Math.min(0.999999, y)) * gridSize;
    const x0 = Math.floor(gx) % gridSize;
    const y0 = Math.floor(gy) % gridSize;
    const x1 = (x0 + 1) % gridSize;
    const y1 = Math.min(y0 + 1, gridSize - 1);
    const fx = gx - Math.floor(gx);
    const fy = gy - Math.floor(gy);
    const v00 = grid[y0 * gridSize + x0];
    const v10 = grid[y0 * gridSize + x1];
    const v01 = grid[y1 * gridSize + x0];
    const v11 = grid[y1 * gridSize + x1];
    const a = v00 + (v10 - v00) * fx;
    const b = v01 + (v11 - v01) * fx;
    return a + (b - a) * fy;
  };
}

function makeFbm(rng, octaveSizes) {
  const octaves = octaveSizes.map((size) => ({ sample: makeOctave(rng, size), amp: 1 / size }));
  const norm = octaves.reduce((s, o) => s + o.amp, 0);
  return (x, y) => octaves.reduce((total, o) => total + o.sample(x, y) * o.amp, 0) / norm;
}

const clamp01 = (x) => Math.max(0, Math.min(1, x));
const smoothstep = (e0, e1, x) => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
const lerp3 = (a, b, t) => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
];

function drawCraters(ctx, w, h, rng, palette) {
  const count = 16 + Math.floor(rng() * 10);
  for (let i = 0; i < count; i++) {
    const x = rng() * w;
    const y = rng() * h * 0.9 + h * 0.05;
    const r = 2.5 + rng() * 8;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, `rgba(${palette.dark.join(',')},0.6)`);
    grad.addColorStop(0.7, `rgba(${palette.dark.join(',')},0.3)`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(${palette.light.join(',')},0.22)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.88, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function pixelColor(textureType, palette, u, v, n, n2, planetId) {
  switch (textureType) {
    case 'cratered':
      return lerp3(palette.dark, palette.light, smoothstep(0.35, 0.65, n) * 0.7 + 0.15);
    case 'dusty': {
      let c = lerp3(palette.dark, palette.light, smoothstep(0.3, 0.7, n));
      const poleT = clamp01((Math.abs(v - 0.5) - 0.42) / 0.08);
      return lerp3(c, palette.ice, poleT);
    }
    case 'clouds':
      return lerp3(palette.dark, palette.light, smoothstep(0.28, 0.72, n));
    case 'earth': {
      const isLand = n > 0.52;
      let base = isLand
        ? lerp3(palette.land, palette.landDry, smoothstep(0.4, 0.75, n2))
        : lerp3(palette.oceanDeep, palette.ocean, smoothstep(0.25, 0.7, n));
      if (n2 > 0.6) base = lerp3(base, palette.cloud, ((n2 - 0.6) / 0.4) * 0.65);
      const poleT = clamp01((Math.abs(v - 0.5) - 0.4) / 0.1);
      return lerp3(base, palette.ice, poleT);
    }
    case 'bands':
    case 'ice': {
      const bandCount = textureType === 'ice' ? 5 : planetId === 'jupiter' ? 9 : 7;
      const warp = (n2 - 0.5) * (textureType === 'ice' ? 0.1 : 0.16);
      const bandV = Math.sin((v + warp) * bandCount * Math.PI) * 0.5 + 0.5;
      let c = lerp3(palette.bandB, palette.bandA, smoothstep(0.3, 0.7, bandV));
      if (palette.bandC) c = lerp3(c, palette.bandC, Math.max(0, n - 0.72) / 0.28 * 0.4);
      if (planetId === 'jupiter') {
        const du = Math.min(Math.abs(u - 0.28), 1 - Math.abs(u - 0.28));
        const dv = (v - 0.6) / 0.22;
        const dist = Math.sqrt(du * du * 64 + dv * dv * 4);
        if (dist < 1) c = lerp3(c, palette.spot, smoothstep(1, 0, dist) * 0.85);
      }
      return c;
    }
    default:
      return [140, 140, 140];
  }
}

function buildColorCanvas(planetId, textureType, fbm, fbm2) {
  const canvas = document.createElement('canvas');
  canvas.width = SIZE_W;
  canvas.height = SIZE_H;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(SIZE_W, SIZE_H);
  const palette = PALETTES[planetId] || PALETTES.mercury;

  for (let y = 0; y < SIZE_H; y++) {
    const v = y / SIZE_H;
    for (let x = 0; x < SIZE_W; x++) {
      const u = x / SIZE_W;
      const n = fbm(u, v);
      const n2 = fbm2(u + 3.1, v + 1.7);
      const [r, g, b] = pixelColor(textureType, palette, u, v, n, n2, planetId);
      const idx = (y * SIZE_W + x) * 4;
      img.data[idx] = r;
      img.data[idx + 1] = g;
      img.data[idx + 2] = b;
      img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  if (textureType === 'cratered') {
    const rng = mulberry32(hashString(planetId + '-craters'));
    drawCraters(ctx, SIZE_W, SIZE_H, rng, palette);
  }

  return canvas;
}

function buildBumpCanvas(fbm) {
  const canvas = document.createElement('canvas');
  canvas.width = SIZE_W;
  canvas.height = SIZE_H;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(SIZE_W, SIZE_H);
  for (let y = 0; y < SIZE_H; y++) {
    const v = y / SIZE_H;
    for (let x = 0; x < SIZE_W; x++) {
      const u = x / SIZE_W;
      const g = Math.round(fbm(u, v) * 255);
      const idx = (y * SIZE_W + x) * 4;
      img.data[idx] = g;
      img.data[idx + 1] = g;
      img.data[idx + 2] = g;
      img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

const cache = new Map();

export function getPlanetTextures(planetId, textureType) {
  const key = `${planetId}:${textureType}`;
  if (cache.has(key)) return cache.get(key);

  const rng = mulberry32(hashString(key));
  const fbm = makeFbm(rng, [4, 8, 16, 32]);
  const fbm2 = makeFbm(rng, [3, 6, 12]);

  const colorCanvas = buildColorCanvas(planetId, textureType, fbm, fbm2);
  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.needsUpdate = true;

  let bumpMap = null;
  if (BUMP_TYPES.has(textureType)) {
    const bumpCanvas = buildBumpCanvas(fbm);
    bumpMap = new THREE.CanvasTexture(bumpCanvas);
    bumpMap.needsUpdate = true;
  }

  const result = { map, bumpMap };
  cache.set(key, result);
  return result;
}
