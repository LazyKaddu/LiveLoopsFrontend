import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';

const JellyMaterial = shaderMaterial(
    {
        uTime: 0,
        uColor: new THREE.Color('#ff4d6d'),
        uWobbleSpeed: 0.5,
        uWobbleStrength: 0.2
    },
    // VERTEX SHADER
    `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  uniform float uTime;
  uniform float uWobbleSpeed;
  uniform float uWobbleStrength;

  // Classic Perlin 3D Noise by Stefan Gustavson
  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
  float snoise(vec3 v){ 
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 = v - i + dot(i, C.xxx) ;
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod(i, 289.0); 
    vec4 p = permute( permute( permute( 
               i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
             + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
    float n_ = 1.0/7.0;
    vec3  ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec3 norm = inversesqrt(vec3(dot(p0,p0), dot(p1,p1), dot(p2, p2)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z;
    p3 *= inversesqrt(dot(p3,p3));
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
  }

  void main() {
  // Transform normal to View Space
  vNormal = normalMatrix * normal; 
  
  float noise = snoise(position * 1.5 + uTime * uWobbleSpeed);
  vec3 newPosition = position + (normal * noise * uWobbleStrength);
  
  vec4 modelViewPosition = modelViewMatrix * vec4(newPosition, 1.0);
  vViewPosition = -modelViewPosition.xyz;
  
  gl_Position = projectionMatrix * modelViewPosition;
}
  `,
    // FRAGMENT SHADER
    `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  uniform vec3 uColor;
  uniform float uTime;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    
    // Fresnel Effect
    float fresnel = pow(1.0 - dot(normal, viewDir), 2.0);
    
    // Fake SSS / Glow
    float glow = dot(normal, viewDir);
    vec3 finalColor = mix(uColor, vec3(1.0), fresnel * 0.5);
    
    // Specular Shine
    float spec = pow(max(dot(reflect(-viewDir, normal), vec3(0, 1, 0)), 0.0), 32.0);
    
    gl_FragColor = vec4(finalColor + spec, 0.75);
  }
  `
);

extend({ JellyMaterial });

export const JellySphere = ({handelSettingOpen}) => {
    const matRef = useRef();

    useFrame((state) => {
        if (matRef.current) {
            matRef.current.uTime = state.clock.getElapsedTime();
        }
    });

    return (
        <group position={[-3.5, 0, 0]} scale={0.2} onPointerDown={handelSettingOpen}>
            <mesh>
                <boxGeometry scale={0.75} args={[1, 1, 1]} />
                <meshStandardMaterial
                    color="#ffffff"
                    metalness={0.0}
                    roughness={0.1}
                />
            </mesh>
            <mesh >
                <sphereGeometry args={[1, 64, 64]} />
                <jellyMaterial
                    ref={matRef}
                    transparent
                    side={THREE.DoubleSide}
                />
            </mesh>
        </group>
    );
};
