import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Float, Lightformer, useGLTF } from "@react-three/drei";
import { MathUtils, type Group } from "three";
import type { MotionValue } from "motion/react";
import PlaceholderWatch from "./PlaceholderWatch";
import { heroModel } from "./heroModel";

// The WebGL part of the home hero. This file (and three.js with it) is
// lazy-loaded, so it never blocks the first paint of the page.

type HeroCanvasProps = {
  // 0 at the top of the hero, 1 when the hero has been scrolled through.
  progress: MotionValue<number>;
  // Pause rendering while the hero is off screen.
  active: boolean;
  reducedMotion: boolean;
  onReady: () => void;
};

function GltfModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

function ProductModel() {
  return (
    <group
      scale={heroModel.scale}
      rotation={heroModel.rotation}
      position={heroModel.position}
    >
      {heroModel.url ? (
        <GltfModel url={heroModel.url} />
      ) : (
        <PlaceholderWatch />
      )}
    </group>
  );
}

// Moves, turns and scales the model from the scroll position and pointer.
function Rig({
  progress,
  reducedMotion,
}: Pick<HeroCanvasProps, "progress" | "reducedMotion">) {
  const group = useRef<Group>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const viewport = useThree((state) => state.viewport);
  const portrait = viewport.aspect < 1;

  useEffect(() => {
    if (reducedMotion) return;
    const onMove = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (event.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reducedMotion]);

  useFrame((_, delta) => {
    const model = group.current;
    if (!model) return;
    const p = reducedMotion ? 0 : progress.get();
    const { x: px, y: py } = pointer.current;

    // Start beside the headline (desktop) or above it (phones), then glide to
    // the centre while making one full turn back to the front.
    const startX = portrait ? 0 : viewport.width * 0.2;
    const startY = portrait ? viewport.height * 0.17 : 0;
    const baseScale = portrait ? 0.62 : 0.92;
    const target = {
      x: MathUtils.lerp(startX, 0, p),
      y: MathUtils.lerp(startY, portrait ? 0.15 : 0.1, p),
      scale: baseScale * (1 + p * 0.12),
      rotX: MathUtils.lerp(-0.3, 0.05, p) - py * 0.12,
      rotY: MathUtils.lerp(-0.6, Math.PI * 2, p) + px * 0.25,
      rotZ: MathUtils.lerp(0.14, 0, p),
    };

    const ease = 5;
    model.position.x = MathUtils.damp(model.position.x, target.x, ease, delta);
    model.position.y = MathUtils.damp(model.position.y, target.y, ease, delta);
    model.rotation.x = MathUtils.damp(model.rotation.x, target.rotX, ease, delta);
    model.rotation.y = MathUtils.damp(model.rotation.y, target.rotY, ease, delta);
    model.rotation.z = MathUtils.damp(model.rotation.z, target.rotZ, ease, delta);
    model.scale.setScalar(
      MathUtils.damp(model.scale.x, target.scale, ease, delta),
    );
  });

  return (
    <group ref={group}>
      <Float
        enabled={!reducedMotion}
        speed={1.3}
        rotationIntensity={0.12}
        floatIntensity={0.35}
      >
        <Suspense fallback={null}>
          <ProductModel />
        </Suspense>
      </Float>
    </group>
  );
}

function HeroCanvas({
  progress,
  active,
  reducedMotion,
  onReady,
}: HeroCanvasProps) {
  return (
    <Canvas
      className="pointer-events-none"
      camera={{ position: [0, 0, 6], fov: 35 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      frameloop={active ? "always" : "never"}
      onCreated={onReady}
    >
      <ambientLight intensity={0.25} />
      <directionalLight position={[3, 4, 5]} intensity={1.2} />
      <spotLight
        position={[-4, 3, -3]}
        intensity={30}
        angle={0.6}
        penumbra={1}
        color="#c8aa72"
      />
      {/* Studio reflections built in code: no HDR file to download. */}
      <Environment resolution={256} frames={1}>
        <Lightformer
          form="rect"
          intensity={3}
          position={[0, 4, 3]}
          scale={[8, 2, 1]}
          color="#fff4e0"
        />
        <Lightformer
          form="rect"
          intensity={1.5}
          position={[-5, 0, 2]}
          scale={[2, 6, 1]}
        />
        <Lightformer
          form="ring"
          intensity={2}
          position={[4, 1, 4]}
          scale={2}
          color="#c8aa72"
        />
        <Lightformer
          form="rect"
          intensity={0.6}
          position={[0, -4, 2]}
          scale={[8, 1, 1]}
        />
      </Environment>
      <Rig progress={progress} reducedMotion={reducedMotion} />
    </Canvas>
  );
}

export default HeroCanvas;
