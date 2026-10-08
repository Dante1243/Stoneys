/* Hero 3D: a procedurally built alloy wheel with a glossy environment reflection.
   No model files needed. Accent colour is read from the CSS --accent token. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const canvas = document.getElementById('heroCanvas');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { return false; }
}

if (canvas && webglAvailable()) init();

function init() {
  const accentCss = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#c9a86a';
  const accent = new THREE.Color(accentCss);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  /* ---------- Materials ---------- */
  const chrome = new THREE.MeshPhysicalMaterial({ color: 0xe8e8ea, metalness: 1, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05 });
  const gunmetal = new THREE.MeshPhysicalMaterial({ color: 0x2a2b30, metalness: 1, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x0c0c0d, metalness: 0, roughness: 0.75 });
  const disc = new THREE.MeshStandardMaterial({ color: 0x6d6e72, metalness: 0.9, roughness: 0.38 });
  const spokeMat = new THREE.MeshPhysicalMaterial({ color: 0x35363c, metalness: 1, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.03 });
  const caliperMat = new THREE.MeshPhysicalMaterial({ color: accent, metalness: 0.6, roughness: 0.25, clearcoat: 1 });

  /* ---------- Wheel ---------- */
  const root = new THREE.Group();       // tilt + mouse parallax
  const spin = new THREE.Group();       // rotates
  root.add(spin);
  scene.add(root);

  // Tyre: lathe profile for a realistic sidewall
  const tyreProfile = [];
  const rIn = 1.62, rOut = 2.12, w = 0.62;
  for (let i = 0; i <= 24; i++) {
    const t = (i / 24) * Math.PI;
    const r = rIn + (rOut - rIn) * Math.sin(t) ** 0.6;
    tyreProfile.push(new THREE.Vector2(r, -w + (2 * w * i) / 24));
  }
  const tyre = new THREE.Mesh(new THREE.LatheGeometry(tyreProfile, 96), rubber);
  tyre.rotation.x = Math.PI / 2;
  spin.add(tyre);

  // Rim barrel and lip
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(1.62, 1.62, 1.2, 96, 1, true), gunmetal);
  barrel.rotation.x = Math.PI / 2;
  barrel.material.side = THREE.DoubleSide;
  spin.add(barrel);

  const lip = new THREE.Mesh(new THREE.TorusGeometry(1.62, 0.07, 24, 128), chrome);
  lip.position.z = 0.58;
  spin.add(lip);

  // Spokes: twin tapered spokes x5, extruded with bevel
  const spokeShape = new THREE.Shape();
  spokeShape.moveTo(-0.11, 0.38);
  spokeShape.lineTo(0.11, 0.38);
  spokeShape.quadraticCurveTo(0.09, 1.0, 0.07, 1.6);
  spokeShape.lineTo(-0.07, 1.6);
  spokeShape.quadraticCurveTo(-0.09, 1.0, -0.11, 0.38);
  const spokeGeo = new THREE.ExtrudeGeometry(spokeShape, {
    depth: 0.12, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 4, curveSegments: 16,
  });
  const SPOKES = 5;
  for (let i = 0; i < SPOKES; i++) {
    for (const offset of [-0.13, 0.13]) {
      const s = new THREE.Mesh(spokeGeo, spokeMat);
      s.rotation.z = (i / SPOKES) * Math.PI * 2 + offset;
      s.position.z = 0.32;
      spin.add(s);
    }
  }

  // Hub, centre cap and lug nuts
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.3, 64), gunmetal);
  hub.rotation.x = Math.PI / 2;
  hub.position.z = 0.36;
  spin.add(hub);

  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.22, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), chrome);
  cap.rotation.x = Math.PI / 2;
  cap.position.z = 0.5;
  spin.add(cap);

  const nutGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.12, 6);
  for (let i = 0; i < SPOKES; i++) {
    const a = (i / SPOKES) * Math.PI * 2 + Math.PI / SPOKES;
    const n = new THREE.Mesh(nutGeo, chrome);
    n.rotation.x = Math.PI / 2;
    n.position.set(Math.cos(a) * 0.32, Math.sin(a) * 0.32, 0.54);
    spin.add(n);
  }

  // Brake disc (spins) with drilled holes
  const discMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.07, 96), disc);
  discMesh.rotation.x = Math.PI / 2;
  discMesh.position.z = -0.12;
  spin.add(discMesh);
  const holeGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.08, 12);
  const holeMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
  for (let ring = 0; ring < 2; ring++) {
    const count = 24;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + ring * (Math.PI / count);
      const h = new THREE.Mesh(holeGeo, holeMat);
      h.rotation.x = Math.PI / 2;
      h.position.set(Math.cos(a) * (0.95 + ring * 0.16), Math.sin(a) * (0.95 + ring * 0.16), -0.08);
      spin.add(h);
    }
  }

  // Caliper (does not spin)
  const caliperShape = new THREE.Shape();
  caliperShape.absarc(0, 0, 1.32, Math.PI * 0.12, Math.PI * 0.42, false);
  caliperShape.absarc(0, 0, 0.98, Math.PI * 0.42, Math.PI * 0.12, true);
  const caliper = new THREE.Mesh(
    new THREE.ExtrudeGeometry(caliperShape, { depth: 0.22, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 4, curveSegments: 32 }),
    caliperMat
  );
  caliper.position.z = -0.08;
  root.add(caliper);

  /* ---------- Lights ---------- */
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(4, 5, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(accent, 2.4);
  rim.position.set(-6, -2, -3);
  scene.add(rim);
  scene.add(new THREE.AmbientLight(0xffffff, 0.15));

  /* ---------- Floating particles (dust in the light) ---------- */
  const COUNT = 140;
  const pos = new Float32Array(COUNT * 3);
  const speeds = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 12;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 8;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 6;
    speeds[i] = 0.002 + Math.random() * 0.006;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
    color: accent, size: 0.025, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  scene.add(particles);

  /* ---------- Layout ---------- */
  let isMobile = false;
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    isMobile = w < 760;
    // Desktop: wheel sits right of the copy. Mobile: centred above it.
    if (isMobile) {
      root.position.set(0, 0, 0);
      root.scale.setScalar(Math.min(0.95, w / 420));
      camera.fov = 38;
    } else {
      root.position.set(Math.min(3.2, camera.aspect * 1.5), 0, 0);
      root.scale.setScalar(0.82);
      camera.fov = 32;
    }
    camera.updateProjectionMatrix();
  }
  resize();
  new ResizeObserver(resize).observe(canvas);

  /* ---------- Interaction ---------- */
  const target = { x: 0, y: 0 };
  const current = { x: 0, y: 0 };
  window.addEventListener('pointermove', (e) => {
    target.x = (e.clientX / window.innerWidth - 0.5) * 2;
    target.y = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  let scrollY = 0;
  window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

  /* ---------- Loop ---------- */
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);

  const baseTiltY = -0.7;
  const baseTiltX = 0.12;
  const clock = new THREE.Clock();

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    current.x += (target.x - current.x) * 0.04;
    current.y += (target.y - current.y) * 0.04;

    spin.rotation.z -= dt * 0.35;
    root.rotation.y = (isMobile ? -0.45 : baseTiltY) + current.x * 0.25 + Math.sin(t * 0.3) * 0.04;
    root.rotation.x = baseTiltX + current.y * 0.15;
    // gentle float + parallax on scroll
    root.position.y = 0 + Math.sin(t * 0.8) * 0.06 + scrollY * 0.0015;

    const p = pGeo.attributes.position.array;
    for (let i = 0; i < COUNT; i++) {
      p[i * 3 + 1] += speeds[i];
      if (p[i * 3 + 1] > 4) p[i * 3 + 1] = -4;
    }
    pGeo.attributes.position.needsUpdate = true;
    particles.rotation.y = current.x * 0.1;

    rim.position.x = -6 + Math.sin(t * 0.5) * 2;

    renderer.render(scene, camera);
  }

  if (reduceMotion) {
    frame();
  } else {
    renderer.setAnimationLoop(() => {
      if (visible && !document.hidden) frame();
      else clock.getDelta();
    });
  }

  requestAnimationFrame(() => canvas.classList.add('is-ready'));
}
