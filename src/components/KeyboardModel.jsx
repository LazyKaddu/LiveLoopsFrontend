import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import gsap from "gsap";
import * as THREE from "three";

const KeyboardModel = ({ states }) => {
    const noteStates = states.noteStates;
    const drumStates = states.drumStates;
    const { nodes } = useGLTF("/keyboard.glb");
    const groups = useRef({
        keys: [],
        drumPads: [],
        envelopeButtons: [],
        sliders: []
    });
    const drumPadInitialPositions = useRef({});

    const addToGroup = (groupName) => (el) => {
        if (el && !groups.current[groupName].includes(el)) {
            groups.current[groupName].push(el);
        }
    };

    useFrame(() => {
        groups.current.keys.forEach((keyMesh, index) => {
            if (keyMesh) {
                const isPressed = noteStates[index] === 1;
                gsap.to(keyMesh.material, {
                    emissiveIntensity: isPressed ? 2.0 : 0,
                    overwrite: "auto",
                    duration: 0.05,
                    ease: 'linear',
                })



                gsap.to(keyMesh.rotation, {
                    x: isPressed ? Math.PI / 100 : 0,
                    duration: 0.05,
                    overwrite: 'auto',
                    ease: "linear"
                });
            }
        });

        groups.current.drumPads.forEach((drumPadMesh, index) => {
            if (drumPadMesh) {

                if (!drumPadInitialPositions.current[index]) {
                    drumPadInitialPositions.current[index] = drumPadMesh.position.y;
                }

                const isPressed = drumStates[index] === 1;
                gsap.to(drumPadMesh.material, {
                    emissiveIntensity: isPressed ? 2.0 : 0,
                    overwrite: "auto",
                    duration: 0.05,
                    ease: 'linear',
                })


                if(isPressed){
                    gsap.to(drumPadMesh.position, {
                        y: drumPadInitialPositions.current[index] - 0.001,
                        duration: 0.05,
                        overwrite: 'auto',
                        ease: "linear"
                    });
                } else {
                    gsap.to(drumPadMesh.position, {
                        y: drumPadInitialPositions.current[index],
                        duration: 0.05,
                        overwrite: 'auto',
                        ease: "linear"
                    });
                }
            }
        });
    });

    const activeKnobRef = useRef(null);
    const lastY = useRef(0);

    const activeSliderRef = useRef(null);
    const lastZ = useRef(0);

    const onKnobPointerDown = (e) => {
        console.log("Knob Pointer Down");
        e.stopPropagation();
        activeKnobRef.current = e.object; 
        lastY.current = e.clientY;

        e.target.setPointerCapture(e.pointerId);
    };

    const onKnobPointerMove = (e) => {
        if (!activeKnobRef.current) return;
        console.log("Knob Pointer Move");


        const deltaY = lastY.current - e.clientY;
        lastY.current = e.clientY;

        const sensitivity = 0.02;
        activeKnobRef.current.rotation.y += deltaY * sensitivity;
        activeKnobRef.current.rotation.y = Math.round(activeKnobRef.current.rotation.y*10)/10;
        console.log("Knob Rotation:", activeKnobRef.current.rotation.y);
    };

    const onKnobPointerUp = (e) => {
        console.log("Knob Pointer Up");
        if (activeKnobRef.current) {
            e.target.releasePointerCapture(e.pointerId);
            activeKnobRef.current = null;
        }
    };

    const onSliderPointerDown = (e) => {
        console.log("Slider Pointer Down");
        e.stopPropagation(); 
        activeSliderRef.current = e.object; 
        lastZ.current = e.clientY;
        console.log(activeSliderRef.current.position.z);

        e.target.setPointerCapture(e.pointerId);
    };

    const onSliderPointerMove = (e) => {
        if (!activeSliderRef.current) return;
        console.log("Slider Pointer Move");

        const deltaY = lastZ.current - e.clientY;
        lastZ.current = e.clientY;


        const sensitivity = -0.001;
        activeSliderRef.current.position.z += deltaY * sensitivity;

        activeSliderRef.current.position.z = THREE.MathUtils.clamp(activeSliderRef.current.position.z, -0.07, -0.03);
        console.log("Slider Position Z:", activeSliderRef.current.position.z);
    };

    const onSliderPointerUp = (e) => {
        console.log("Slider Pointer Up");
        if (activeSliderRef.current) {
            e.target.releasePointerCapture(e.pointerId);
            activeSliderRef.current = null;
        }
    };


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
                                    onPointerDown={onKnobPointerDown}
                                    onPointerMove={onKnobPointerMove}
                                    onPointerUp={onKnobPointerUp}
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
                                    onPointerDown={onSliderPointerDown}
                                    onPointerMove={onSliderPointerMove}
                                    onPointerUp={onSliderPointerUp}
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

export default KeyboardModel;