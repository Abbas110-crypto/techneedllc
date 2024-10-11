"use client"; // Ensure this line is at the top

import { useEffect, useRef } from "react";
import * as THREE from "three";

const AnimatedBg = () => {
  const mountRef = useRef(null);
  const mousePosition = useRef(new THREE.Vector2(0, 0));
  const targetMousePosition = useRef(new THREE.Vector2(0, 0)); // For smooth transition

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current?.appendChild(renderer.domElement);

    const geometry = new THREE.PlaneGeometry(2, 2);

    // Peach background shader for the right side
    const fragmentShaderPeach = `
    uniform vec2 u_resolution;
    uniform float u_time;
  
    float verticalWave(float y, float time) {
        return 0.05 * sin(10.0 * (y + time * 0.5)); // Creates a sine wave effect
    }
  
    void main() {
        vec2 st = gl_FragCoord.xy / u_resolution;
  
        if (st.x > 0.5) {
            float waveEffect = verticalWave(st.y, u_time);
            vec3 peachColor = vec3(1.0, 0.8 + waveEffect, 0.7); // Vary the green component slightly to create movement
            gl_FragColor = vec4(peachColor, 0.5); // Use semi-transparency
        } else {
            discard; // Discard fragments on the left side
        }
    }
  `;


    const peachShaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        u_time: { value: 0.0 },
      },
      fragmentShader: fragmentShaderPeach,
      transparent: true,
    });


    const peachPlane = new THREE.Mesh(geometry, peachShaderMaterial);
    peachPlane.position.set(0, 0, 0);
    scene.add(peachPlane);

    // Main pink animation shader with gradient and vignette effect
    const fragmentShaderPink = `
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      uniform float u_time;

      float fluctuation(float x, float time) {
          return 0.1 * sin(10.0 * (x + time * 0.5));
      }

      void main() {
          vec2 st = gl_FragCoord.xy / u_resolution;
          float middleFade = smoothstep(0.35, 0.65, st.x);

          float dist = length(st - u_mouse);
          float size = 0.5;
          float startDistance = length(st - vec2(0.0, 1.0));
          float fluctuationEffect = fluctuation(st.y, u_time);

          float intensity = smoothstep(startDistance + fluctuationEffect, startDistance - size, dist);

          vec3 lightPink = vec3(1.0, 0.6, 0.8);
          vec3 darkPink = vec3(0.8, 0.2, 0.67);
          vec3 pinkGradient = mix(lightPink, darkPink, st.y);

          vec3 blueColor = vec3(0.3, 0.5, 1.0);
          float edgeFactor = smoothstep(0.0, 0.5, intensity);
          vec3 color = mix(blueColor, pinkGradient, edgeFactor);

          vec3 baseColor = vec3(1.0, 0.92, 0.98);
          color = mix(baseColor, color, intensity);

          float vignette = smoothstep(0.8, 1.0, length(st - vec2(0.5, 0.5)));
          color = mix(color, vec3(1.0), vignette);

          gl_FragColor = vec4(color, 1.0);
      }
    `;

    const shaderMaterialPink = new THREE.ShaderMaterial({
      uniforms: {
        u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        u_mouse: { value: mousePosition.current },
        u_time: { value: 0.0 },
      },
      fragmentShader: fragmentShaderPink,
      transparent: true,
    });

    const mainPlanePink = new THREE.Mesh(geometry, shaderMaterialPink);
    mainPlanePink.position.set(0, 0, 0.1);
    scene.add(mainPlanePink);

    const animate = () => {
      shaderMaterialPink.uniforms.u_time.value += 0.01;
      peachShaderMaterial.uniforms.u_time.value += 0.01; // Update the time for peach waves as well

      mousePosition.current.lerp(targetMousePosition.current, 0.1);
      shaderMaterialPink.uniforms.u_mouse.value.copy(mousePosition.current);

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();

    const handleMouseMove = (event) => {
      targetMousePosition.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      targetMousePosition.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener("mousemove", handleMouseMove);

    window.addEventListener("resize", () => {
      camera.left = -1;
      camera.right = 1;
      camera.top = 1;
      camera.bottom = -1;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      peachShaderMaterial.uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
      shaderMaterialPink.uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
    });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: -1 }} />;
};

export default AnimatedBg;