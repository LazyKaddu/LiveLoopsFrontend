import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const HologramPlane = ({ noteStates }) => {
    const meshRef = useRef();

    const N = 48;    // Columns (Notes)
    const M = 100;   // Rows (History)

    // 1. Memoize the DataTexture so it's created only once
    const [data, texture] = useMemo(() => {
        const size = N * M;
        const d = new Uint8Array(size);
        const tex = new THREE.DataTexture(d, N, M, THREE.RedFormat);
        tex.minFilter = THREE.NearestFilter;
        tex.magFilter = THREE.NearestFilter;
        return [d, tex];
    }, [N, M]);

    // 2. Memoize the ShaderMaterial to prevent "restarting" the shader on every render
    const material = useMemo(() => {
        return new THREE.ShaderMaterial({
            side: THREE.DoubleSide,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            uniforms: {
                uHistory: { value: texture },
                uColumns: { value: N },
                uRows: { value: M },
                uTime: { value: 0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D uHistory;
                uniform float uColumns;
                uniform float uRows;
                uniform float uTime; 
                varying vec2 vUv;

                float hash(vec2 p) {
                    p = fract(p * vec2(123.34, 456.21));
                    p += dot(p, p + 45.32);
                    return fract(p.x * p.y);
                }

                vec3 getCosColor(float t) {
                    vec3 a = vec3(0.35, 0.35, 0.35);
                    vec3 b = vec3(0.5, 0.5, 0.5);
                    vec3 c = vec3(1.0,1.0,1.0);
                    vec3 d = vec3(0.0, 0.33, 0.67);
                    return a + b * cos(6.28318 * (c * t  + d));
                }

                void main() {
                    float column = floor(vUv.x * uColumns);
                    float row = floor(vUv.y * uRows);
                    vec2 sampleUv = vec2((column + 0.5) / uColumns, (row + 0.5) / uRows);
                    
                    float data = texture2D(uHistory, sampleUv).r;
                    float horizontalPadding = step(fract(vUv.x * uColumns), 0.9); 
                    float noteActive = data * horizontalPadding;

                    // COLOR FIX: Uses screen-space vUv, not texture-space sampleUv
                    vec3 dynamicColor = getCosColor(uTime * 0.2);

                    float noise = hash(vUv + floor(uTime * 20.0) * 0.01);
                    float sparkles = pow(noise, 15.0) * noteActive * 15.0; 

                    float baseGlow = exp(-vUv.y * 50.0) * 2.5; 
                    baseGlow *= step(vUv.y, 0.1);

                    float fade = pow(1.0 - vUv.y, 1.5);
                    
                    vec3 noteRGB = dynamicColor * (noteActive * 4.0 + sparkles);
                    vec3 baseRGB = dynamicColor * baseGlow;
                    
                    vec3 finalRGB = noteRGB + baseRGB;
                    float alpha = max(noteActive * fade, baseGlow);
                    
                    if (alpha < 0.02 && sparkles < 0.02) discard;

                    gl_FragColor = vec4(finalRGB, alpha);
                }
            `
        });
    }, [texture, N, M]);

    useFrame((state) => {
        // Update texture data
        data.set(data.subarray(0, N * (M - 1)), N);
        for (let i = 0; i < N; i++) {
            data[i] = noteStates[i] ? 255 : 0;
        }
        texture.needsUpdate = true;

        // Update uTime uniform directly on the memoized material
        material.uniforms.uTime.value = state.clock.elapsedTime;
    });

    return (
        <mesh 
            ref={meshRef} 
            position={[0, 0.48, -1.25]} 
            rotation={[-Math.PI / 6, 0, 0]}
            material={material}
        >
            <planeGeometry args={[5.5, 1]} />
        </mesh>
    );
};

export default HologramPlane;