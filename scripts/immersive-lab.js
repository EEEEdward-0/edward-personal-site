import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

const canvas = document.querySelector("#earthCanvas");
const stage = document.querySelector("#issStage");

const sceneTitleMain = document.querySelector("#sceneTitleMain");
const sceneTitleSub = document.querySelector("#sceneTitleSub");
const motionToggle = document.querySelector("#motionToggle");
const immersiveLoader = document.querySelector("#immersiveLoader");
const loaderProgress = document.querySelector("#loaderProgress");
const loaderDetail = document.querySelector("#loaderDetail");

// --- Unified loader progress for multiple models ---
const modelProgress = new Map();
let loaderVisualPercent = 0;
let loaderRenderPending = false;

function renderCombinedLoaderProgress() {
  loaderRenderPending = false;
  if (!loaderProgress) return;

  let knownLoaded = 0, knownTotal = 0;
  let activeLabel = "Scene assets";
  let activeLoaded = 0;

  modelProgress.forEach((item) => {
    if (item.total > 0) {
      const safeLoaded = Math.min(item.loaded, item.total);
      knownLoaded += safeLoaded;
      knownTotal += item.total;
      if (safeLoaded >= activeLoaded && safeLoaded < item.total) {
        activeLoaded = safeLoaded;
        activeLabel = item.label;
      }
    }
  });

  if (knownTotal > 0) {
    const targetPercent = Math.min(99, Math.max(0, Math.round((knownLoaded / knownTotal) * 100)));
    loaderVisualPercent = Math.max(loaderVisualPercent, targetPercent);
    loaderProgress.textContent = `${loaderVisualPercent}%`;
    if (loaderDetail) loaderDetail.textContent = `Loading ${activeLabel}`;
    return;
  }

  if (loaderDetail) loaderDetail.textContent = "Preparing scene assets";
}

function scheduleLoaderRender() {
  if (loaderRenderPending) return;
  loaderRenderPending = true;
  window.requestAnimationFrame(renderCombinedLoaderProgress);
}

function updateLoaderProgress(label, loaded, total) {
  modelProgress.set(label, {
    label,
    loaded: Number.isFinite(loaded) ? loaded : 0,
    total: Number.isFinite(total) ? total : 0
  });
  scheduleLoaderRender();
}

function finishLoaderProgress() {
  loaderVisualPercent = 100;
  if (loaderProgress) loaderProgress.textContent = "100%";
  if (loaderDetail) loaderDetail.textContent = "Scene ready";
}

const ISS_ALTITUDE_KM = 408;
const EARTH_RADIUS = 1.72;
const MOON_RADIUS_RATIO = 0.273;
const MOON_RADIUS = EARTH_RADIUS * MOON_RADIUS_RATIO;
const MOON_DISPLAY_DISTANCE = 4.85;
const ISS_ORBIT_PERIOD_MIN = 92.68;
const ISS_INCLINATION_DEG = 51.64;
const ISS_EPOCH_MS = Date.UTC(2026, 0, 1, 0, 0, 0);

const MODEL_PATHS = {
  moonSmall: "/models/Moon_NASA_LRO_8k_Topo_Small.glb",
  moon8k: "/models/Moon_NASA_LRO_8k_Topo.glb",
  moon23k: "/models/Moon_NASA_LRO_23K_Topo.glb",
  lro: "/models/lro.glb",
  starlink: "/models/starlink.glb",
  weather: "/models/weather-goes.glb",
  ISS: "/models/ISS_stationary.glb"
};
// Moon 23K 超高清模型加载开关
const ENABLE_23K = false; // 用户可切换 true 以尝试加载 23K 超高清 Moon

const satelliteVisibility = {
  starlink: true,
  weather: true
};

const isMobile = window.matchMedia("(max-width: 760px)").matches;

// Adjust satellite counts and model sizes for mobile
const SATELLITE_CONFIG_OVERRIDES = {
  starlink: { count: isMobile ? 12 : 36, modelSize: isMobile ? 0.007 : 0.012, radius: isMobile ? 2.75 : 2.24 },
  weather: { count: isMobile ? 3 : 6, modelSize: isMobile ? 0.12 : 0.32, radius: isMobile ? 4.4 : 4.05 },
  ISS: { modelSize: isMobile ? 0.28 : 0.52 } // ISS scale adjustment for mobile
};

const TEXTURES = {
  earth: "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg",
  bump: "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_normal_2048.jpg",
  spec: "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_specular_2048.jpg",
  clouds: "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_clouds_1024.png",
  lights: "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_lights_2048.png"
};

if (canvas && stage) boot();

function createSceneLoadingManager() {
  const manager = new THREE.LoadingManager();

  manager.onStart = () => {
    if (loaderProgress) loaderProgress.textContent = "Loading: 0%";
  };

  manager.onProgress = (url, loaded, total) => {
    updateLoaderProgress("Scene assets", loaded, total);
  };

  manager.onLoad = () => {
    finishLoaderProgress();
    window.setTimeout(openImmersiveDoor, 320);
  };

  manager.onError = (url) => {
    console.warn("加载失败: ", url);
  };

  return manager;
}

function openImmersiveDoor() {
  if (!immersiveLoader) return;

  immersiveLoader.classList.add("is-opening");

  window.setTimeout(() => {
    immersiveLoader.classList.add("is-hidden");
    document.body.classList.add("is-scene-ready");
  }, 980);
}

function boot() {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  });

  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 3));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;

  const scene = new THREE.Scene();
  scene.background = null;

  const camera = new THREE.PerspectiveCamera(36, 1, 0.01, 100);
  camera.position.set(0.62, 1.05, 5.75);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.enableZoom = true;
  controls.zoomSpeed = 1.15;
  controls.minDistance = 0.08;
  controls.maxDistance = 9.2;

  const loadingManager = createSceneLoadingManager();
  const loader = new THREE.TextureLoader(loadingManager);
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/libs/draco/");
  dracoLoader.setWorkerLimit(isMobile ? 2 : 4);
  dracoLoader.preload();

  const gltfLoader = new GLTFLoader(loadingManager);
  gltfLoader.setDRACOLoader(dracoLoader);
  const backgroundGltfLoader = new GLTFLoader();
  backgroundGltfLoader.setDRACOLoader(dracoLoader);

  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_RADIUS, 128, 128),
    new THREE.MeshPhongMaterial({
      map: loader.load(TEXTURES.earth),
      bumpMap: loader.load(TEXTURES.bump),
      bumpScale: 0.035,
      specularMap: loader.load(TEXTURES.spec),
      specular: new THREE.Color("#6b7280"),
      shininess: 26
    })
  );
  const earthMoonSystem = new THREE.Group();
  earthMoonSystem.add(earth);
  scene.add(earthMoonSystem);

  const clouds = new THREE.Mesh(
    new THREE.SphereGeometry(1.745, 128, 128),
    new THREE.MeshLambertMaterial({
      map: loader.load(TEXTURES.clouds),
      transparent: true,
      opacity: 0.46,
      depthWrite: false
    })
  );
  earthMoonSystem.add(clouds);

  const night = new THREE.Mesh(
    new THREE.SphereGeometry(1.721, 128, 128),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        sunDirection: { value: new THREE.Vector3(1, 0, 0) }
      },
      vertexShader: `
        varying vec3 vWorldNormal;

        void main() {
          vWorldNormal = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vWorldNormal;
        uniform vec3 sunDirection;

        void main() {
          float light = dot(normalize(vWorldNormal), normalize(sunDirection));
          float nightSide = smoothstep(.16, -.18, light);
          vec3 nightColor = vec3(.005, .012, .035) * 1.23; // Slightly brighter for night side
          gl_FragColor = vec4(nightColor, nightSide * .62); // Slightly more visible
        }
      `
    })
  );
  earthMoonSystem.add(night);

  const cityLights = new THREE.Mesh(
    new THREE.SphereGeometry(1.724, 128, 128),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        lightsMap: { value: loader.load(TEXTURES.lights) },
        sunDirection: { value: new THREE.Vector3(1, 0, 0) }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorldNormal;

        void main() {
          vUv = uv;
          vWorldNormal = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vWorldNormal;

        uniform sampler2D lightsMap;
        uniform vec3 sunDirection;

        void main() {
          float light = dot(normalize(vWorldNormal), normalize(sunDirection));

          float nightMask = smoothstep(.08, -.22, light);
          vec3 city = texture2D(lightsMap, vUv).rgb;

          city = pow(city, vec3(1.25));
          vec3 warmCity = vec3(city.r * 1.25, city.g * .92, city.b * .58);

          float intensity = max(max(warmCity.r, warmCity.g), warmCity.b);
          float alpha = nightMask * smoothstep(.05, .42, intensity) * .98; // Slightly more visible

          gl_FragColor = vec4(warmCity * 2.06, alpha); // Slightly brighter
        }
      `
    })
  );
  earthMoonSystem.add(cityLights);

  const moon = createMoon(backgroundGltfLoader, loader, renderer);
  moon.name = "Moon";
  moon.position.set(MOON_DISPLAY_DISTANCE, 0.65, -1.25);
  scene.add(moon);

  const moonOrbit = makeMoonOrbitLine();
  scene.add(moonOrbit);

  const lunarSystem = createLunarOrbiterSystem(gltfLoader);
  moon.add(lunarSystem.root);

  const moonHitArea = new THREE.Mesh(
    new THREE.SphereGeometry(MOON_RADIUS * 1.65, 32, 32),
    new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false
    })
  );
  moonHitArea.position.copy(moon.position);
  scene.add(moonHitArea);

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(1.86, 128, 128),
    new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        glowColor: { value: new THREE.Color("#6ea8ff") }
      },
      vertexShader: `
        varying vec3 vNormal;

        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        uniform vec3 glowColor;

        void main() {
          float rim = pow(0.78 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.2);
          gl_FragColor = vec4(glowColor, rim * .52);
        }
      `
    })
  );
  earthMoonSystem.add(atmosphere);

  const orbit = makeOrbitLine();
  scene.add(orbit);

  // const gltfLoader = new GLTFLoader();
  const satelliteSystem = createSatelliteSystem(gltfLoader);
  scene.add(satelliteSystem.root);
  bindSatelliteToggles(satelliteSystem);

  const issAnchor = new THREE.Group();
  scene.add(issAnchor);

  let sceneFocus = "earth";
  let focusAutoUntil = 0;
  let savedView = null;
  let restoreView = null;
  let restoreUntil = 0;
  const motionState = createMotionState();
  bindMotionToggle(motionState);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let pointerDown = null;

  bindSceneFocusControls((mode) => {
    if (sceneFocus === mode && savedView) {
      restoreView = savedView;
      restoreUntil = performance.now() + 850;
      savedView = null;
      sceneFocus = "earth";
      focusAutoUntil = 0;
      return;
    }

    if (!savedView) {
      savedView = captureSceneView(camera, controls);
    }

    sceneFocus = mode;
    focusAutoUntil = performance.now() + 1100;
  });


  canvas.addEventListener("wheel", () => {
    focusAutoUntil = 0;
  }, { passive: true });

  canvas.addEventListener("pointerdown", (event) => {
    pointerDown = { x: event.clientX, y: event.clientY };
    focusAutoUntil = 0;
  });

  canvas.addEventListener("pointerup", (event) => {
    if (!pointerDown) return;

    const dx = event.clientX - pointerDown.x;
    const dy = event.clientY - pointerDown.y;
    pointerDown = null;

    if (Math.hypot(dx, dy) > 6) return;

    const clicked = pickSceneObject(event, canvas, camera, raycaster, pointer, {
      earth,
      moon,
      moonHitArea,
      sceneFocus,
      isMobile: window.matchMedia("(max-width: 900px)").matches
    });

    if (clicked === "moon" && sceneFocus !== "moon") {
      switchSceneFocus("moon");
      return;
    }

    if (clicked === "earth" && sceneFocus === "moon") {
      switchSceneFocus("earth");
    }
  });

  function switchSceneFocus(mode) {
    if (sceneFocus === mode) return;

    if (!savedView && sceneFocus === "earth") {
      savedView = captureSceneView(camera, controls);
    }

    if (mode === "earth" && savedView) {
      restoreView = savedView;
      restoreUntil = performance.now() + 850;
      savedView = null;
    }

    sceneFocus = mode;
    focusAutoUntil = mode === "moon" ? performance.now() + 1100 : 0;
    updateSceneTitle(mode);
  }

  let issModel = null;
  const issSolarPanels = [];

  gltfLoader.load(
    MODEL_PATHS.ISS,
    (gltf) => {
      issModel = gltf.scene;
      issModel.name = "ISS Station";
      normalizeModel(issModel, SATELLITE_CONFIG_OVERRIDES.ISS.modelSize);
      issModel.rotation.set(0, Math.PI * 0.5, 0);

      issModel.traverse((object) => {
        if (!object.isMesh) return;

        object.frustumCulled = false;
        object.castShadow = false;
        object.receiveShadow = false;

        if (object.material) {
          object.material.side = THREE.DoubleSide;
          object.material.needsUpdate = true;
        }
      });

      issSolarPanels.push(...collectSolarPanelMeshes(issModel));
      issAnchor.add(issModel);
    },
    (xhr) => {
      updateLoaderProgress("ISS model", xhr.loaded, xhr.total);
    },
    (error) => {
      console.error("Failed to load ISS GLB model:", error);
    }
  );

  const stars = makeStars();
  scene.add(stars);

  const sunLight = new THREE.DirectionalLight(0xffffff, 4.2);
  scene.add(sunLight);

  const fillLight = new THREE.HemisphereLight(0x8caeff, 0x05070d, 0.82);
  scene.add(fillLight);

  let issLat = 0;
  let issLon = 0;
  let targetLat = 0;
  let targetLon = 0;
  let hasLiveIssFix = false;
  let lastLiveIssAt = 0;

  function syncIss() {
    const state = computeIssState(new Date());
    targetLat = state.lat;
    targetLon = state.lon;
    updateIssReadout(targetLat, targetLon);
  }

  syncIss();
  setInterval(syncIss, 1000);

  function resize() {
    const hero = document.querySelector(".iss-hero");
    const rect = (hero || document.body).getBoundingClientRect();

    renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false);
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
  }

  new ResizeObserver(resize).observe(document.querySelector(".iss-hero") || document.body);
  resize();

  function animate(ms) {
    const t = ms * 0.001;

    const computedIss = computeIssState(new Date());
    targetLat = computedIss.lat;
    targetLon = computedIss.lon;

    issLat += (targetLat - issLat) * 0.045;
    issLon += shortestLonDelta(issLon, targetLon) * 0.045;
    updateIssReadout(issLat, issLon);

    const sunDir = getSunDirection(new Date());
    sunLight.position.copy(sunDir.clone().multiplyScalar(8));
    night.material.uniforms.sunDirection.value.copy(sunDir);
    cityLights.material.uniforms.sunDirection.value.copy(sunDir);

    const issPos = latLonToVector3(issLat, issLon, 2.22);
    issAnchor.position.copy(issPos);
    issAnchor.lookAt(0, 0, 0);
    issAnchor.rotateY(Math.PI);

    if (issModel) {
      issModel.rotation.z = Math.sin(t * 0.7) * 0.035;
    }

    earthMoonSystem.rotation.y = t * 0.004;
    moon.rotation.y = -earthMoonSystem.rotation.y;

    if (moon.userData.surface) {
      moon.userData.surface.rotation.y = t * 0.026;
    }

    moonHitArea.position.copy(moon.position);
    lunarSystem.animate(t, sunDir, sceneFocus === "moon");

    earth.rotation.y = t * 0.012;
    clouds.rotation.y = t * 0.018;
    night.rotation.copy(earth.rotation);
    cityLights.rotation.copy(earth.rotation);
    atmosphere.rotation.copy(earth.rotation);
    satelliteSystem.animate(t, sunDir, sceneFocus);
    if (performance.now() < restoreUntil && restoreView) {
      updateRestoreCamera(camera, controls, restoreView);
    } else {
      restoreView = null;
      updateSceneFocusCamera(
        camera,
        controls,
        sceneFocus,
        issAnchor,
        satelliteSystem,
        lunarSystem,
        performance.now() < focusAutoUntil
      );
    }
    stars.rotation.y = t * 0.004;

    applyMotionParallax(camera, controls, motionState);
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}


function createLunarOrbiterSystem(gltfLoader) {
  const root = new THREE.Group();
  root.name = "Lunar Orbiter System";

  const orbit = createLunarOrbitLine(0.82, THREE.MathUtils.degToRad(72));
  const orbiter = createLroStyleOrbiter(gltfLoader);

  root.add(orbit, orbiter);

  // Orbital elements for LRO (approx): semi-major axis = 0.82 (relative), inclination = 72 deg, period ~ 2h (7200s)
  const LRO_ORBITAL_PERIOD_S = 7200; // 2 hours
  const LRO_INCLINATION_RAD = THREE.MathUtils.degToRad(72);
  const LRO_RAAN_RAD = 0; // for demonstration, can be set for precession
  const LRO_EPOCH = Date.UTC(2024, 0, 1, 0, 0, 0); // arbitrary reference epoch

  function getLroPhase(now) {
    const elapsed = (now.getTime() - LRO_EPOCH) / 1000;
    return ((elapsed / LRO_ORBITAL_PERIOD_S) * Math.PI * 2) % (Math.PI * 2);
  }

  return {
    root,
    orbiter,
    animate(t, sunDirection, isMoonFocus) {
      // Use real UTC-based phase
      const now = new Date();
      const phase = getLroPhase(now);
      const position = lunarOrbitPoint(phase, 0.82, LRO_INCLINATION_RAD);
      orbiter.position.copy(position);
      orbiter.lookAt(0, 0, 0);
      orbiter.rotateY(Math.PI * 0.5);
      orbit.material.opacity = isMoonFocus ? 0.20 : 0.08;
      orbiter.scale.setScalar(isMoonFocus ? 1.08 : 0.92);
    }
  };
}

function createLroStyleOrbiter(gltfLoader) {
  const group = new THREE.Group();
  group.name = "LRO Orbiter";
  group.visible = false;

  gltfLoader.load(
    MODEL_PATHS.lro,
    (gltf) => {
      const model = gltf.scene;
      normalizeModel(model, 0.18);
      prepareModel(model);
      enhanceImportedModel(model, null);
      group.add(model);
      group.visible = true;
    },
    (xhr) => {
      updateLoaderProgress("LRO model", xhr.loaded, xhr.total);
    },
    (error) => {
      console.warn("LRO GLB failed. Put the real model at models/glb/lro.glb", error);
      group.visible = false;
    }
  );

  return group;
}


function createLunarOrbitLine(radius, inclination) {
  const points = [];

  for (let i = 0; i <= 360; i += 1) {
    const phase = (i / 360) * Math.PI * 2;
    points.push(lunarOrbitPoint(phase, radius, inclination));
  }

  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({
      color: "#dbeafe",
      transparent: true,
      opacity: 0.12
    })
  );
}

function lunarOrbitPoint(phase, radius, inclination) {
  return new THREE.Vector3(
    Math.cos(phase) * radius,
    Math.sin(phase) * Math.sin(inclination) * radius,
    Math.sin(phase) * Math.cos(inclination) * radius
  );
}


function pickSceneObject(event, canvas, camera, raycaster, pointer, objects) {
  const rect = canvas.getBoundingClientRect();

  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  if (objects.isMobile) {
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const isLandscape = rect.width > rect.height;

    const isMiddleZone = isLandscape
      ? y > rect.height * 0.12 && y < rect.height * 0.88
      : y > rect.height * 0.22 && y < rect.height * 0.80;

    if (objects.sceneFocus === "moon") {
      const isLeftReturnZone = isLandscape
        ? x < rect.width * 0.34
        : x < rect.width * 0.40;

      if (isLeftReturnZone && isMiddleZone) return "earth";
    } else {
      const isRightMoonZone = isLandscape
        ? x > rect.width * 0.56
        : x > rect.width * 0.42;

      if (isRightMoonZone && isMiddleZone) return "moon";
    }
  }

  const hitScreenSphere = (object, worldRadius, minPixels, multiplier) => {
    const world = object.getWorldPosition(new THREE.Vector3());
    const screen = world.clone().project(camera);

    if (screen.z <= -1 || screen.z >= 1) return false;

    const x = (screen.x * 0.5 + 0.5) * rect.width + rect.left;
    const y = (-screen.y * 0.5 + 0.5) * rect.height + rect.top;
    const radius = getProjectedRadius(camera, world, worldRadius, rect.height);

    return Math.hypot(event.clientX - x, event.clientY - y) < Math.max(minPixels, radius * multiplier);
  };

  if (objects.sceneFocus === "moon") {
    const earthHits = raycaster.intersectObject(objects.earth, true);
    if (earthHits.length > 0) return "earth";

    if (hitScreenSphere(objects.earth, EARTH_RADIUS, 280, 2.6)) {
      return "earth";
    }
  }

  const moonHits = raycaster.intersectObjects([objects.moonHitArea, objects.moon], true);
  if (moonHits.length > 0) return "moon";

  if (hitScreenSphere(objects.moon, MOON_RADIUS, objects.isMobile ? 220 : 140, objects.isMobile ? 5 : 3)) {
    return "moon";
  }

  if (objects.isMobile) {
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const isMiddleY = y > rect.height * 0.26 && y < rect.height * 0.76;

    if (objects.sceneFocus === "moon") {
      const isLeftEarthReturnZone = x < rect.width * 0.28 && isMiddleY;

      if (isLeftEarthReturnZone) return "earth";
    } else {
      const isRightMoonZone = x > rect.width * 0.42 && isMiddleY;

      if (isRightMoonZone) return "moon";
    }
  }

  const earthHits = raycaster.intersectObject(objects.earth, true);
  if (earthHits.length > 0) return "earth";

  if (hitScreenSphere(objects.earth, EARTH_RADIUS, 180, 1.8)) {
    return "earth";
  }

  return null;
}

function getProjectedRadius(camera, worldPosition, radius, viewportHeight) {
  const distance = camera.position.distanceTo(worldPosition);
  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const visibleHeight = 2 * Math.tan(vFov / 2) * distance;

  return (radius / visibleHeight) * viewportHeight;
}

function createMoon(gltfLoader, textureLoader, renderer) {
  const moon = new THREE.Group();
  const surface = new THREE.Group();
  moon.userData.surface = surface;
  moon.add(surface);

  function setObjectOpacity(object, opacity) {
    object.traverse((child) => {
      if (!child.isMesh || !child.material) return;

      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => {
        material.transparent = true;
        material.opacity = opacity;
        material.needsUpdate = true;
      });
    });
  }

  function disposeObject(object) {
    object.traverse((child) => {
      if (!child.isMesh) return;

      child.geometry?.dispose?.();

      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => {
        if (!material) return;
        ["map", "normalMap", "bumpMap", "roughnessMap", "metalnessMap", "emissiveMap"].forEach((key) => {
          material[key]?.dispose?.();
        });
        material.dispose?.();
      });
    });
  }

  function fadeReplace(oldObject, newObject, fadeTime = 0.75) {
    if (!newObject) return;

    // Ensure newObject is a Group or Mesh and can be faded
    setObjectOpacity(newObject, 0);
    surface.add(newObject);

    let start = 0;
    function animateFade(now) {
      if (!start) start = now;
      const progress = Math.min(1, (now - start) / (fadeTime * 1000));

      setObjectOpacity(newObject, progress);
      if (oldObject) setObjectOpacity(oldObject, 1 - progress);

      if (progress < 1) {
        requestAnimationFrame(animateFade);
        return;
      }

      setObjectOpacity(newObject, 1);
      if (oldObject && oldObject.parent) {
        oldObject.parent.remove(oldObject);
        disposeObject(oldObject);
      }
    }

    requestAnimationFrame(animateFade);
  }

  function prepareMoonModel(model, targetSize, name) {
    model.name = name;
    normalizeModel(model, targetSize);
    prepareModel(model);
    enhanceImportedModel(model, renderer);
    return model;
  }

  const fallbackTexture = textureLoader.load(
    "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/moon_1024.jpg"
  );
  fallbackTexture.colorSpace = THREE.SRGBColorSpace;
  fallbackTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const fallback = new THREE.Mesh(
    new THREE.SphereGeometry(MOON_RADIUS, 96, 96),
    new THREE.MeshStandardMaterial({
      map: fallbackTexture,
      bumpMap: fallbackTexture,
      bumpScale: 0.018,
      roughness: 0.96,
      metalness: 0,
      transparent: true,
      opacity: 1
    })
  );
  fallback.name = "MoonFallback";
  surface.add(fallback);

  let activeMoon = fallback;

  gltfLoader.load(
    MODEL_PATHS.moonSmall,
    (gltf) => {
      const smallMoon = prepareMoonModel(gltf.scene, MOON_RADIUS * 2, "MoonSmall");
      fadeReplace(activeMoon, smallMoon, 0.65);
      activeMoon = smallMoon;

      gltfLoader.load(
        MODEL_PATHS.moon8k,
        (highGltf) => {
          const highMoon = prepareMoonModel(highGltf.scene, MOON_RADIUS * 2, "Moon8K");
          fadeReplace(activeMoon, highMoon, 0.9);
          activeMoon = highMoon;
          if (loaderDetail) loaderDetail.textContent = "Moon upgraded to 8K";

          // 8K加载完成后，如果桌面端且用户开关 ENABLE_23K 为 true，则尝试加载 23K 模型
          if (
            ENABLE_23K &&
            !isMobile &&
            window.innerWidth > 768 &&
            navigator.hardwareConcurrency > 4
          ) {
            gltfLoader.load(
              MODEL_PATHS.moon23k,
              (gltf23k) => {
                const moon23k = prepareMoonModel(gltf23k.scene, MOON_RADIUS * 2, "Moon23K");
                fadeReplace(activeMoon, moon23k, 1.0);
                activeMoon = moon23k;
                if (loaderDetail) loaderDetail.textContent = "Moon upgraded to 23K";
              },
              (xhr) => updateLoaderProgress("Moon 23K model", xhr.loaded, xhr.total),
              (err) => console.warn("Moon 23K GLB 加载失败:", err)
            );
          }
        },
        (xhr) => {
          updateLoaderProgress("Moon 8K model", xhr.loaded, xhr.total);
        },
        (error) => {
          console.warn("Moon 8K GLB 加载失败:", error);
        }
      );
    },
    (xhr) => {
      updateLoaderProgress("Moon small model", xhr.loaded, xhr.total);
    },
    (error) => {
      console.warn("Moon small GLB 加载失败，继续使用 fallback:", error);
    }
  );

  const rim = new THREE.Mesh(
    new THREE.SphereGeometry(MOON_RADIUS * 1.055, 128, 128),
    new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        glowColor: { value: new THREE.Color("#b8c7ff") }
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        uniform vec3 glowColor;
        void main() {
          float rim = pow(0.68 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.4);
          gl_FragColor = vec4(glowColor, rim * 0.15);
        }
      `
    })
  );

  moon.add(rim);
  return moon;
}


function enhanceImportedModel(model, renderer) {
  const maxAnisotropy = renderer?.capabilities?.getMaxAnisotropy?.() || 8;

  model.traverse((object) => {
    if (!object.isMesh) return;

    if (object.geometry) {
      object.geometry.computeVertexNormals();
      object.geometry.attributes.normal.needsUpdate = true;
    }

    const materials = Array.isArray(object.material) ? object.material : [object.material];

    materials.forEach((material) => {
      if (!material) return;

      material.flatShading = false;
      material.roughness = material.roughness ?? 0.92;
      material.metalness = material.metalness ?? 0;

      // Slightly boost brightness for ISS, Starlink, Weather, Moon, LRO models
      // (applied to all imported GLBs, which is correct for this context)
      if (material.color && material.color.isColor) {
        material.color.multiplyScalar(1.13);
      }
      if (material.emissive && material.emissive.isColor && material.emissive.getHex() !== 0x000000) {
        material.emissive.multiplyScalar(1.11);
      }

      ["map", "normalMap", "bumpMap", "roughnessMap", "metalnessMap", "emissiveMap"].forEach((key) => {
        const texture = material[key];
        if (!texture) return;

        if (key === "map" || key === "emissiveMap") {
          texture.colorSpace = THREE.SRGBColorSpace;
        }

        texture.anisotropy = maxAnisotropy;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = true;
        texture.needsUpdate = true;
      });

      material.needsUpdate = true;
    });
  });
}

function makeMoonOrbitLine() {
  const points = [];

  for (let i = 0; i <= 360; i += 1) {
    const a = (i / 360) * Math.PI * 2;
    points.push(new THREE.Vector3(
      Math.cos(a) * MOON_DISPLAY_DISTANCE,
      0.65,
      Math.sin(a) * MOON_DISPLAY_DISTANCE - 1.25
    ));
  }

  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({
      color: "#dbeafe",
      transparent: true,
      opacity: 0.12
    })
  );
}

function updateSceneTitle(mode) {
  if (!sceneTitleMain || !sceneTitleSub) return;

  const title = sceneTitleMain.closest(".scene-title");
  const isMoon = mode === "moon";
  const nextMain = isMoon ? "Moon" : "Earth";

  if (sceneTitleMain.textContent === nextMain) return;

  const exitClass = isMoon ? "is-slide-down" : "is-slide-up";
  const enterClass = isMoon ? "is-enter-from-up" : "is-enter-from-down";

  title.classList.remove(
    "is-slide-down",
    "is-slide-up",
    "is-enter-from-up",
    "is-enter-from-down"
  );

  title.classList.add(exitClass);

  window.setTimeout(() => {
    sceneTitleMain.textContent = nextMain;
    sceneTitleSub.textContent = "Observer";

    title.classList.remove(exitClass);
    title.classList.add(enterClass);

    window.setTimeout(() => {
      title.classList.remove(enterClass);
    }, 480);
  }, 220);
}


function bindSceneFocusControls(onChange) {
  document.querySelectorAll("[data-scene-focus]").forEach((button) => {
    button.addEventListener("click", () => {
      const mode = button.dataset.sceneFocus;
      const wasActive = button.classList.contains("is-active");

      document.querySelectorAll("[data-scene-focus]").forEach((item) => {
        item.classList.remove("is-active");
      });

      if (!wasActive) {
        button.classList.add("is-active");
      }

      onChange(mode);
    });
  });
}

function captureSceneView(camera, controls) {
  return {
    cameraPosition: camera.position.clone(),
    controlsTarget: controls.target.clone()
  };
}

function restoreSceneView(camera, controls, view) {
  camera.position.copy(view.cameraPosition);
  controls.target.copy(view.controlsTarget);
  controls.update();

  document.querySelectorAll("[data-scene-focus]").forEach((item) => {
    item.classList.remove("is-active");
  });
}

function updateRestoreCamera(camera, controls, view) {
  camera.position.lerp(view.cameraPosition, 0.085);
  controls.target.lerp(view.controlsTarget, 0.085);

  document.querySelectorAll("[data-scene-focus]").forEach((item) => {
    item.classList.remove("is-active");
  });
}

function updateSceneFocusCamera(camera, controls, mode, issAnchor, satelliteSystem, lunarSystem, shouldAutoZoom = false) {
  const target = getSceneFocusTarget(mode, issAnchor, satelliteSystem, lunarSystem);
  const desiredDistance = getSceneFocusDistance(mode);

  const previousTarget = controls.target.clone();
  const currentDistance = camera.position.distanceTo(previousTarget);
  const viewDir = camera.position.clone().sub(previousTarget).normalize();
  const nextDistance = shouldAutoZoom
    ? THREE.MathUtils.lerp(currentDistance, desiredDistance, 0.08)
    : currentDistance;

  controls.target.lerp(target, 0.09);
  camera.position.copy(
    controls.target.clone().add(viewDir.multiplyScalar(nextDistance))
  );
}

function getSceneFocusTarget(mode, issAnchor, satelliteSystem, lunarSystem) {
  if (mode === "moon") return new THREE.Vector3(MOON_DISPLAY_DISTANCE, 0.65, -1.25);
  if (mode === "lro") return lunarSystem.orbiter.getWorldPosition(new THREE.Vector3());
  if (mode === "iss") return issAnchor.position.clone();

  if (mode === "starlink") {
    return getFirstSatellitePosition(satelliteSystem, "starlink");
  }

  if (mode === "weather") {
    return getFirstSatellitePosition(satelliteSystem, "weather");
  }

  return new THREE.Vector3(0, 0, 0);
}

function getFirstSatellitePosition(system, key) {
  const layer = system.layers[key];
  const item = layer?.userData?.items?.[0];

  if (!item) return new THREE.Vector3(0, 0, 0);

  return item.getWorldPosition(new THREE.Vector3());
}

function getSceneFocusDistance(mode) {
  if (mode === "moon") return 2.05;
  if (mode === "lro") return 0.28;
  if (mode === "iss") return isMobile ? 0.48 : 0.26;
  if (mode === "starlink") return isMobile ? 0.62 : 0.36;
  if (mode === "weather") return isMobile ? 0.86 : 0.52;
  return 5.35;
}


function createSatelliteSystem(loader) {
  const root = new THREE.Group();
  const layers = {};

  // Orbital parameters for UTC-synchronized orbits
  // Starlink example: period ~ 95 min, inclination 53 deg, 6 planes
  // Weather (e.g. GOES): geostationary, period 24h, inclination 0 deg
  // All times in seconds
  const STARLINK_PERIOD_S = 5700; // 95 min
  const STARLINK_INCLINATION_RAD = THREE.MathUtils.degToRad(53);
  const STARLINK_PLANES = 6;
  const STARLINK_EPOCH = Date.UTC(2024, 0, 1, 0, 0, 0);
  const WEATHER_PERIOD_S = 86400; // 24h
  const WEATHER_INCLINATION_RAD = 0;
  const WEATHER_EPOCH = Date.UTC(2024, 0, 1, 0, 0, 0);

  const configs = [
    {
      key: "starlink",
      label: "Starlink",
      count: SATELLITE_CONFIG_OVERRIDES.starlink.count,
      radius: SATELLITE_CONFIG_OVERRIDES.starlink.radius,
      inclination: 53,
      speed: 0.55, // kept for fallback
      color: "#dbeafe",
      size: SATELLITE_CONFIG_OVERRIDES.starlink.modelSize,
      planes: STARLINK_PLANES,
      modelPath: MODEL_PATHS.starlink,
      modelSize: SATELLITE_CONFIG_OVERRIDES.starlink.modelSize * 17,
      period: STARLINK_PERIOD_S,
      inclinationRad: STARLINK_INCLINATION_RAD,
      epoch: STARLINK_EPOCH
    },
    {
      key: "weather",
      label: "Weather",
      count: SATELLITE_CONFIG_OVERRIDES.weather.count,
      radius: SATELLITE_CONFIG_OVERRIDES.weather.radius,
      inclination: 0,
      speed: 0.032, // kept for fallback
      color: "#67e8f9",
      size: SATELLITE_CONFIG_OVERRIDES.weather.modelSize / 2.7,
      planes: 1,
      modelPath: MODEL_PATHS.weather,
      modelSize: SATELLITE_CONFIG_OVERRIDES.weather.modelSize,
      period: WEATHER_PERIOD_S,
      inclinationRad: WEATHER_INCLINATION_RAD,
      epoch: WEATHER_EPOCH
    }
  ];

  configs.forEach((config) => {
    const layer = new THREE.Group();
    layer.name = config.label;
    layer.visible = satelliteVisibility[config.key];
    layer.userData.key = config.key;
    layer.userData.items = [];

    addOrbitGuide(layer, config);

    for (let i = 0; i < config.count; i += 1) {
      const plane = i % config.planes;
      const satIndexInPlane = Math.floor(i / config.planes);
      const phaseOffset = (satIndexInPlane / Math.ceil(config.count / config.planes)) * Math.PI * 2;
      const raan = (plane / config.planes) * Math.PI * 2;
      const satellite = createFallbackSatellite(config.color, config.size);

      satellite.userData = {
        radius: config.radius,
        inclination: config.inclinationRad,
        raan,
        phaseOffset,
        period: config.period,
        epoch: config.epoch,
        speed: config.speed * (0.88 + Math.random() * 0.24), // fallback only
        solarPanels: []
      };

      layer.add(satellite);
      layer.userData.items.push(satellite);
    }

    layers[config.key] = layer;
    root.add(layer);
    loadSatelliteModel(loader, config, layer.userData.items);
  });

  function getSatellitePhase(sat, now) {
    // UTC-based phase
    const elapsed = (now.getTime() - sat.epoch) / 1000;
    // phase increases with time, plus offset for satellite's position in its plane
    return ((elapsed / sat.period) * Math.PI * 2 + sat.phaseOffset) % (Math.PI * 2);
  }

  return {
    root,
    layers,
    animate(t, sunDirection, focusKey = "earth") {
      const now = new Date();
      Object.values(layers).forEach((layer) => {
        const items = layer.userData.items || [];
        const isFocusedLayer = focusKey === layer.userData.key;
        items.forEach((satellite, index) => {
          const isPrimaryFocus = isFocusedLayer && index === 0;
          const focusScale = isPrimaryFocus
            ? layer.userData.key === "weather"
              ? isMobile ? 1.55 : 1.28
              : isMobile ? 4.2 : 2.8
            : 1;
          // Calculate UTC-based phase
          const phase = getSatellitePhase(satellite.userData, now);
          const position = orbitPosition(
            phase,
            satellite.userData.radius,
            satellite.userData.inclination,
            satellite.userData.raan
          );
          satellite.position.copy(position);
          satellite.lookAt(0, 0, 0);
          satellite.rotateY(Math.PI / 2);
          if (layer.userData.key === "weather" || layer.userData.key === "starlink") {
            satellite.rotateZ(-0.18);
          }
          satellite.scale.lerp(
            new THREE.Vector3(focusScale, focusScale, focusScale),
            0.08
          );
        });
      });
    }
  };
}

function loadSatelliteModel(loader, config, satellites) {
  loader.load(
    config.modelPath,
    (gltf) => {
      const prototype = gltf.scene;
      normalizeModel(prototype, config.modelSize);
      prepareModel(prototype);
      enhanceImportedModel(prototype, null);

      satellites.forEach((satellite, index) => {
        satellite.clear();
        const clone = prototype.clone(true);
        clone.rotation.y = (index % 3) * 0.18;
        satellite.userData.solarPanels = collectSolarPanelMeshes(clone);
        satellite.add(clone);
      });
    },
    (xhr) => {
      updateLoaderProgress(`${config.label} model`, xhr.loaded, xhr.total);
    },
    (error) => console.warn(`${config.label} model failed, using fallback:`, error)
  );
}

function createFallbackSatellite(color, size) {
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(size * 2.4, size * 1.2, size * 1.2),
    new THREE.MeshBasicMaterial({ color })
  );

  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(size * 5.2, size * 0.22, size * 1.5),
    new THREE.MeshBasicMaterial({ color })
  );

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(size * 3.6, 16, 16),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.14,
      depthWrite: false
    })
  );

  panel.position.x = size * 2.5;
  group.userData.solarPanels = [panel];
  group.add(glow, body, panel);
  return group;
}

function addOrbitGuide(layer, config) {
  const points = [];

  for (let i = 0; i <= 360; i += 1) {
    const phase = (i / 360) * Math.PI * 2;
    points.push(orbitPosition(
      phase,
      config.radius,
      THREE.MathUtils.degToRad(config.inclination),
      0
    ));
  }

  layer.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({
      color: config.color,
      transparent: true,
      opacity: config.key === "starlink" ? 0.08 : 0.16
    })
  ));
}

function orbitPosition(phase, radius, inclination, raan) {
  const x = Math.cos(phase) * radius;
  const y = Math.sin(phase) * radius * Math.sin(inclination);
  const z = Math.sin(phase) * radius * Math.cos(inclination);
  const point = new THREE.Vector3(x, y, z);
  point.applyAxisAngle(new THREE.Vector3(0, 1, 0), raan);
  return point;
}

function bindSatelliteToggles(system) {
  document.querySelectorAll("[data-sat-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.satToggle;
      const layer = system.layers[key];

      if (!layer) return;

      layer.visible = !layer.visible;
      satelliteVisibility[key] = layer.visible;
      button.classList.toggle("is-active", layer.visible);
    });
  });
}


// Compute ISS state based on UTC and real orbital elements (approximation)
function computeIssState(date) {
  // ISS orbital elements (approximate, TLE-independent)
  // Epoch: ISS_EPOCH_MS, period: ISS_ORBIT_PERIOD_MIN (min), inclination: ISS_INCLINATION_DEG
  // Reference: https://www.celestrak.com/NORAD/elements/stations.txt
  // We'll use a simple SGP-like propagation for demo
  const elapsedMin = (date.getTime() - ISS_EPOCH_MS) / 60000;
  const phase = (elapsedMin / ISS_ORBIT_PERIOD_MIN) * Math.PI * 2;
  // Calculate latitude (inclined sinusoidal)
  const lat = Math.asin(Math.sin(ISS_INCLINATION_DEG * Math.PI / 180) * Math.sin(phase)) * (180 / Math.PI);
  // Longitude: account for Earth's rotation
  const earthRotationDeg = (elapsedMin / 1440) * 360; // 1 sidereal day = 23h 56m ~ 1440 min
  const lon = normalizeLongitude((THREE.MathUtils.radToDeg(phase) - earthRotationDeg) % 360 - 180);
  return { lat, lon };
}

function normalizeLongitude(lon) {
  let value = lon;

  while (value > 180) value -= 360;
  while (value < -180) value += 360;

  return value;
}

function updateIssReadout() {
  // Coordinate HUD removed.
}

function normalizeModel(model, targetSize = 1) {
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();

  box.getSize(size);
  box.getCenter(center);

  const maxAxis = Math.max(size.x, size.y, size.z) || 1;
  const scale = targetSize / maxAxis;

  model.scale.setScalar(scale);
  model.position.sub(center.multiplyScalar(scale));
}

function collectSolarPanelMeshes(model) {
  const panels = [];

  model.traverse((object) => {
    if (!object.isMesh) return;

    const box = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    box.getSize(size);

    const dims = [size.x, size.y, size.z].sort((a, b) => b - a);
    const longest = dims[0] || 0;
    const middle = dims[1] || 0;
    const shortest = dims[2] || 0;

    const isFlatWide = longest > middle * 1.45 && middle > shortest * 2.2;
    const isLargeEnough = longest > 0.035 && middle > 0.012;

    if (isFlatWide && isLargeEnough) {
      panels.push(object);
    }
  });

  return panels.slice(0, 8);
}

function trackSolarPanels() {
  // Disabled: rotating imported GLB child meshes independently can split model parts.
}

function prepareModel(model) {
  model.traverse((object) => {
    if (!object.isMesh) return;

    object.frustumCulled = false;
    object.castShadow = false;
    object.receiveShadow = false;

    const materials = Array.isArray(object.material) ? object.material : [object.material];

    materials.forEach((material) => {
      if (!material) return;
      material.side = THREE.DoubleSide;
      material.needsUpdate = true;
    });
  });
}

function latLonToVector3(lat, lon, radius) {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lon + 180);

  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function shortestLonDelta(current, target) {
  let delta = target - current;
  while (delta > 180) delta -= 360;
  while (delta < -180) delta += 360;
  return delta;
}

function getSunDirection(date) {
  const dayMs = 86400000;
  const utc =
    date.getUTCHours() * 3600000 +
    date.getUTCMinutes() * 60000 +
    date.getUTCSeconds() * 1000;

  const angle = (utc / dayMs) * Math.PI * 2 - Math.PI;
  const season = Math.sin(((date.getUTCMonth() + 1) / 12) * Math.PI * 2) * 0.36;

  return new THREE.Vector3(
    Math.cos(angle),
    season,
    Math.sin(angle)
  ).normalize();
}

function makeStars() {
  const count = 1200;
  const pos = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    const r = 18 + Math.random() * 22;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.cos(phi);
    pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));

  return new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      color: "#ffffff",
      size: 0.035,
      transparent: true,
      opacity: 0.72
    })
  );
}

function makeOrbitLine() {
  const points = [];

  for (let i = 0; i <= 360; i += 1) {
    const lon = -180 + i;
    const lat = Math.sin((i / 360) * Math.PI * 2) * 51.6;
    points.push(latLonToVector3(lat, lon, 2.035));
  }

  const geo = new THREE.BufferGeometry().setFromPoints(points);

  return new THREE.Line(
    geo,
    new THREE.LineBasicMaterial({
      color: "#BFBFC1",
      transparent: true,
      opacity: 0.58
    })
  );
}


function createMotionState() {
  return {
    enabled: false,
    beta: 0,
    gamma: 0,
    targetBeta: 0,
    targetGamma: 0,
    calibratedBeta: 0,
    calibratedGamma: 0,
    calibrated: false
  };
}

function bindMotionToggle(state) {
  if (!motionToggle) return;

  motionToggle.addEventListener("click", async () => {
    if (state.enabled) {
      state.enabled = false;
      state.calibrated = false;
      motionToggle.classList.remove("is-active");
      motionToggle.textContent = "Motion View";
      return;
    }

    try {
      if (
        typeof DeviceOrientationEvent !== "undefined" &&
        typeof DeviceOrientationEvent.requestPermission === "function"
      ) {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission !== "granted") return;
      }

      state.enabled = true;
      state.calibrated = false;
      motionToggle.classList.add("is-active");
      motionToggle.textContent = "Motion On";
    } catch (error) {
      console.warn("Motion permission failed:", error);
    }
  });

  window.addEventListener("deviceorientation", (event) => {
    if (!state.enabled) return;

    const beta = event.beta ?? 0;
    const gamma = event.gamma ?? 0;

    if (!state.calibrated) {
      state.calibratedBeta = beta;
      state.calibratedGamma = gamma;
      state.calibrated = true;
    }

    state.targetBeta = THREE.MathUtils.clamp(beta - state.calibratedBeta, -24, 24);
    state.targetGamma = THREE.MathUtils.clamp(gamma - state.calibratedGamma, -24, 24);
  }, true);
}

function applyMotionParallax(camera, controls, state) {
  if (!state.enabled || !state.calibrated) return;

  state.beta += (state.targetBeta - state.beta) * 0.06;
  state.gamma += (state.targetGamma - state.gamma) * 0.06;

  const yaw = THREE.MathUtils.degToRad(state.gamma) * 0.035;
  const pitch = THREE.MathUtils.degToRad(state.beta) * 0.026;

  const target = controls.target.clone();
  const offset = camera.position.clone().sub(target);
  const distance = offset.length();

  const spherical = new THREE.Spherical().setFromVector3(offset);
  spherical.theta -= yaw;
  spherical.phi = THREE.MathUtils.clamp(
    spherical.phi + pitch,
    0.18,
    Math.PI - 0.18
  );

  const nextOffset = new THREE.Vector3().setFromSpherical(spherical).setLength(distance);
  camera.position.lerp(target.add(nextOffset), 0.08);
}
