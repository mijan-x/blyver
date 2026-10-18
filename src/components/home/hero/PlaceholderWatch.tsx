import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import type { Group } from "three";

// A stand-in wristwatch built from simple shapes, in Blyver's palette. It is
// only a placeholder: set `heroModel.url` (heroModel.ts) to show a real .glb.
// The dial faces +Z (towards the camera); the strap runs along Y.

const champagne = "#c8aa72";
const ink = "#12110f";
const ivory = "#f7f4ee";
const leather = "#2a2420";

const markers = Array.from({ length: 12 }, (_, index) => {
  const angle = (index / 12) * Math.PI * 2;
  const major = index % 3 === 0;
  return {
    key: index,
    angle,
    major,
    x: Math.sin(angle) * 0.74,
    y: Math.cos(angle) * 0.74,
  };
});

function Strap({ side }: { side: 1 | -1 }) {
  // Two leather segments per side, bending slightly away from the viewer.
  return (
    <group position={[0, side * 0.98, -0.06]}>
      <group rotation={[side * -0.12, 0, 0]}>
        <RoundedBox
          args={[0.82, 0.9, 0.1]}
          radius={0.035}
          smoothness={3}
          position={[0, side * 0.45, 0]}
        >
          <meshStandardMaterial color={leather} roughness={0.85} />
        </RoundedBox>
        <group position={[0, side * 0.88, 0]} rotation={[side * -0.28, 0, 0]}>
          <RoundedBox
            args={[0.8, 0.9, 0.1]}
            radius={0.035}
            smoothness={3}
            position={[0, side * 0.45, 0]}
          >
            <meshStandardMaterial color={leather} roughness={0.85} />
          </RoundedBox>
        </group>
      </group>
    </group>
  );
}

function PlaceholderWatch() {
  const hourHand = useRef<Group>(null);
  const minuteHand = useRef<Group>(null);
  const secondHand = useRef<Group>(null);

  // The hands show the visitor's real local time.
  useFrame(() => {
    const now = new Date();
    const seconds = now.getSeconds() + now.getMilliseconds() / 1000;
    const minutes = now.getMinutes() + seconds / 60;
    const hours = (now.getHours() % 12) + minutes / 60;
    if (secondHand.current)
      secondHand.current.rotation.z = -(seconds / 60) * Math.PI * 2;
    if (minuteHand.current)
      minuteHand.current.rotation.z = -(minutes / 60) * Math.PI * 2;
    if (hourHand.current)
      hourHand.current.rotation.z = -(hours / 12) * Math.PI * 2;
  });

  return (
    <group>
      {/* Case */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1, 1, 0.32, 96]} />
        <meshStandardMaterial color={champagne} metalness={1} roughness={0.28} />
      </mesh>
      {/* Bezel */}
      <mesh position={[0, 0, 0.16]}>
        <torusGeometry args={[0.96, 0.065, 32, 128]} />
        <meshStandardMaterial color={champagne} metalness={1} roughness={0.18} />
      </mesh>
      {/* Dial */}
      <mesh position={[0, 0, 0.165]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.9, 0.9, 0.02, 96]} />
        <meshStandardMaterial color={ink} metalness={0.3} roughness={0.45} />
      </mesh>
      {/* Hour markers */}
      {markers.map((marker) => (
        <mesh
          key={marker.key}
          position={[marker.x, marker.y, 0.185]}
          rotation={[0, 0, -marker.angle]}
        >
          <boxGeometry
            args={marker.major ? [0.05, 0.16, 0.02] : [0.03, 0.09, 0.02]}
          />
          <meshStandardMaterial
            color={champagne}
            metalness={1}
            roughness={0.2}
          />
        </mesh>
      ))}
      {/* Hands */}
      <group ref={hourHand} position={[0, 0, 0.2]}>
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[0.055, 0.44, 0.015]} />
          <meshStandardMaterial color={ivory} metalness={0.6} roughness={0.3} />
        </mesh>
      </group>
      <group ref={minuteHand} position={[0, 0, 0.215]}>
        <mesh position={[0, 0.3, 0]}>
          <boxGeometry args={[0.035, 0.64, 0.015]} />
          <meshStandardMaterial color={ivory} metalness={0.6} roughness={0.3} />
        </mesh>
      </group>
      <group ref={secondHand} position={[0, 0, 0.23]}>
        <mesh position={[0, 0.26, 0]}>
          <boxGeometry args={[0.012, 0.76, 0.01]} />
          <meshStandardMaterial color={champagne} metalness={1} roughness={0.2} />
        </mesh>
      </group>
      <mesh position={[0, 0, 0.24]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.03, 32]} />
        <meshStandardMaterial color={champagne} metalness={1} roughness={0.2} />
      </mesh>
      {/* Glass */}
      <mesh position={[0, 0, 0.255]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.92, 0.92, 0.015, 96]} />
        <meshStandardMaterial
          color={ivory}
          transparent
          opacity={0.08}
          metalness={0}
          roughness={0}
        />
      </mesh>
      {/* Crown */}
      <mesh position={[1.08, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.09, 0.09, 0.16, 32]} />
        <meshStandardMaterial color={champagne} metalness={1} roughness={0.3} />
      </mesh>
      {/* Lugs */}
      {[-1, 1].map((x) =>
        [-1, 1].map((y) => (
          <mesh key={`${x}${y}`} position={[x * 0.32, y * 0.94, -0.02]}>
            <boxGeometry args={[0.16, 0.34, 0.2]} />
            <meshStandardMaterial
              color={champagne}
              metalness={1}
              roughness={0.28}
            />
          </mesh>
        )),
      )}
      <Strap side={1} />
      <Strap side={-1} />
    </group>
  );
}

export default PlaceholderWatch;
