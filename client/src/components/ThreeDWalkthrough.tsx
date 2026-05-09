import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

interface LayoutData {
  metadata?: {
    globalRotation?: number;
  };
  walls: Array<{
    start: { x: number; y: number };
    end: { x: number; y: number };
    thickness: number;
  }>;
  rooms: Array<{
    name: string;
    type: string;
    bounds: { x: number; y: number; w: number; h: number };
  }>;
  furniture: Array<{
    type: string;
    label: string;
    position: { x: number; y: number };
    rotation: number;
    scale: { w: number; h: number };
  }>;
}

interface ThreeDWalkthroughProps {
  layout: LayoutData;
}

// Map furniture labels to your LOCAL OBJ models (Case-insensitive matching)
const FURNITURE_MODELS: Record<string, string> = {
  'sofa': '/models/medium_sofa.obj',
  'sofa set': '/models/medium_sofa.obj',
  'lshape_sofa': '/models/LShape_sofa.obj',
  'l-shape sofa': '/models/LShape_sofa.obj',
  'king-bed': '/models/King_bed.obj',
  'king bed': '/models/King_bed.obj',
  'bed': '/models/King_bed.obj',
  'single-bed': '/models/single_bed.obj',
  'single bed': '/models/single_bed.obj',
  'table': '/models/table.obj',
  'dining table': '/models/Dinning_Table.obj',
  'dinning_table': '/models/Dinning_Table.obj',
  'door': '/models/Door.obj',
  'sink': '/models/sink.obj',
  'bath_tub': '/models/bath_tub.obj',
  'bathtub': '/models/bath_tub.obj',
  'study_table': '/models/study_table.obj',
  'study table': '/models/study_table.obj',
  'kitchen_platform': '/models/kitchen_platform.obj',
  'kitchen platform': '/models/kitchen_platform.obj',
  'countertop': '/models/kitchen_platform.obj',
};

// Offset to align model "Front" with our coordinate system (0 = right)
const ORIENTATION_OFFSETS: Record<string, number> = {
  'Bed': Math.PI / 2,
  'King-Bed': Math.PI / 2,
  'Single-Bed': Math.PI / 2,
  'Sofa': Math.PI,
  'LShape_sofa': Math.PI,
  'Dinning_Table': 0,
  'Sink': Math.PI,
  'Door': 0,
  'Kitchen_Platform': 0,
};

export const ThreeDWalkthrough: React.FC<ThreeDWalkthroughProps> = ({ layout }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // --- Setup Scene ---
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a); // Deep dark background
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 5000);
    camera.position.set(500, 800, 500);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    containerRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9); // Brighter ambient for softer shadows
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
    sunLight.position.set(200, 500, 100);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);

    // --- Floor ---
    const floorSize = 2000;
    const floorGeo = new THREE.PlaneGeometry(floorSize, floorSize);
    const floorMat = new THREE.MeshStandardMaterial({ 
      color: 0x050505, // Almost black floor for high contrast
      roughness: 0.9,
      metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Removed GridHelper to eliminate "border lines" on the floor

    // --- Rendering Layout ---
    const SCALE = 1000;
    const WALL_HEIGHT = 100;

    const toScene = (v: { x: number, y: number }) => ({
      x: (v.x - 0.5) * SCALE,
      z: (v.y - 0.5) * SCALE
    });

    // --- Global Rotation ---
    // Note: The backend now sends pre-straightened coordinates.
    // We only apply correction if the backend didn't already rotate them.
    let correctionAngle = 0;
    // If originalRotation is present, it means the backend ALREADY rotated the points.
    // So we don't apply correctionAngle here to avoid double-rotation.
    if (layout.metadata?.globalRotation !== undefined && (layout.metadata as any).originalRotation === undefined) {
      correctionAngle = -(layout.metadata.globalRotation * Math.PI / 180);
    }

    const housePivot = new THREE.Group();
    scene.add(housePivot);

    const wallMat = new THREE.MeshStandardMaterial({ 
      color: 0x333333, 
      roughness: 0.8,
      metalness: 0.1 
    });

    const windowMat = new THREE.MeshStandardMaterial({
      color: 0xadd8e6, // Light blue tint
      transparent: true,
      opacity: 0.4,
      roughness: 0.1,
      metalness: 0.9
    });

    // --- Process Walls with Door Cuts ---
    layout.walls.forEach(wall => {
      const p1 = toScene(wall.start);
      const p2 = toScene(wall.end);
      const dx = p2.x - p1.x;
      const dz = p2.z - p1.z;
      const totalLength = Math.sqrt(dx * dx + dz * dz);
      const angle = Math.atan2(dz, dx);
      const thickness = (wall.thickness || 0.01) * SCALE;
      const isWindow = (wall as any).type === 'window' || (wall as any).type === 'glass';

      // Find doors on this specific wall
      const doorsOnWall: Array<{ t: number, width: number }> = [];
      layout.furniture.forEach(item => {
        if (!item.label.toLowerCase().includes('door')) return;
        const dPos = toScene(item.position);
        
        let t = ((dPos.x - p1.x) * dx + (dPos.z - p1.z) * dz) / (totalLength * totalLength);
        if (t < 0 || t > 1) return;
        
        const projX = p1.x + t * dx;
        const projZ = p1.z + t * dz;
        const dist = Math.sqrt((dPos.x - projX) ** 2 + (dPos.z - projZ) ** 2);
        
        if (dist < 40) { // Door is on this wall
          const doorWidth = (item.scale?.w || 0.08) * SCALE;
          doorsOnWall.push({ t, width: doorWidth });
        }
      });

      if (doorsOnWall.length === 0) {
        createWallSegment(p1, p2, totalLength, angle, thickness, isWindow);
      } else {
        doorsOnWall.sort((a, b) => a.t - b.t);
        let currentT = 0;
        doorsOnWall.forEach(door => {
          const doorStartT = door.t - (door.width / 2) / totalLength;
          const doorEndT = door.t + (door.width / 2) / totalLength;

          if (doorStartT > currentT) {
            const segP1 = { x: p1.x + currentT * dx, z: p1.z + currentT * dz };
            const segP2 = { x: p1.x + doorStartT * dx, z: p1.z + doorStartT * dz };
            const segLen = totalLength * (doorStartT - currentT);
            createWallSegment(segP1, segP2, segLen, angle, thickness, isWindow);
          }
          currentT = Math.max(currentT, doorEndT);
        });

        if (currentT < 1) {
          const segP1 = { x: p1.x + currentT * dx, z: p1.z + currentT * dz };
          const segP2 = p2;
          const segLen = totalLength * (1 - currentT);
          createWallSegment(segP1, segP2, segLen, angle, thickness, isWindow);
        }
      }
    });

    function createWallSegment(p1: any, p2: any, length: number, angle: number, thickness: number, isGlass: boolean = false) {
      if (length < 1) return;
      const height = isGlass ? WALL_HEIGHT * 0.95 : WALL_HEIGHT;
      const wallGeo = new THREE.BoxGeometry(length, height, thickness);
      const wallMesh = new THREE.Mesh(wallGeo, isGlass ? windowMat : wallMat);
      wallMesh.position.set((p1.x + p2.x) / 2, height / 2, (p1.z + p2.z) / 2);
      wallMesh.rotation.y = -angle;
      wallMesh.castShadow = !isGlass;
      wallMesh.receiveShadow = true;
      housePivot.add(wallMesh);
    }

    // --- Load Local OBJ Furniture Models ---
    const loader = new OBJLoader();
    const furnitureMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xcccccc, 
      roughness: 0.7, 
      metalness: 0.2 
    });

    layout.furniture.forEach(item => {
      let pos = toScene(item.position);
      const labelLower = item.label.toLowerCase();
      const isDoor = labelLower.includes('door');
      const itemType = item.label.split('-')[0].split('_')[0];
      
      let finalRotation = item.rotation || 0;
      finalRotation += ORIENTATION_OFFSETS[item.label] || ORIENTATION_OFFSETS[item.type] || ORIENTATION_OFFSETS[itemType] || 0;

      // --- Universal Wall Snapping & Alignment (Suggestion 3) ---
      if (layout.walls.length > 0) {
        let minDistance = Infinity;
        let snapPoint = { x: pos.x, z: pos.z };
        let wallAngle = 0;

        layout.walls.forEach(wall => {
          const p1 = toScene(wall.start);
          const p2 = toScene(wall.end);
          const dx = p2.x - p1.x;
          const dz = p2.z - p1.z;
          const lengthSq = dx * dx + dz * dz;
          if (lengthSq === 0) return;
          let t = ((pos.x - p1.x) * dx + (pos.z - p1.z) * dz) / lengthSq;
          t = Math.max(0, Math.min(1, t));
          const projX = p1.x + t * dx;
          const projZ = p1.z + t * dz;
          const dist = Math.sqrt((pos.x - projX) ** 2 + (pos.z - projZ) ** 2);
          if (dist < minDistance) {
            minDistance = dist;
            snapPoint = { x: projX, z: projZ };
            wallAngle = Math.atan2(dz, dx);
          }
        });

        // Snap logic: Only snap if very close, otherwise trust the "Icon Patch" AI rotation
        if (minDistance < 25) { 
          if (isDoor) {
             pos = { x: snapPoint.x, z: snapPoint.z };
             finalRotation = -wallAngle;
          } else {
             // Calculate difference between AI rotation and wall orientation
             // We normalize angles to [0, PI] for parallel checks
             const wallNorm = wallAngle % Math.PI;
             const itemNorm = finalRotation % Math.PI;
             const diff = Math.abs(wallNorm - itemNorm);
             const isNearParallel = diff < 0.4 || diff > Math.PI - 0.4; // ~22.5 degrees tolerance

             if (isNearParallel) {
               // Snap to perfectly parallel or perpendicular
               const relativeRot = finalRotation + wallAngle;
               const snappedRelative = Math.round(relativeRot / (Math.PI / 2)) * (Math.PI / 2);
               finalRotation = snappedRelative - wallAngle;
             }
          }
        }
      }

      const modelUrl = FURNITURE_MODELS[item.label.toLowerCase()] || FURNITURE_MODELS[item.type.toLowerCase()];
      if (modelUrl) {
        loader.load(modelUrl, (object) => {
          object.position.set(pos.x, 0, pos.z);
          object.rotation.y = finalRotation;
          
          const bbox = new THREE.Box3().setFromObject(object);
          const size = bbox.getSize(new THREE.Vector3());
          
          const isSink = labelLower.includes('sink');
          const isSofa = labelLower.includes('sofa');
          const isBed = labelLower.includes('bed');
          
          if (isDoor) {
            const desiredHeight = WALL_HEIGHT * 0.98; 
            const targetWidth = Math.max((item.scale?.w || 0.05), (item.scale?.h || 0.05)) * SCALE * 1.15; 
            
            const modelWidth = Math.max(size.x, size.z);
            const wScale = targetWidth / Math.max(modelWidth, 0.1);
            const hScale = desiredHeight / Math.max(size.y, 0.1);
            
            object.scale.set(wScale, hScale, hScale);
            object.rotation.y += Math.PI / 2;
          } else if (isSink) {
            const desiredSinkHeight = 45; 
            const sScale = desiredSinkHeight / Math.max(size.y, 0.1);
            object.scale.set(sScale, sScale, sScale);
            object.rotation.y += Math.PI; 
          } else if (isSofa || isBed) {
            const targetW = (item.scale?.w || 0.05) * SCALE;
            const targetH = (item.scale?.h || 0.05) * SCALE;
            const targetLength = Math.max(targetW, targetH);
            const modelLength = Math.max(size.x, size.z);
            
            // Use uniform scaling based on length
            const uniformScale = targetLength / Math.max(modelLength, 0.1);
            object.scale.set(uniformScale, uniformScale, uniformScale);
          } else if (labelLower.includes('kitchen_platform') || labelLower.includes('countertop')) {
            const boxW = (item.scale?.w || 0.1) * SCALE;
            const boxH = (item.scale?.h || 0.1) * SCALE;
            
            // 1. Determine the length we need to cover
            const targetLength = Math.max(boxW, boxH);
            
            // 2. Determine the model's longest dimension (usually X or Z)
            const modelMaxDim = Math.max(size.x, size.z);
            
            // 3. Calculate a SINGLE uniform scale factor
            const uniformScale = targetLength / Math.max(modelMaxDim, 0.1);
            
            // 4. Apply uniform scale to all axes (No stretching!)
            object.scale.set(uniformScale, uniformScale, uniformScale);

            // 5. Orientation: rotate 90 degrees if the box is vertical in the plan
            if (boxH > boxW) {
              object.rotation.y = Math.PI / 2;
            } else {
              object.rotation.y = 0;
            }

            // Add the detected rotation offset
            object.rotation.y += finalRotation;
          } else {
            const targetW = (item.scale?.w || 0.05) * SCALE;
            const targetH = (item.scale?.h || 0.05) * SCALE;
            const scaleX = targetW / Math.max(size.x, 0.1);
            const scaleZ = targetH / Math.max(size.z, 0.1);
            const uniformScale = Math.min(scaleX, scaleZ);
            object.scale.set(uniformScale, uniformScale, uniformScale);
          }

          const newBbox = new THREE.Box3().setFromObject(object);
          const minY = newBbox.min.y;
          object.position.y -= minY;

          object.traverse((node) => {
            if (node instanceof THREE.Mesh) {
              node.material = furnitureMaterial;
              node.castShadow = true;
              node.receiveShadow = true;
            }
          });
          housePivot.add(object);
        }, undefined, () => {
          addPlaceholderBox(item, pos, finalRotation);
        });
      } else {
        addPlaceholderBox(item, pos, finalRotation);
      }
    });

    function addPlaceholderBox(item: any, pos: { x: number, z: number }, rot: number) {
      const w = (item.scale?.w || 0.05) * SCALE;
      const h = (item.scale?.h || 0.05) * SCALE;
      let color = 0x3b82f6;
      if (item.label.toLowerCase().includes('bed')) color = 0x10b981;
      if (item.label.toLowerCase().includes('sofa')) color = 0xf59e0b;
      if (item.label.toLowerCase().includes('table')) color = 0x8b5cf6;

      const furnitureGeo = new THREE.BoxGeometry(w, 40, h);
      const furnitureMat = new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.8 });
      const furnitureMesh = new THREE.Mesh(furnitureGeo, furnitureMat);
      furnitureMesh.position.set(pos.x, 20, pos.z);
      furnitureMesh.rotation.y = rot;
      furnitureMesh.castShadow = true;
      furnitureMesh.receiveShadow = true;
      housePivot.add(furnitureMesh);
    }

    housePivot.rotation.y = correctionAngle;

    // --- Animation Loop ---
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(animationFrameId);
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      renderer.dispose();
    };
  }, [layout]);

  return (
    <div className="w-full h-full relative group">
      <div ref={containerRef} className="w-full h-full cursor-move" />
      <div className="absolute bottom-4 left-4 flex gap-2">
        <div className="bg-zinc-900/80 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-xl border border-zinc-800 flex items-center gap-2 text-[#d97706]">
          <div className="w-2 h-2 rounded-full bg-[#d97706] animate-pulse" />
          Interactive 3D Walkthrough
        </div>
      </div>
      <div className="absolute top-4 right-4 bg-zinc-900/50 hover:bg-zinc-900/80 backdrop-blur-md p-3 rounded-2xl transition-all cursor-help border border-zinc-800 opacity-0 group-hover:opacity-100 text-zinc-400">
        <p className="text-[10px] leading-relaxed">
          <span className="text-zinc-100 font-bold">Navigation Controls</span><br/>
          Left Click: Rotate Scene<br/>
          Right Click: Pan View<br/>
          Scroll: Zoom In/Out
        </p>
      </div>
    </div>
  );
};
