import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js";

const canvas = document.querySelector("#visionOrbCanvas");
const preview = canvas?.closest(".camera-orb-preview");

if (canvas && preview) init();

function init() {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 20);
    camera.position.z = 5;

    const uniforms = {
        uTime: { value: 0 },
        uPointer: { value: new THREE.Vector2() }
    };

    const material = new THREE.ShaderMaterial({
        uniforms,
        transparent: true,
        depthWrite: false,
        vertexShader: `
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vWorld;

            uniform float uTime;
            uniform vec2 uPointer;

            float hash(vec3 p) {
                p = fract(p * .3183099 + .1);
                p *= 17.;
                return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
            }

            float noise(vec3 p) {
                vec3 i = floor(p);
                vec3 f = fract(p);
                f = f * f * (3. - 2. * f);

                float a = hash(i);
                float b = hash(i + vec3(1,0,0));
                float c = hash(i + vec3(0,1,0));
                float d = hash(i + vec3(1,1,0));
                float e = hash(i + vec3(0,0,1));
                float f1 = hash(i + vec3(1,0,1));
                float g = hash(i + vec3(0,1,1));
                float h = hash(i + vec3(1,1,1));

                return mix(
                    mix(mix(a,b,f.x), mix(c,d,f.x), f.y),
                    mix(mix(e,f1,f.x), mix(g,h,f.x), f.y),
                    f.z
                );
            }

            void main() {
                vUv = uv;
                vNormal = normalize(normalMatrix * normal);

                vec3 p = position;
                float n = noise(normal * 3.8 + vec3(uTime * .24, uTime * .15, uTime * .31));
                float wave = sin(normal.y * 7.5 + normal.x * 2.7 + uTime * 1.18) * .024;
                float drag = dot(normal.xy, uPointer) * .05;

                p += normal * ((n - .5) * .11 + wave + drag);

                vec4 world = modelMatrix * vec4(p, 1.);
                vWorld = world.xyz;
                gl_Position = projectionMatrix * viewMatrix * world;
            }
        `,
        fragmentShader: `
            precision highp float;

            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vWorld;

            uniform float uTime;
            uniform vec2 uPointer;

            float glowLine(vec2 uv, float shift, float strength) {
                float v = sin((uv.x * 8.0 + uv.y * 5.4) + shift + uTime * .72);
                return pow(max(v, 0.0), 7.0) * strength;
            }

            void main() {
                vec3 n = normalize(vNormal);
                vec3 viewDir = normalize(cameraPosition - vWorld);

                float facing = max(dot(n, viewDir), 0.0);
                float fresnel = pow(1.0 - facing, 1.75);

                vec2 highlightPos = vec2(.30, .22) + uPointer * vec2(.12, -.08);
                float highlight = 1.0 - smoothstep(0.0, .34, distance(vUv, highlightPos));
                highlight = pow(highlight, 3.0);

                float edge = smoothstep(.28, .96, fresnel);
                float caustic = glowLine(vUv + uPointer * .04, 0.2, .38) * edge;
                caustic += glowLine(vUv.yx, 2.1, .22) * edge;

                vec3 color = vec3(1.0);
                color += vec3(.82, .90, 1.0) * edge * .62;
                color += vec3(.95, .88, 1.0) * caustic * .5;
                color += vec3(1.0) * highlight * .75;

                float alpha = .11;
                alpha += edge * .62;
                alpha += highlight * .36;
                alpha += caustic * .24;

                gl_FragColor = vec4(color, alpha);
            }
        `
    });

    const orb = new THREE.Mesh(new THREE.SphereGeometry(1.34, 160, 160), material);
    scene.add(orb);

    const shadow = new THREE.Mesh(
        new THREE.PlaneGeometry(3.2, 1),
        new THREE.MeshBasicMaterial({
            map: createSoftShadowTexture(),
            transparent: true,
            opacity: 0.32,
            depthWrite: false
        })
    );

    shadow.position.set(0.12, -1.42, -0.2);
    shadow.scale.set(1.08, 0.58, 1);
    scene.add(shadow);

    const pointer = new THREE.Vector2();
    const target = new THREE.Vector2();

    function resize() {
        const rect = canvas.getBoundingClientRect();
        renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false);
        camera.aspect = rect.width / rect.height;
        camera.updateProjectionMatrix();
    }

    function move(event) {
        const rect = canvas.getBoundingClientRect();
        target.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        target.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    }

    function leave() {
        target.set(0, 0);
    }

    function animate(ms) {
        const t = ms * .001;

        pointer.lerp(target, .08);
        uniforms.uTime.value = t;
        uniforms.uPointer.value.copy(pointer);

        orb.rotation.y = t * .14 + pointer.x * .13;
        orb.rotation.x = Math.sin(t * .42) * .06 - pointer.y * .1;

        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }

    resize();
    preview.classList.add("is-webgl-ready");

    canvas.addEventListener("pointermove", move, { passive: true });
    canvas.addEventListener("pointerleave", leave, { passive: true });
    window.addEventListener("resize", resize, { passive: true });

    requestAnimationFrame(animate);
}

function createSoftShadowTexture() {
    const size = 512;
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;

    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(size / 2, size / 2, size * .04, size / 2, size / 2, size * .48);

    g.addColorStop(0, "rgba(55, 65, 81, 0.22)");
    g.addColorStop(.45, "rgba(55, 65, 81, 0.11)");
    g.addColorStop(.78, "rgba(55, 65, 81, 0.035)");
    g.addColorStop(1, "rgba(55, 65, 81, 0)");

    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(c);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}
