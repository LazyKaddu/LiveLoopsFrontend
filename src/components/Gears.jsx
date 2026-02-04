import React, { useEffect, useRef } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'


export function Gears(props) {
  const group = useRef();
  const { nodes, materials, animations } = useGLTF('/gears.glb')
  const { actions } = useAnimations(animations, group)
  useEffect(() => {
    // 1. Define the names of your animations
    const animationNames = ['Torus.001Action', 'Torus.002Action', 'Torus.003Action']

    // 2. Play each one
    animationNames.forEach((name) => {
      if (actions[name]) {
        actions[name].play()

        // Optional: If they look "glitchy" when starting, 
        // you can ensure they are set to loop (though it's the default)
        actions[name].setLoop(THREE.LoopRepeat, Infinity)
      }
    })

    // Clean up: stop animations when component unmounts
    return () => animationNames.forEach((name) => actions[name]?.stop())
  }, [actions])

  return (
    <group ref={group} position={[0.2,0.4,0]} scale={0.25} {...props} dispose={null}>
      <mesh
        name="Torus001"
        geometry={nodes.Torus001.geometry}
        material={materials['Material.001']}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        name="Torus002"
        geometry={nodes.Torus002.geometry}
        material={materials['Material.001']}
        position={[-2.262, -0.992, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        name="Torus003"
        geometry={nodes.Torus003.geometry}
        material={materials['Material.001']}
        position={[-0.896, -3.07, 0]}
        rotation={[-Math.PI / 2, -0.382, 0]}
      />
    </group>
  )
}

useGLTF.preload('/gears.glb')