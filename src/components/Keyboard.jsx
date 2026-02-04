import { ContactShadows, Environment, OrbitControls, OrthographicCamera, PerspectiveCamera } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { useRef, useState } from "react"

import gsap from "gsap"
import * as THREE from "three"
import { JellySphere } from "./Jelly"
import { useGSAP } from "@gsap/react"
import HologramPlane from "./HologramPlane"
import { useMidiController, useMidiFilePlayer } from "../utils/midiHelper"
import { Bloom, EffectComposer } from "@react-three/postprocessing"
import KeyboardModel from "./KeyboardModel"



const Keyboard = () => {

  const CameraRef = useRef(null);
  const canvasRef = useRef(null);

  const [isPerspective, setIsPerspective] = useState(true);

  const { contextSafe } = useGSAP();

  const handelSettingOpen = contextSafe((event) => {
    if (event) event.stopPropagation();
    console.log("Sequence started");

    if (isPerspective) {
      gsap.to(CameraRef.current.position, {
        x: 0,
        y: 4.35,
        z: 0,
        duration: 1.2,
        ease: "power2.inOut",
        onUpdate: () => CameraRef.current.lookAt(0, 0, 0),
        onComplete: () => {
          setIsPerspective(false);
        }
      });
    } else {
      setIsPerspective(true);
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
  
  // const {noteStates,drumStates,isPlaying,play,stop} = useMidiFilePlayer("/samples/interstellarMidi.mid",120,(states) => console.log(states))
  // const playMidi = ()=>{
  //   console.log("Play MIDI clicked");
  //   if(!isPlaying){
  //     play();
  //   }else{
  //     stop();
  //   }
  // }

  console.log("noteStates:", noteStates);
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
        toneMapping: THREE.ACESFilmicToneMapping,
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

      <mesh position={[3,0.3,0]} rotation={[-Math.PI/2,0,0]} >
        <circleGeometry args={[0.2,50]}/>
        <meshBasicMaterial
          color={"#ffffff00"}
        />
      </mesh>
      <JellySphere handelSettingOpen={handelSettingOpen} />
      <HologramPlane noteStates={noteStates.noteStates}/>
      <KeyboardModel states={noteStates} />
      <Environment preset="city" />
      <EffectComposer>
        <Bloom luminanceThreshold={3.0} luminanceSmoothing={1.0} mipmapblur/>
      </EffectComposer>
      <ContactShadows width={10} height={10} position={[0, -0.5, 0]} opacity={0.4} blur={0.01} />
    </Canvas>

  )
}

export default Keyboard
