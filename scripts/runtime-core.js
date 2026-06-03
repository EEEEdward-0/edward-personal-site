import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js";

const canvas = document.querySelector("#runtimeCoreCanvas");

if (canvas) {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 20);
    camera.position.z = 5.2;

    const group = new THREE.Group();
    scene.add(group);

    const glass = new THREE.Mesh(
        new THREE.SphereGeometry(1.32, 160, 160),
        new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            roughness: 0.02,
            metalness: 0,
            transparent: true,
            opacity: 0.24,
            transmission: 1,
            thickness: 2.6,
            ior: 1.48,
            clearcoat: 1,
            clearcoatRoughness: 0,
            attenuationColor: new THREE.Color("#ffffff"),
            attenuationDistance: 0.7
        })
    );
    group.add(glass);


    const rim = new THREE.Mesh(
        new THREE.SphereGeometry(1.36, 160, 160),
        new THREE.MeshBasicMaterial({
            color: 0xdcecff,
            transparent: true,
            opacity: 0.32,
            depthWrite: false,
            side: THREE.BackSide
        })
    );
    group.add(rim);

    const highlight = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 48, 48),
        new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.88,
            depthWrite: false
        })
    );
    highlight.position.set(-0.55, 0.62, 1.05);
    highlight.scale.set(1.65, 0.82, 0.32);
    group.add(highlight);

    const shadow = new THREE.Mesh(
        new THREE.PlaneGeometry(3.1, 1.0),
        new THREE.MeshBasicMaterial({
            map: createSoftShadowTexture(),
            transparent: true,
            opacity: 0.36,
            depthWrite: false
        })
    );
    shadow.position.set(0.05, -1.45, -0.15);
    shadow.scale.set(0.95, 0.46, 1);
    scene.add(shadow);

    const lightA = new THREE.PointLight(0xffffff, 4.2, 8);
    lightA.position.set(-2.6, 2.8, 3.4);
    scene.add(lightA);

    const lightB = new THREE.PointLight(0xdfe8ff, 2.2, 8);
    lightB.position.set(2.1, -0.9, 2.8);
    scene.add(lightB);

    scene.add(new THREE.AmbientLight(0xffffff, 1.2));

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
        const t = ms * 0.001;

        pointer.lerp(target, 0.08);

        group.rotation.y = t * 0.08 + pointer.x * 0.12;
        group.rotation.x = Math.sin(t * 0.42) * 0.045 - pointer.y * 0.08;
        group.position.y = Math.sin(t * 0.7) * 0.03;

        glass.scale.set(
            1 + Math.sin(t * 0.95) * 0.012,
            1 + Math.cos(t * 0.88) * 0.01,
            1
        );
        rim.scale.setScalar(1 + Math.sin(t * 0.9) * 0.018);

        highlight.position.x = -0.48 + pointer.x * 0.18;
        highlight.position.y = 0.58 + pointer.y * 0.12;

        shadow.material.opacity = 0.32 + Math.sin(t * 0.9) * 0.035;

        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }

    resize();

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
    const g = ctx.createRadialGradient(size / 2, size / 2, size * 0.05, size / 2, size / 2, size * 0.48);

    g.addColorStop(0, "rgba(60, 68, 82, 0.30)");
    g.addColorStop(0.42, "rgba(60, 68, 82, 0.15)");
    g.addColorStop(0.76, "rgba(60, 68, 82, 0.045)");
    g.addColorStop(1, "rgba(60, 68, 82, 0)");

    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(c);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}
