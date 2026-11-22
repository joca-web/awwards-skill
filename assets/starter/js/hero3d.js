/* hero3d.js: ONE Three.js scene behind the hero. A lattice of rounded columns whose heights ripple, react to the pointer
   and follow scroll. Colours are read from the Astryx tokens, so light/dark and any token change repaint it.
   Professional defaults, all of them on purpose:
   - three is imported dynamically: if the CDN or WebGL fails the page still works (poster gradient, canvas hidden)
   - transparent canvas over the CSS background; image-based lighting (RoomEnvironment) + one key light, no shadows
   - pixel ratio capped at 2 and dropped to 1 if the frame rate stays low
   - the loop stops when the hero is off screen or the tab is hidden; reduced motion renders still frames only
   - one clock: the GSAP ticker (falls back to requestAnimationFrame)
   - context loss handled, everything disposed on pagehide
   Returns { ready: Promise<boolean>, intro(), setProgress(p), refreshColors(), destroy() }. */
const webglOk = () => { try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; } };
const token = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export function createHero(canvas, { reduce }) {
  const api = { ready: null, intro() {}, setProgress() {}, refreshColors() {}, destroy() {} };

  api.ready = (async () => {
    if (!canvas || !webglOk()) { if (canvas) canvas.dataset.state = 'fallback'; return false; }
    let THREE, RoomEnvironment, RoundedBoxGeometry;
    try {
      THREE = await import('three');
      ({ RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js'));
      ({ RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js'));
    } catch { canvas.dataset.state = 'fallback'; return false; }

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    let pr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(pr);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTexture;
    scene.environmentIntensity = 0.9;
    const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(4, 9, 6); scene.add(key);

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
    const group = new THREE.Group(); scene.add(group);

    const N = 11, STEP = 0.76, SIZE = 0.56;
    const geometry = new RoundedBoxGeometry(1, 1, 1, 3, 0.14);
    const material = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.42, metalness: 0.0, clearcoat: 0.35, clearcoatRoughness: 0.35 });
    const mesh = new THREE.InstancedMesh(geometry, material, N * N);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    group.add(mesh);

    const cA = new THREE.Color(), cB = new THREE.Color(), tmp = new THREE.Color();
    const refreshColors = () => { cA.set(token('--ds-surface') || '#ffffff'); cB.set(token('--ds-accent') || '#1b1b1b'); };
    refreshColors();

    const pos = []; for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) pos.push([(i - (N - 1) / 2) * STEP, (j - (N - 1) / 2) * STEP]);
    const dummy = new THREE.Object3D();
    const smooth = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };   // taller columns take the accent colour

    const s = { intro: reduce ? 1 : 0, progress: 0, px: 0, py: 0, tx: 0, ty: 0, time: 0, hx: 99, hz: 99, hasPtr: false };
    const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3(), ndc = new THREE.Vector2();

    function layout() {
      const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      const wide = camera.aspect > 1.15;
      group.position.set(wide ? 4.2 : 0, wide ? -0.2 : 2.0, 0);
      const k = wide ? 0.92 : Math.min(0.8, camera.aspect * 0.95);
      group.scale.setScalar(k);
      camera.updateProjectionMatrix();
    }

    function frame(dt) {
      s.time += dt;
      const damp = 1 - Math.exp(-dt * 5);
      s.px += (s.tx - s.px) * damp; s.py += (s.ty - s.py) * damp;

      // pointer -> point on the ground plane (for the ripple)
      if (!reduce && s.hasPtr) { ndc.set(s.tx, s.ty); ray.setFromCamera(ndc, camera); if (ray.ray.intersectPlane(plane, hit)) { const local = group.worldToLocal(hit.clone()); s.hx = local.x; s.hz = local.z; } }

      group.rotation.y = 0.62 + s.px * 0.10 + s.progress * 0.9;
      group.rotation.x = s.py * 0.03;
      camera.position.set(0, 6.4 - s.progress * 1.2, 11.6 + s.progress * 2.5);
      camera.lookAt(group.position.x * 0.6, 0.2, 0);

      const intro = s.intro;
      for (let i = 0; i < pos.length; i++) {
        const [x, z] = pos[i];
        const wave = Math.sin(s.time * 0.9 + x * 0.62 + z * 0.41) * 0.32 + Math.sin(s.time * 0.55 - z * 0.7) * 0.18;
        const d2 = (x - s.hx) * (x - s.hx) + (z - s.hz) * (z - s.hz);
        const ripple = Math.exp(-d2 / 2.4) * 1.5;
        const edge = 1 - Math.min(1, Math.hypot(x - 0.6, z + 0.4) / 4.6);   // one tall mass, falling away to the edges
        const h = Math.max(0.05, (0.25 + edge * edge * 2.9 + wave + ripple) * intro * (1 - s.progress * 0.55));
        dummy.position.set(x, h / 2, z); dummy.scale.set(SIZE, h, SIZE); dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        mesh.setColorAt(i, tmp.copy(cA).lerp(cB, smooth(0.5, 3.0, h)));
      }
      mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      renderer.render(scene, camera);
    }

    // ---- loop control ----
    let visible = true, running = false, last = 0, slow = 0, frames = 0;
    const tick = () => {
      const t = performance.now() / 1000;
      const dt = Math.min(0.05, last ? t - last : 0.016); last = t;
      frame(dt);
      if (pr > 1 && ++frames > 60) { if (slow / frames > 1 / 40) { pr = 1; renderer.setPixelRatio(1); layout(); } frames = 0; slow = 0; } else slow += dt;
    };
    const start = () => { if (running || reduce || !visible || document.hidden) return; running = true; last = 0; window.gsap ? gsap.ticker.add(tick) : (function loop() { if (!running) return; tick(); requestAnimationFrame(loop); })(); };
    const stop = () => { if (!running) return; running = false; if (window.gsap) gsap.ticker.remove(tick); };
    const still = () => { if (reduce) { layout(); frame(0.016); } };

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }, { threshold: 0 });
    io.observe(canvas);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVis);
    const ro = new ResizeObserver(() => { layout(); if (!running) still(); }); ro.observe(canvas);
    const onMove = (e) => { s.hasPtr = true; s.tx = (e.clientX / innerWidth) * 2 - 1; s.ty = -((e.clientY / innerHeight) * 2 - 1); };
    if (!reduce && matchMedia('(pointer: fine)').matches) addEventListener('pointermove', onMove, { passive: true });
    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); stop(); canvas.dataset.state = 'fallback'; });
    canvas.addEventListener('webglcontextrestored', () => { canvas.dataset.state = 'ready'; start(); });

    layout();
    frame(0.016);                       // first frame is drawn before ready resolves, so the preloader can wait for it
    canvas.dataset.state = 'ready';
    start();

    api.intro = () => { if (reduce) return; gsap.to(s, { intro: 1, duration: 2.4, ease: 'expo.out' }); };
    api.setProgress = (p) => { s.progress = p; };
    api.refreshColors = () => { refreshColors(); if (!running) still(); };
    api.destroy = () => {
      stop(); io.disconnect(); ro.disconnect(); document.removeEventListener('visibilitychange', onVis); removeEventListener('pointermove', onMove);
      geometry.dispose(); material.dispose(); envTexture.dispose(); pmrem.dispose(); renderer.dispose();
    };
    addEventListener('pagehide', api.destroy, { once: true });
    return true;
  })();

  return api;
}
