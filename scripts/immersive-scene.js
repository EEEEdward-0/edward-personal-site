import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js";
import {
    Engine,
    Scene,
    ArcRotateCamera,
    Vector3,
    Color3,
    Color4,
    HemisphericLight,
    DirectionalLight,
    ShadowGenerator,
    MeshBuilder,
    PBRMaterial,
    StandardMaterial,
    GlowLayer
} from "https://cdn.jsdelivr.net/npm/@babylonjs/core@6.49.0/index.js";

const stage = document.querySelector("#immersiveStage");
const babylonCanvas = document.querySelector("#babylonScene");
const threeCanvas = document.querySelector("#threeOverlay");

if (stage && babylonCanvas && threeCanvas) {
    bootImmersiveScene();
}

function bootImmersiveScene() {
    const gpuText = document.querySelector("#immersiveGpu");
    const threadsText = document.querySelector("#immersiveThreads");
    const fpsText = document.querySelector("#immersiveFps");

    gpuText.textContent = `GPU: ${"gpu" in navigator ? "WebGPU exposed" : "WebGL fallback"}`;
    threadsText.textContent = `Threads: ${navigator.hardwareConcurrency || "-"}`;

    const babylon = createBabylonRoom(babylonCanvas);
    const three = createThreeOverlay(threeCanvas);

    const observer = new ResizeObserver(() => {
        babylon.engine.resize();
        three.resize();
    });

    observer.observe(stage);

    let last = performance.now();
    let frames = 0;

    babylon.engine.runRenderLoop(() => {
        const now = performance.now();
        frames += 1;

        if (now - last > 600) {
            fpsText.textContent = `FPS: ${Math.round((frames * 1000) / (now - last))}`;
            frames = 0;
            last = now;
        }

        const t = now * 0.001;
        babylon.animate(t);
        three.animate(t);
        babylon.scene.render();
    });
}

function createBabylonRoom(canvas) {
    const engine = new Engine(canvas, true, {
        preserveDrawingBuffer: false,
        stencil: true,
        antialias: true,
        adaptToDeviceRatio: true
    });

    const scene = new Scene(engine);
    scene.clearColor = new Color4(0, 0, 0, 0);
    scene.environmentIntensity = 0.72;

    const camera = new ArcRotateCamera(
        "camera",
        Math.PI * 1.18,
        Math.PI * 0.38,
        7.2,
        new Vector3(0, 0.65, 0),
        scene
    );

    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 5.4;
    camera.upperRadiusLimit = 8.4;
    camera.wheelDeltaPercentage = 0.015;
    camera.panningSensibility = 0;

    const hemi = new HemisphericLight("sky", new Vector3(0, 1, 0), scene);
    hemi.intensity = 1.05;
    hemi.groundColor = new Color3(0.82, 0.84, 0.88);

    const sun = new DirectionalLight("sun", new Vector3(-0.35, -0.78, -0.42), scene);
    sun.position = new Vector3(4.5, 6.2, 4.2);
    sun.intensity = 2.1;

    const shadow = new ShadowGenerator(1024, sun);
    shadow.useBlurExponentialShadowMap = true;
    shadow.blurKernel = 28;

    const groundMat = new PBRMaterial("soft-ground", scene);
    groundMat.albedoColor = new Color3(0.94, 0.94, 0.96);
    groundMat.roughness = 0.52;
    groundMat.metallic = 0;

    const glassMat = new PBRMaterial("glass-panels", scene);
    glassMat.albedoColor = new Color3(0.96, 0.97, 1);
    glassMat.alpha = 0.42;
    glassMat.roughness = 0.08;
    glassMat.metallic = 0;
    glassMat.indexOfRefraction = 1.42;
    glassMat.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHABLEND;

    const blueMat = new StandardMaterial("signal-blue", scene);
    blueMat.diffuseColor = new Color3(0.0, 0.42, 1);
    blueMat.emissiveColor = new Color3(0.0, 0.2, 0.7);

    const floor = MeshBuilder.CreateGround("floor", { width: 7.4, height: 5.2 }, scene);
    floor.material = groundMat;
    floor.receiveShadows = true;

    const core = MeshBuilder.CreateSphere("runtime-core", { diameter: 0.72, segments: 48 }, scene);
    core.position.y = 1.08;
    core.material = blueMat;
    shadow.addShadowCaster(core);

    const panels = [];
    const specs = [
        [-1.45, 1.08, -0.55, 0.72, 1.25],
        [1.42, 1.18, -0.2, 0.86, 1.42],
        [0.0, 1.42, 0.82, 1.2, 0.74]
    ];

    specs.forEach(([x, y, z, w, h], index) => {
        const panel = MeshBuilder.CreateBox(`glass-panel-${index}`, {
            width: w,
            height: h,
            depth: 0.035
        }, scene);

        panel.position.set(x, y, z);
        panel.rotation.y = index === 0 ? -0.38 : index === 1 ? 0.34 : 0;
        panel.material = glassMat;
        panels.push(panel);
        shadow.addShadowCaster(panel);
    });

    const glow = new GlowLayer("runtime-glow", scene);
    glow.intensity = 0.28;

    return {
        engine,
        scene,
        animate(t) {
            core.position.y = 1.08 + Math.sin(t * 1.1) * 0.045;
            core.rotation.y = t * 0.45;

            panels.forEach((panel, index) => {
                panel.position.y += Math.sin(t * 0.7 + index) * 0.0009;
                panel.rotation.z = Math.sin(t * 0.42 + index) * 0.025;
            });
        }
    };
}

function createThreeOverlay(canvas) {
    const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance"
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
    camera.position.z = 7;

    const count = 360;
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);

    for (let i = 0; i < count; i += 1) {
        const r = 1.4 + Math.random() * 2.2;
        const a = Math.random() * Math.PI * 2;
        const y = -0.9 + Math.random() * 2.5;

        positions[i * 3] = Math.cos(a) * r;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = Math.sin(a) * r;
        seeds[i] = Math.random() * 100;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("seed", new THREE.BufferAttribute(seeds, 1));

    const material = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
            uTime: { value: 0 },
            uColor: { value: new THREE.Color("#BFBFC1") }
        },
        vertexShader: `
            attribute float seed;
            uniform float uTime;
            varying float vAlpha;

            void main() {
                vec3 p = position;
                float drift = sin(uTime * .7 + seed) * .08;
                p.x += drift;
                p.y += sin(uTime * .45 + seed * .7) * .06;

                vec4 mv = modelViewMatrix * vec4(p, 1.0);
                gl_PointSize = 2.5 + sin(seed + uTime) * 1.2;
                gl_Position = projectionMatrix * mv;

                vAlpha = .22 + .18 * sin(seed + uTime * .8);
            }
        `,
        fragmentShader: `
            uniform vec3 uColor;
            varying float vAlpha;

            void main() {
                float d = distance(gl_PointCoord, vec2(.5));
                if (d > .5) discard;
                gl_FragColor = vec4(uColor, vAlpha * (1.0 - smoothstep(.18, .5, d)));
            }
        `
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    function resize() {
        const rect = canvas.getBoundingClientRect();
        renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false);
        camera.aspect = rect.width / rect.height;
        camera.updateProjectionMatrix();
    }

    resize();

    return {
        resize,
        animate(t) {
            material.uniforms.uTime.value = t;
            particles.rotation.y = t * 0.08;
            renderer.render(scene, camera);
        }
    };
}
