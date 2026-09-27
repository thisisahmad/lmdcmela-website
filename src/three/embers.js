/* ==========================================================================
   Hero 3D scene — glowing embers rising through the air.
   Loaded with dynamic import() from main.js so Three.js never blocks first paint.
   All particle motion runs on the GPU (vertex shader); the CPU only updates
   a time uniform and the camera each frame.
   ========================================================================== */
import {
  WebGLRenderer, Scene, PerspectiveCamera, BufferGeometry, BufferAttribute,
  ShaderMaterial, AdditiveBlending, Points, Color, Vector2, MathUtils,
} from 'three';

const PALETTE = ['#FF6B1A', '#FFA630', '#FFC857', '#E63A12', '#FF8A3D'];
const HEIGHT = 24; // vertical travel of an ember before it loops

const vertexShader = /* glsl */ `
  attribute float aSize; attribute float aSpeed; attribute float aPhase; attribute vec3 aColor;
  uniform float uTime; uniform float uHeight; uniform float uPixelRatio; uniform vec2 uMouse;
  varying vec3 vColor; varying float vAlpha; varying float vSize;
  void main() {
    vec3 p = position;
    p.y = mod(p.y + uTime * aSpeed + uHeight * 0.5, uHeight) - uHeight * 0.5;          // rise & loop
    p.x += sin(uTime * 0.6 * aSpeed + aPhase) * 0.7 + sin(uTime * 0.21 + aPhase * 3.0) * 0.4; // sway
    p.z += cos(uTime * 0.4 + aPhase) * 0.3;
    vec2 d = p.xy - uMouse;                                                            // flee the cursor
    p.xy += normalize(d + 0.0001) * exp(-dot(d, d) * 0.18) * 1.6;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixelRatio * (28.0 / -mv.z);

    float life = (p.y + uHeight * 0.5) / uHeight;                                      // 0 bottom → 1 top
    vAlpha = smoothstep(0.0, 0.12, life) * (1.0 - smoothstep(0.55, 1.0, life));
    vAlpha *= 0.65 + 0.35 * sin(uTime * 4.0 * aSpeed + aPhase * 7.0);                  // flicker
    vColor = mix(aColor, vec3(1.0, 0.95, 0.8), (1.0 - life) * 0.25);                   // hotter near the fire
    vSize = aSize;
  }`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor; varying float vAlpha; varying float vSize;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float core = smoothstep(0.5, 0.0, d);
    float a = pow(core, 1.6) * vAlpha * (vSize > 5.0 ? 0.18 : 1.0);                    // bokeh embers stay soft
    gl_FragColor = vec4(vColor + vec3(0.35, 0.25, 0.1) * pow(core, 6.0), a);          // white-hot centre
  }`;

/**
 * @param {object} o
 * @param {HTMLCanvasElement} o.canvas
 * @param {HTMLElement} o.hero          element whose size the canvas matches
 * @param {boolean} o.isMobile          fewer particles + lower pixel ratio
 * @returns {{ setActive(on: boolean): void }}
 */
export function createEmbers({ canvas, hero, isMobile }) {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' });
  const COUNT = isMobile ? 550 : 1700;
  const scene = new Scene();
  const camera = new PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.z = 12;

  // Per-particle attributes
  const pos = new Float32Array(COUNT * 3);
  const size = new Float32Array(COUNT);
  const speed = new Float32Array(COUNT);
  const phase = new Float32Array(COUNT);
  const color = new Float32Array(COUNT * 3);
  const c = new Color();
  for (let i = 0; i < COUNT; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 34;
    pos[i * 3 + 1] = (Math.random() - 0.5) * HEIGHT;
    pos[i * 3 + 2] = -12 + Math.random() * 16;
    size[i] = Math.random() < 0.06 ? 6 + Math.random() * 8 : 0.8 + Math.random() ** 2 * 3;
    speed[i] = 0.35 + Math.random() * 0.9;
    phase[i] = Math.random() * Math.PI * 2;
    c.set(PALETTE[(Math.random() * PALETTE.length) | 0]);
    color.set([c.r, c.g, c.b], i * 3);
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(pos, 3));
  geo.setAttribute('aSize', new BufferAttribute(size, 1));
  geo.setAttribute('aSpeed', new BufferAttribute(speed, 1));
  geo.setAttribute('aPhase', new BufferAttribute(phase, 1));
  geo.setAttribute('aColor', new BufferAttribute(color, 3));

  const uniforms = {
    uTime: { value: 0 },
    uHeight: { value: HEIGHT },
    uPixelRatio: { value: 1 },
    uMouse: { value: new Vector2(99, 99) },
  };
  scene.add(new Points(geo, new ShaderMaterial({
    uniforms, vertexShader, fragmentShader,
    transparent: true, depthWrite: false, blending: AdditiveBlending,
  })));

  // Size & pixel ratio (capped at 2, lower on phones)
  let halfW = 1, halfH = 1;
  const resize = () => {
    const w = hero.clientWidth, h = hero.clientHeight;
    const pr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
    renderer.setPixelRatio(pr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    uniforms.uPixelRatio.value = pr;
    halfH = Math.tan(MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    halfW = halfH * camera.aspect;
  };
  resize();
  addEventListener('resize', resize);

  // Input: mouse on desktop, device tilt on phones
  const target = { x: 0, y: 0 };
  const cur = { x: 0, y: 0 };
  let pointerSeen = false;
  addEventListener('pointermove', (e) => {
    target.x = (e.clientX / innerWidth) * 2 - 1;
    target.y = -((e.clientY / innerHeight) * 2 - 1);
    pointerSeen = true;
  }, { passive: true });

  const onTilt = (e) => {
    if (e.gamma == null) return;
    target.x = Math.max(-1, Math.min(1, e.gamma / 30));
    target.y = -Math.max(-1, Math.min(1, (e.beta - 45) / 30));
  };
  if ('DeviceOrientationEvent' in window) {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      // iOS only grants motion access after a user gesture
      addEventListener('touchend', () => {
        DeviceOrientationEvent.requestPermission()
          .then((s) => s === 'granted' && addEventListener('deviceorientation', onTilt))
          .catch(() => {});
      }, { once: true });
    } else {
      addEventListener('deviceorientation', onTilt);
    }
  }

  // Render loop (started/stopped by main.js based on visibility)
  let rafId = 0, last = 0, running = false;
  const frame = (now) => {
    rafId = requestAnimationFrame(frame);
    uniforms.uTime.value += Math.min((now - last) / 1000, 0.05);
    last = now;
    cur.x += (target.x - cur.x) * 0.05;
    cur.y += (target.y - cur.y) * 0.05;
    camera.position.x = cur.x * 1.4;
    camera.position.y = cur.y * 0.9;
    camera.lookAt(0, 0, 0);
    if (pointerSeen || !isMobile) uniforms.uMouse.value.set(cur.x * halfW, cur.y * halfH);
    renderer.render(scene, camera);
  };

  return {
    setActive(on) {
      if (on === running) return;
      running = on;
      if (on) { last = performance.now(); rafId = requestAnimationFrame(frame); }
      else cancelAnimationFrame(rafId);
    },
  };
}
