import { ContactShadows, Environment, OrbitControls, OrthographicCamera, PerspectiveCamera, useGLTF } from "@react-three/drei"
import { Canvas, useFrame } from "@react-three/fiber"
import { Suspense, useEffect, useRef, useState } from "react"

import gsap from "gsap"
import * as THREE from "three"
import { JellySphere } from "./Jelly"
import { useGSAP } from "@gsap/react"
import HologramPlane from "./HologramPlane"
import { useMidiController } from "../utils/midiHelper"
import { Bloom, EffectComposer } from "@react-three/postprocessing"


const KeyboardModel = ({ noteStates }) => {
  const { nodes } = useGLTF("/keyboard.glb");
  const groups = useRef({
    keys: [],
    drumPads: [],
    envelopeButtons: [],
    sliders: []
  });

  const addToGroup = (groupName) => (el) => {
    if (el && !groups.current[groupName].includes(el)) {
      groups.current[groupName].push(el);
    }
  };

  useFrame(() => {
    groups.current.keys.forEach((keyMesh, index) => {
      if (keyMesh) {
        const isPressed = noteStates[index] === 1;
        gsap.to(keyMesh.material,{
          emissiveIntensity: isPressed? 2.0:0,
          overwrite:"auto",
          duration:0.05,
          ease:'linear',
        })
        
        
        // Animate key press/release with smooth transition
        gsap.to(keyMesh.rotation, {
          x: isPressed ?  Math.PI/100: 0,
          duration: 0.05,
          overwrite: 'auto',
          ease: "linear"
        });
      }
    });
  });

  return (
    <Suspense fallback={null}>
      <group dispose={null} scale={10}>
        {Object.values(nodes)
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((node) => {
          if (!node.isMesh) return null;

          if (node.name.startsWith('KEY')) {
            return (
              <mesh
                key={node.name}
                ref={addToGroup('keys')}
                geometry={node.geometry}
                material={node.material}
                position={node.position}
                scale={node.scale}
              />
            );
          }

          if (node.name.includes('drumPadButton')) {
            return (
              <mesh
                key={node.name}
                ref={addToGroup('drumPads')}
                geometry={node.geometry}
                material={node.material}
                position={node.position}
                scale={node.scale}
              />
            );
          }

          if (node.name.includes('envelopButton')) {
            return (
              <mesh
                key={node.name}
                ref={addToGroup('envelopeButtons')}
                geometry={node.geometry}
                material={node.material}
                position={node.position}
                scale={node.scale}
              />
            );
          }

          if (node.name.includes('slider')) {
            return (
              <mesh
                key={node.name}
                ref={addToGroup('sliders')}
                geometry={node.geometry}
                material={node.material}
                position={node.position}
                scale={node.scale}
              />
            );
          }

          return (
            <mesh
              key={node.name}
              geometry={node.geometry}
              material={node.material}
              position={node.position}
              scale={node.scale}
            />
          );
        })}
      </group>
    </Suspense>
  );
};

const Keyboard = () => {

  const CameraRef = useRef(null);
  const canvasRef = useRef(null);

  const [isPerspective, setIsPerspective] = useState(true);

  const { contextSafe } = useGSAP();

  const handelSettingOpen = contextSafe((event) => {
    if (event) event.stopPropagation();
    console.log("Sequence started");

    if (isPerspective) {
      // --- MODE: PERSPECTIVE TO ORTHO ---
      // 1. First, animate the Perspective camera to the top-down position
      gsap.to(CameraRef.current.position, {
        x: 0,
        y: 4.35,
        z: 0,
        duration: 1.2,
        ease: "power2.inOut",
        onUpdate: () => CameraRef.current.lookAt(0, 0, 0),
        onComplete: () => {
          // 2. ONLY after moving, switch the state to Ortho
          setIsPerspective(false);
        }
      });
    } else {
      // --- MODE: ORTHO TO PERSPECTIVE ---
      // 1. Switch to Perspective instantly so we can see the movement
      setIsPerspective(true);

      // 2. Use a tiny timeout or gsap.fromTo to ensure the ref is active
      // We move the Perspective camera FROM the top [0,1,0] TO the angle [0,3,3]
      gsap.fromTo(CameraRef.current.position,
        { x: 0, y: 4.35, z: 0 },
        {
          x: 0,
          y: 3,
          z: 3,
          duration: 1.2,
          ease: "power2.inOut",
          onUpdate: () => CameraRef.current.lookAt(0, 0, 0)
        }
      );
    }
  });

  const noteStates = useMidiController(48, 36);

  return (
    <Canvas
      ref={canvasRef}
      flat
      orthographic
      camera={{
        position: [0, 1, 0],
        near: 0.1,
        far: 10,
        zoom: 150,
      }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping, // The gold standard
        outputEncoding: THREE.sRGBEncoding
      }}
      style={{ width: "100vw", height: "100vh",background:"#f5f5f5"}}>
      {
        isPerspective && (
          <OrbitControls />
        )
      }
      <PerspectiveCamera ref={CameraRef} position={[0, 3, 3]} fov={50} makeDefault={isPerspective} />
      <OrthographicCamera
        makeDefault={!isPerspective}
        position={[0, 1, 0]}
        zoom={150}
        near={0.1}
        far={10}
        onUpdate={(self) => {
          self.lookAt(0, 0, 0);
          self.updateProjectionMatrix();
        }}
      />

      <JellySphere handelSettingOpen={handelSettingOpen} />
      <HologramPlane noteStates={noteStates}/>
      <KeyboardModel noteStates={noteStates} />
      <Environment preset="city" />
      <EffectComposer>
        <Bloom luminanceThreshold={4.0} luminanceSmoothing={1.0} mipmapblur/>
      </EffectComposer>
      <ContactShadows width={10} height={10} position={[0, -0.5, 0]} opacity={0.4} blur={0.01} />
    </Canvas>
  )
}

export default Keyboard
