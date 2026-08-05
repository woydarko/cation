"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * Subtle interactive wave/grid of points behind the page. A gentle rolling
 * wave, plus a ripple that radiates from the mouse. Brand violet on the cloud
 * background, low opacity so text stays the focus. pointer-events are off so it
 * never blocks clicks; the mouse is tracked on the window instead.
 */
const vertex = /* glsl */ `
  uniform float uTime;
  uniform vec2 uMouse;
  varying float vElev;
  void main() {
    vec3 p = position;
    float wave = sin(p.x * 0.5 + uTime * 0.7) * 0.14
               + cos(p.y * 0.5 + uTime * 0.5) * 0.14;
    float d = distance(p.xy, uMouse);
    float ripple = exp(-d * d * 0.12) * 0.7 * sin(d * 2.6 - uTime * 3.0);
    p.z += wave + ripple;
    vElev = p.z;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = 2.6 * (300.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uColor;
  varying float vElev;
  void main() {
    float dd = distance(gl_PointCoord, vec2(0.5));
    if (dd > 0.5) discard;
    float a = smoothstep(0.5, 0.0, dd) * (0.28 + vElev * 0.32);
    gl_FragColor = vec4(uColor, a * 0.38);
  }
`;

function Field() {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const mouse = useRef(new THREE.Vector2(0, 0));
  const { size } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uColor: { value: new THREE.Color("#6C4CF1") },
    }),
    []
  );

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
    // ease mouse toward target for a smooth trailing ripple
    uniforms.uMouse.value.lerp(mouse.current, 0.08);
  });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      // map screen -> plane local space (before rotation)
      const nx = (e.clientX / size.width) * 2 - 1;
      const ny = -((e.clientY / size.height) * 2 - 1);
      mouse.current.set(nx * 24, ny * 16);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [size.width, size.height]);

  // Gentle tilt + a large plane so the field fills the whole viewport
  // (including the top), with a bit of depth from the tilt.
  return (
    <points rotation={[-Math.PI / 6, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[50, 34, 100, 68]} />
      <shaderMaterial
        ref={mat}
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </points>
  );
}

export default function WaveField() {
  // R3F's auto-measure can fire before layout settles (canvas stuck at 150px);
  // nudge it once on mount so the canvas fills the viewport.
  useEffect(() => {
    const fire = () => window.dispatchEvent(new Event("resize"));
    const ids = [80, 250, 600].map((ms) => setTimeout(fire, ms));
    return () => ids.forEach(clearTimeout);
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 0, 12], fov: 45 }}
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true }}
      style={{ background: "transparent", width: "100%", height: "100%", display: "block" }}
      resize={{ debounce: 0 }}
    >
      <Field />
    </Canvas>
  );
}
