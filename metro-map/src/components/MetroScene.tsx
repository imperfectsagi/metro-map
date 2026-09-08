import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { RouteResult } from '../types/metro';
import metroData from '../data/metro-data.json';
import { allStations } from '../data/stations';
import type { Line } from '../types/metro';

interface Props {
  route: RouteResult;
}

export default function MetroScene({ route }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 360;

    // Track disposables so we can clean up fully on unmount / route change
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const textures: THREE.Texture[] = [];

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.Fog(0x0f172a, 8, 22);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 6, 8);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 3;
    controls.maxDistance = 18;
    controls.maxPolarAngle = Math.PI / 2.1;

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(5, 10, 7);
    scene.add(dir);

    // Ground plane subtle
    const groundGeo = new THREE.CircleGeometry(6, 48);
    const groundMat = new THREE.MeshBasicMaterial({ color: 0x1e293b, transparent: true, opacity: 0.6 });
    geometries.push(groundGeo);
    materials.push(groundMat);
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    scene.add(ground);

    // Build station lookup
    const stationPos = new Map<string, THREE.Vector3>();
    for (const s of allStations) {
      stationPos.set(s.id, new THREE.Vector3(s.x, 0, -s.y)); // y up, map y -> -z
    }

    // Route station set
    const routeStationSet = new Set(route.stations);
    const interchangeSet = new Set(route.interchanges);
    const usedLines = new Set(route.segments.map((s) => s.lineId));

    // Draw all lines (faded if not used)
    const lineGroup = new THREE.Group();
    for (const line of metroData.lines as Line[]) {
      const isUsed = usedLines.has(line.id);
      const points: THREE.Vector3[] = [];
      for (const sid of line.stations) {
        const p = stationPos.get(sid);
        if (p) points.push(p.clone());
      }
      if (points.length < 2) continue;

      const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.3);
      const tubeGeo = new THREE.TubeGeometry(curve, Math.max(points.length * 4, 20), isUsed ? 0.035 : 0.018, 6, false);
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(line.colour),
        transparent: true,
        opacity: isUsed ? 1 : 0.12,
      });
      geometries.push(tubeGeo);
      materials.push(mat);
      const mesh = new THREE.Mesh(tubeGeo, mat);
      lineGroup.add(mesh);
    }
    scene.add(lineGroup);

    // Highlight route path more strongly
    const routePoints: THREE.Vector3[] = [];
    for (const sid of route.stations) {
      const p = stationPos.get(sid);
      if (p) routePoints.push(p.clone().setY(0.02));
    }
    // Cache one curve for both the highlighted tube and the train animation (avoid rebuilding every frame)
    const routeCurve =
      routePoints.length >= 2 ? new THREE.CatmullRomCurve3(routePoints, false, 'catmullrom', 0.25) : null;

    if (routeCurve) {
      const routeTube = new THREE.TubeGeometry(routeCurve, routePoints.length * 6, 0.05, 8, false);
      const mainColour = route.segments[0]?.colour || '#ffffff';
      const routeMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(mainColour), transparent: true, opacity: 0.95 });
      geometries.push(routeTube);
      materials.push(routeMat);
      scene.add(new THREE.Mesh(routeTube, routeMat));
    }

    // Station markers
    const markerGroup = new THREE.Group();
    for (const s of allStations) {
      const pos = stationPos.get(s.id);
      if (!pos) continue;
      const onRoute = routeStationSet.has(s.id);
      const isStart = s.id === route.from;
      const isEnd = s.id === route.to;
      const isInter = interchangeSet.has(s.id);

      let size = 0.04;
      let color = 0x64748b;
      if (onRoute) {
        size = 0.07;
        color = 0xffffff;
      }
      if (isInter) {
        size = 0.1;
        color = 0xfbbf24;
      }
      if (isStart) {
        size = 0.13;
        color = 0x22c55e;
      }
      if (isEnd) {
        size = 0.13;
        color = 0xef4444;
      }

      const geo = new THREE.SphereGeometry(size, 12, 12);
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: onRoute || isStart || isEnd ? 1 : 0.15,
      });
      geometries.push(geo);
      materials.push(mat);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      mesh.position.y = size;
      markerGroup.add(mesh);

      // Labels only for important stations
      if (isStart || isEnd || isInter) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = 'rgba(15,23,42,0.85)';
        ctx.roundRect(0, 8, 256, 48, 12);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 22px system-ui,sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(s.name.length > 18 ? s.name.slice(0, 16) + '…' : s.name, 128, 40);

        const tex = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
        textures.push(tex);
        materials.push(spriteMat);
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(1.4, 0.35, 1);
        sprite.position.copy(pos);
        sprite.position.y = size + 0.35;
        markerGroup.add(sprite);
      }
    }
    scene.add(markerGroup);

    // Animated train dot
    let trainT = 0;
    const trainGeo = new THREE.SphereGeometry(0.08, 12, 12);
    const trainMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    geometries.push(trainGeo);
    materials.push(trainMat);
    const train = new THREE.Mesh(trainGeo, trainMat);
    if (routeCurve && routePoints.length >= 2) {
      train.position.copy(routePoints[0]);
      scene.add(train);
    }

    // Camera fly to route center
    let camAnimId = 0;
    if (routePoints.length) {
      const box = new THREE.Box3().setFromPoints(routePoints);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.z, 1);
      const targetPos = new THREE.Vector3(center.x, maxDim * 1.2 + 2, center.z + maxDim * 1.4);
      const startPos = camera.position.clone();
      let camT = 0;
      const animateCam = () => {
        camT += 0.02;
        if (camT < 1) {
          camera.position.lerpVectors(startPos, targetPos, easeOutCubic(camT));
          controls.target.lerp(center, 0.05);
          camAnimId = requestAnimationFrame(animateCam);
        }
      };
      camAnimId = requestAnimationFrame(animateCam);
    }

    // Animation loop
    let animId = 0;
    let disposed = false;
    const clock = new THREE.Clock();
    const animate = () => {
      if (disposed) return;
      animId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      controls.update();

      // move train along the cached curve (no per-frame allocation)
      if (routeCurve) {
        trainT = (trainT + dt * 0.12) % 1;
        const p = routeCurve.getPointAt(trainT);
        train.position.copy(p);
        train.position.y = 0.12;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 360;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      disposed = true;
      cancelAnimationFrame(animId);
      cancelAnimationFrame(camAnimId);
      window.removeEventListener('resize', onResize);
      controls.dispose();
      renderer.dispose();
      for (const g of geometries) g.dispose();
      for (const m of materials) m.dispose();
      for (const t of textures) t.dispose();
      container.innerHTML = '';
    };
  }, [route]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[45vh] touch-none"
      style={{ minHeight: '45vh' }}
      aria-label="Interactive 3D Metro map"
    />
  );
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}
