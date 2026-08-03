import { useRef, useEffect, useState, useCallback, type FC } from 'react';
import * as THREE from 'three';

const DIRS = '子癸丑艮寅甲卯乙辰巽巳丙午丁未坤申庚酉辛戌乾亥壬'.match(/.{1,2}/g)!;
const TOTAL = DIRS.length; // 24

interface Props {
  value: string;  // current 坐
  onChange: (dir: string, opposite: string) => void;
}

const FengShuiCompass: FC<Props> = ({ value, onChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const rotationRef = useRef(0);
  const dragStart = useRef({ x: 0, y: 0, rot: 0 });
  const dragRef = useRef(false);
  const animRef = useRef<number>(0);
  const targetRotationRef = useRef(0);
  const labelsRef = useRef<THREE.Sprite[]>([]);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const pointerRef = useRef<THREE.Mesh | null>(null);

  const getDirFromAngle = useCallback((angle: number) => {
    const normalized = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const idx = Math.round((normalized / (Math.PI * 2)) * TOTAL) % TOTAL;
    return DIRS[idx];
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 8, 0);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const size = Math.min(container.clientWidth, 400);
    renderer.setSize(size, size);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);

    // Main group
    const group = new THREE.Group();
    scene.add(group);
    groupRef.current = group;

    // Base disk
    const diskGeo = new THREE.CylinderGeometry(3.5, 3.5, 0.15, 64);
    const diskMat = new THREE.MeshStandardMaterial({ color: 0x8b4513, metalness: 0.1, roughness: 0.7 });
    const disk = new THREE.Mesh(diskGeo, diskMat);
    group.add(disk);

    // Inner ring (lighter)
    const innerRing = new THREE.TorusGeometry(3.2, 0.06, 16, 64);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0xf5ecdb, metalness: 0.3, roughness: 0.4 });
    group.add(new THREE.Mesh(innerRing, ringMat));

    // Outer ring
    const outerRing = new THREE.TorusGeometry(3.5, 0.1, 16, 64);
    group.add(new THREE.Mesh(outerRing, new THREE.MeshStandardMaterial({ color: 0xf5ecdb, metalness: 0.5, roughness: 0.3 })));

    // Direction markers as small cylinders
    const markerGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 8);
    const markerMat = new THREE.MeshStandardMaterial({ color: 0x5a3f23 });
    for (let i = 0; i < TOTAL; i++) {
      const angle = (i / TOTAL) * Math.PI * 2;
      const radius = 3.5;
      const marker = new THREE.Mesh(markerGeo, markerMat);
      marker.position.set(Math.cos(angle) * radius, 0.27, -Math.sin(angle) * radius);
      // Make it taller for cardinal directions
      if (i % 3 === 0) {
        marker.scale.y = 1.8;
        (marker.material as THREE.MeshStandardMaterial).color.set(0xc8a96e);
      }
      group.add(marker);
    }

    // Label sprites
    const labels: THREE.Sprite[] = [];
    for (let i = 0; i < TOTAL; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#5a3f23';
      ctx.font = `bold 28px "KaiTi", "Microsoft YaHei", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(DIRS[i], 32, 32);

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(0.9, 0.9, 1);
      const angle = (i / TOTAL) * Math.PI * 2;
      const radius = 4.2;
      sprite.position.set(Math.cos(angle) * radius, 0.08, -Math.sin(angle) * radius);
      sprite.userData = { index: i, dir: DIRS[i] };
      group.add(sprite);
      labels.push(sprite);
    }
    labelsRef.current = labels;

    // Center dome
    const domeGeo = new THREE.SphereGeometry(0.8, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMat = new THREE.MeshStandardMaterial({ color: 0xd4a574, metalness: 0.3, roughness: 0.4 });
    group.add(new THREE.Mesh(domeGeo, domeMat));

    // Pointer (fixed, doesn't rotate - marks 午/南方 at top)
    const pointerGroup = new THREE.Group();
    const pointerGeo = new THREE.ConeGeometry(0.15, 0.6, 8);
    const pointerMat = new THREE.MeshStandardMaterial({ color: 0xd41b2c, emissive: 0x440000 });
    const pointer = new THREE.Mesh(pointerGeo, pointerMat);
    pointer.position.y = 1.8;
    pointer.rotation.x = Math.PI;
    pointerRef.current = pointer;
    pointerGroup.add(pointer);
    // Small base
    const baseGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8);
    const baseMesh = new THREE.Mesh(baseGeo, new THREE.MeshStandardMaterial({ color: 0xd41b2c }));
    baseMesh.position.y = 0.9;
    pointerGroup.add(baseMesh);
    scene.add(pointerGroup);

    // Initial rotation to match value
    const initIdx = DIRS.indexOf(value);
    if (initIdx >= 0) {
      const initAngle = -(initIdx / TOTAL) * Math.PI * 2;
      group.rotation.y = initAngle;
      rotationRef.current = initAngle;
    }

    // Animation loop
    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      if (!dragRef.current && groupRef.current) {
        const diff = targetRotationRef.current - groupRef.current.rotation.y;
        if (Math.abs(diff) > 0.001) {
          groupRef.current.rotation.y += diff * 0.15;
          rotationRef.current = groupRef.current.rotation.y;
        }
      }
      renderer.render(scene, camera);
    };
    animate();

    // Raycaster for hover
    const raycasterObj = new THREE.Raycaster();
    const mouseVec = new THREE.Vector2();

    const onMouseMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycasterObj.setFromCamera(mouseVec, camera);
      const intersects = raycasterObj.intersectObjects(labels);
      if (intersects.length > 0) {
        const obj = intersects[0].object as THREE.Sprite;
        const dir = obj.userData.dir as string;
        setHovered(dir);
        container.style.cursor = 'pointer';
      } else {
        setHovered(null);
        container.style.cursor = 'grab';
      }
    };

    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycasterObj.setFromCamera(mouseVec, camera);
      const intersects = raycasterObj.intersectObjects(labels);
      if (intersects.length > 0 && groupRef.current) {
        const obj = intersects[0].object as THREE.Sprite;
        const idx = obj.userData.index as number;
        const dir = DIRS[idx];
        const opp = DIRS[(idx + 12) % TOTAL];
        // snap to that direction
        const targetAngle = -(idx / TOTAL) * Math.PI * 2;
        targetRotationRef.current = targetAngle;
        onChange(dir, opp);
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      dragRef.current = true;
      dragStart.current = { x: e.clientX, y: e.clientY, rot: rotationRef.current };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragRef.current || !groupRef.current) return;
      const dx = e.clientX - dragStart.current.x;
      const sensitivity = 0.008;
      const newRot = dragStart.current.rot + dx * sensitivity;
      groupRef.current.rotation.y = newRot;
      rotationRef.current = newRot;
      targetRotationRef.current = newRot;

      // Live update direction while dragging
      const dir = getDirFromAngle(-newRot);
      const idx = DIRS.indexOf(dir);
      const opp = DIRS[(idx + 12) % TOTAL];
      setHovered(dir);
      onChange(dir, opp);
    };

    const onPointerUp = () => {
      // Snap to nearest direction
      if (!groupRef.current) return;
      const currentDir = getDirFromAngle(-groupRef.current.rotation.y);
      const idx = DIRS.indexOf(currentDir);
      const snapAngle = -(idx / TOTAL) * Math.PI * 2;
      targetRotationRef.current = snapAngle;
      const opp = DIRS[(idx + 12) % TOTAL];
      onChange(currentDir, opp);
      dragRef.current = false;
    };

    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('click', onClick);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      cancelAnimationFrame(animRef.current);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('click', onClick);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const oppIndex = (DIRS.indexOf(value) + 12) % TOTAL;
  const opposite = DIRS[oppIndex];

  return (
    <div className="flex flex-col items-center gap-3">
      <div ref={containerRef} className="relative aspect-square w-full max-w-[360px]" />
      <div className="flex gap-4 text-center">
        <div className="rounded-xl bg-bronze/10 px-4 py-2 border border-bronze/30">
          <div className="text-[10px] text-inkstone-mute">坐山</div>
          <div className="text-xl font-kai font-bold text-bronze-dark">{value}</div>
        </div>
        <div className="flex items-center text-3xl text-bronze/40">⟷</div>
        <div className="rounded-xl bg-bronze/10 px-4 py-2 border border-bronze/30">
          <div className="text-[10px] text-inkstone-mute">朝向</div>
          <div className="text-xl font-kai font-bold text-bronze-dark">{opposite}</div>
        </div>
      </div>
      {hovered && (
        <p className="text-xs text-inkstone-soft">
          悬停：{hovered} ▸ 点击选择 或 拖拽旋转
        </p>
      )}
    </div>
  );
};

export default FengShuiCompass;
