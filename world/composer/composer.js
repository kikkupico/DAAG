/**
 * DAAG Composer - 3D Island & Shot Composition Studio
 *
 * Implements 3D exploration of Arche & Paxos, camera focal length & lens controls,
 * time of day & sun angle simulation, dynamic soft shadows, prop placement engine,
 * clean screen view capture (without UI elements), character reference picker,
 * photoreal / ligne claire AI prompt generator, and book shots.json storage.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { buildPrompt, loadPromptParts } from './js/prompt.js';
import { esc } from './js/util.js';
import { blenderToThree, threeToBlender, shotPoint, bearingToThree, shotToWorld, worldToFrame } from './js/coords.js';

// --- Application State ---
const state = {
  // Camera & Framing
  lens: 26,             // mm
  aspect: '3:4',        // '3:4', '16:9', '1:1', '4:3', '2:3', '9:16'
  fov: 42,
  showGrid: true,
  showLabels: true,
  roofsLifted: false,

  // Environment & Light
  timeOfDay: 'golden',  // 'morning', 'golden', 'noon', 'overcast', 'late', 'dusk'
  sunAzimuth: 250,      // degrees (0 = North, 90 = East, 180 = South, 270 = West)
  sunElevation: 24,     // degrees
  sunIntensity: 1.5,
  fogDensity: 25,       // %
  seaWaves: true,

  // Props
  placePropMode: false,
  activePropId: null,   // the first prop of the catalog until one is picked
  propsCatalog: [],
  placedProps: [],
  selectedPlacedProp: null,
  gizmoMode: 'translate', // 'translate', 'rotate', 'scale'

  // Cast & Characters
  castData: { characters: [], sheets: {} },
  selectedCast: ['legislator-man', 'paxos-messenger'],

  // Capture & Prompt Studio
  capturedImageURL: null,
  captureFilename: null,
  renderJob: null,       // the Blender render in progress, if any
  renderURL: null,       // its picture when done
  shotsData: null,       // the book on show in the shots browser: { book, shots, images }
  promptStyle: 'photo', // 'photo' | 'ligne-claire'
  promptAction: 'On the terrace before the colonnade, legislator-man stands writing on an open papyrus scroll while paxos-messenger hands him a small papyrus slip.',
  promptOthers: 'a dozen more legislators in long white chitons strolling across the terrace and in and out by the open door.',

  // Book Storage
  books: [],
  activeBook: 'the-part-time-parliament',
  shotId: 'cover-alt',

  // Layout & Sites
  island: 'paxos',      // the island model on screen: 'arche' | 'paxos'
  sites: [],            // named places of that island, Blender coordinates
  frames: {},           // building frames for shots given with a "site"
  shotSite: null,       // the site of the shot on screen, if its camera is in that building's frame
  islandModel: null
};

// --- DOM References ---
const dom = {
  container: document.getElementById('canvas-container'),
  loadingOverlay: document.getElementById('loading-overlay'),
  progressBarFill: document.getElementById('progress-bar-fill'),
  loadingStatus: document.getElementById('loading-status'),
  sitePinsLayer: document.getElementById('site-pins-layer'),
  framingBox: document.getElementById('framing-box'),
  matteLabel: document.getElementById('matte-label'),

  // Camera Tab
  focalSlider: document.getElementById('focal-slider'),
  focalVal: document.getElementById('focal-val'),
  fovDisplay: document.getElementById('fov-display'),
  camX: document.getElementById('cam-x'),
  camY: document.getElementById('cam-y'),
  camZ: document.getElementById('cam-z'),
  tarX: document.getElementById('tar-x'),
  tarY: document.getElementById('tar-y'),
  tarZ: document.getElementById('tar-z'),

  // Environment Tab
  sunAzimuthSlider: document.getElementById('sun-azimuth-slider'),
  sunAzimuthVal: document.getElementById('sun-azimuth-val'),
  sunElevationSlider: document.getElementById('sun-elevation-slider'),
  sunElevationVal: document.getElementById('sun-elevation-val'),
  sunIntensitySlider: document.getElementById('sun-intensity-slider'),
  sunIntensityVal: document.getElementById('sun-intensity-val'),
  fogDensitySlider: document.getElementById('fog-density-slider'),
  fogDensityVal: document.getElementById('fog-density-val'),
  seaWavesToggle: document.getElementById('sea-waves-toggle'),

  // Props
  btnPlacePropMode: document.getElementById('btn-place-prop-mode'),
  propsCatalogGrid: document.getElementById('props-catalog-grid'),
  placedPropsList: document.getElementById('placed-props-list'),
  placedPropsCount: document.getElementById('placed-props-count'),
  btnClearProps: document.getElementById('btn-clear-props'),
  propCategoryFilters: document.getElementById('prop-category-filters'),

  // Capture Modal
  captureModal: document.getElementById('capture-modal'),
  capturePreviewImg: document.getElementById('capture-preview-img'),
  previsMetaBadge: document.getElementById('previs-meta-badge'),
  btnCopyImage: document.getElementById('btn-copy-image'),
  btnDownloadImage: document.getElementById('btn-download-image'),
  btnRecapture: document.getElementById('btn-recapture'),
  modalCastStrip: document.getElementById('modal-cast-strip'),
  btnModalAddCast: document.getElementById('btn-modal-add-cast'),
  btnExportBundle: document.getElementById('btn-export-bundle'),
  promptActionInput: document.getElementById('prompt-action-input'),
  promptOthersInput: document.getElementById('prompt-others-input'),
  promptOutputText: document.getElementById('prompt-output-text'),
  btnCopyPrompt: document.getElementById('btn-copy-prompt'),
  saveBookSelect: document.getElementById('save-book-select'),
  saveShotId: document.getElementById('save-shot-id'),
  saveVariant: document.getElementById('save-variant'),
  btnRender: document.getElementById('btn-render'),
  renderStatus: document.getElementById('render-status'),
  renderQuality: document.getElementById('render-quality'),
  renderSize: document.getElementById('render-size'),
  renderResult: document.getElementById('render-result'),
  renderImg: document.getElementById('render-img'),
  btnRenderUse: document.getElementById('btn-render-use'),
  btnRenderOpen: document.getElementById('btn-render-open'),
  btnRenderDownload: document.getElementById('btn-render-download'),
  browserSearch: document.getElementById('browser-search'),
  browserOnlyPictures: document.getElementById('browser-only-pictures'),
  btnSaveShotBook: document.getElementById('btn-save-shot-book'),

  // Drawers
  castDrawer: document.getElementById('cast-drawer'),
  castCatalogGrid: document.getElementById('cast-catalog-grid'),
  castSheetTabs: document.getElementById('cast-sheet-tabs'),
  castSearchInput: document.getElementById('cast-search-input'),
  castBadgeCount: document.getElementById('cast-badge-count'),
  hudCastNames: document.getElementById('hud-cast-names'),
  hudCamSummary: document.getElementById('hud-cam-summary'),
  hudStatusDot: document.getElementById('hud-status-dot'),
  hudStatusText: document.getElementById('hud-status-text'),

  // Shots Browser Modal
  shotsBrowserModal: document.getElementById('shots-browser-modal'),
  browserBookSelect: document.getElementById('browser-book-select'),
  shotsBrowserList: document.getElementById('shots-browser-list'),

  // Toast
  toast: document.getElementById('toast'),

  // Docks & Headers
  leftDock: document.getElementById('left-dock'),
  btnDockCollapse: document.getElementById('btn-dock-collapse'),
  btnDockExpand: document.getElementById('btn-dock-expand'),
  teleportSelect: document.getElementById('teleport-select'),
  islandSelect: document.getElementById('island-select')
};

// --- Three.js Globals ---
let scene, camera, renderer, controls, transformControls;
let sunLight, ambientLight, hemisphereLight, seaMesh, skyDome;
let islandGroup, propsGroup, sitePins = [];
let raycaster, mouse;
const propModelCache = new Map();
const keyState = {};

// --- Initialize Scene & Application ---
async function init() {
  setupRenderer();
  setupScene();
  setupLighting();
  setupSea();
  setupControls();
  setupRaycaster();
  setupEventListeners();

  // Load backend data
  await loadPropsCatalog();
  await loadCastData();
  await loadBooksList();
  await loadPromptParts();

  // Load 3D Island Model
  loadIslandModel(state.island);

  // Start Animation Loop
  animate();
  updateFramingMatte();
  updatePrompt();
}

// --- 1. Three.js Core Setup ---
function setupRenderer() {
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: true // Crucial for clean screenshot canvas capture
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  dom.container.appendChild(renderer.domElement);

  camera = new THREE.PerspectiveCamera(state.fov, window.innerWidth / window.innerHeight, 1, 80000);
  camera.position.copy(blenderToThree([3000, -9000, 5500]));
  applyFocalLength(state.lens);
}

function setupScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x8cb6d8);
  scene.fog = new THREE.FogExp2(0x8cb6d8, 0.00004);

  islandGroup = new THREE.Group();
  propsGroup = new THREE.Group();
  scene.add(islandGroup);
  scene.add(propsGroup);

  // Sky Dome with subtle gradient
  const skyGeo = new THREE.SphereGeometry(60000, 32, 16);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      uTop: { value: new THREE.Color(0x568ec2) },
      uHorizon: { value: new THREE.Color(0xaed3ee) },
      uGround: { value: new THREE.Color(0x8cb6d8) }
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uTop;
      uniform vec3 uHorizon;
      uniform vec3 uGround;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition).y;
        vec3 col = h > 0.0 ? mix(uHorizon, uTop, max(0.0, pow(h, 0.6))) : mix(uHorizon, uGround, max(0.0, -h));
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
  skyDome = new THREE.Mesh(skyGeo, skyMat);
  scene.add(skyDome);
}

function setupLighting() {
  ambientLight = new THREE.AmbientLight(0xd9e5f2, 0.9);
  scene.add(ambientLight);

  hemisphereLight = new THREE.HemisphereLight(0xaed3ee, 0x485a6a, 0.6);
  scene.add(hemisphereLight);

  sunLight = new THREE.DirectionalLight(0xfff7e6, state.sunIntensity);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 10;
  sunLight.shadow.camera.far = 1600;
  sunLight.shadow.bias = -0.0003;
  sunLight.shadow.normalBias = 0.02;

  const d = 450;
  sunLight.shadow.camera.left = -d;
  sunLight.shadow.camera.right = d;
  sunLight.shadow.camera.top = d;
  sunLight.shadow.camera.bottom = -d;

  scene.add(sunLight);
  scene.add(sunLight.target);
  updateSunPosition();
}

function setupSea() {
  const seaGeo = new THREE.PlaneGeometry(80000, 80000, 96, 96);
  seaGeo.rotateX(-Math.PI / 2);

  const seaMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uDeepColor: { value: new THREE.Color(0x0e324c) },
      uShallowColor: { value: new THREE.Color(0x287799) },
      uSunDir: { value: new THREE.Vector3(0, 1, 0) },
      uSunColor: { value: new THREE.Color(0xfff5e6) }
    },
    vertexShader: `
      uniform float uTime;
      varying vec3 vWorldPos;
      varying vec3 vNormal;
      void main() {
        vec3 p = position;
        float p1 = p.x * 0.035 + uTime * 1.2;
        float q1 = p.z * 0.030 + uTime * 0.9;
        float w = sin(p1) * cos(q1) * 0.18 + cos(p.x * 0.07 - uTime * 1.5) * 0.09;
        p.y += w;
        vNormal = normalize(vec3(-0.035 * cos(p1) * cos(q1) * 0.18, 1.0, 0.030 * sin(p1) * sin(q1) * 0.18));
        vec4 wp = modelMatrix * vec4(p, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform vec3 uDeepColor;
      uniform vec3 uShallowColor;
      uniform vec3 uSunDir;
      uniform vec3 uSunColor;
      varying vec3 vWorldPos;
      varying vec3 vNormal;
      void main() {
        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 3.0);
        vec3 waterCol = mix(uDeepColor, uShallowColor, fresnel * 0.8 + 0.2);

        // Specular sun glint
        vec3 halfVec = normalize(uSunDir + viewDir);
        float spec = pow(max(dot(vNormal, halfVec), 0.0), 128.0) * 1.5;

        gl_FragColor = vec4(waterCol + uSunColor * spec, 0.95);
      }
    `,
    transparent: true
  });

  seaMesh = new THREE.Mesh(seaGeo, seaMat);
  seaMesh.position.y = 0.0;
  seaMesh.receiveShadow = true;
  scene.add(seaMesh);
}

function setupControls() {
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.minDistance = 2.0;
  controls.maxDistance = 40000.0;
  controls.target.set(0, 0, 0);

  transformControls = new TransformControls(camera, renderer.domElement);
  transformControls.size = 0.8;
  transformControls.setMode(state.gizmoMode);
  scene.add(transformControls);

  transformControls.addEventListener('dragging-changed', (event) => {
    controls.enabled = !event.value;
  });

  transformControls.addEventListener('change', () => {
    if (state.selectedPlacedProp) {
      updateCoordsDisplay();
    }
  });
}

function setupRaycaster() {
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
}

// --- 2. Sun, Lighting & Weather Simulation ---
/** Put the sun on its bearing and elevation, with the shadow box around what the camera looks at. */
function aimSun() {
  const radEl = (state.sunElevation * Math.PI) / 180;
  const dir = bearingToThree(state.sunAzimuth).multiplyScalar(Math.cos(radEl));
  dir.y = Math.sin(radEl);
  const aim = controls ? controls.target : new THREE.Vector3();
  sunLight.target.position.copy(aim);
  sunLight.position.copy(aim).addScaledVector(dir, 800);
  if (dir.y < 0.02) sunLight.position.y = aim.y + 10;
}

function updateSunPosition() {
  const radEl = (state.sunElevation * Math.PI) / 180;

  aimSun();
  sunLight.intensity = Math.max(0.1, state.sunIntensity * Math.sin(Math.max(radEl, 0.05)));

  if (seaMesh && seaMesh.material.uniforms) {
    seaMesh.material.uniforms.uSunDir.value.copy(sunLight.position).sub(sunLight.target.position).normalize();
  }

  // Update atmosphere & sky dome colors
  applyTimeOfDayAtmosphere();
}

function applyTimeOfDayAtmosphere() {
  let skyTop, skyHorizon, skyGround, fogCol, lightColor;

  switch (state.timeOfDay) {
    case 'morning':
      skyTop = 0x487ba8;
      skyHorizon = 0xf0d8be;
      skyGround = 0x8cb6d8;
      lightColor = 0xfffaea;
      fogCol = 0xcfdce8;
      break;
    case 'golden':
      skyTop = 0x3d648c;
      skyHorizon = 0xf5b574;
      skyGround = 0x6e7e8e;
      lightColor = 0xffdfa8;
      fogCol = 0xdcb896;
      break;
    case 'noon':
      skyTop = 0x24629e;
      skyHorizon = 0x9bc2e2;
      skyGround = 0x769ec2;
      lightColor = 0xffffff;
      fogCol = 0x9bc2e2;
      break;
    case 'overcast':
      skyTop = 0x808b96;
      skyHorizon = 0xb2bcc4;
      skyGround = 0x757f88;
      lightColor = 0xdfe4ea;
      fogCol = 0xb2bcc4;
      break;
    case 'late':
      skyTop = 0x243552;
      skyHorizon = 0xdf5a3c;
      skyGround = 0x5a343c;
      lightColor = 0xff8c55;
      fogCol = 0x985250;
      break;
    case 'dusk':
      skyTop = 0x0f1c2c;
      skyHorizon = 0x364962;
      skyGround = 0x1a2636;
      lightColor = 0x7890b0;
      fogCol = 0x223042;
      break;
    default:
      skyTop = 0x568ec2;
      skyHorizon = 0xaed3ee;
      skyGround = 0x8cb6d8;
      lightColor = 0xfff7e6;
      fogCol = 0x8cb6d8;
  }

  if (skyDome && skyDome.material.uniforms) {
    skyDome.material.uniforms.uTop.value.setHex(skyTop);
    skyDome.material.uniforms.uHorizon.value.setHex(skyHorizon);
    skyDome.material.uniforms.uGround.value.setHex(skyGround);
  }

  sunLight.color.setHex(lightColor);
  scene.fog.color.setHex(fogCol);
  renderer.setClearColor(fogCol);

  // Fog density
  const baseFog = 0.00001;
  const maxFog = 0.00012;
  scene.fog.density = baseFog + (state.fogDensity / 100) * (maxFog - baseFog);
}

// --- 3. Camera Optics & Framing Matte ---
function applyFocalLength(mm) {
  state.lens = mm;
  camera.setFocalLength(mm);
  camera.updateProjectionMatrix();

  state.fov = camera.fov;
  dom.focalSlider.value = mm;
  dom.focalVal.textContent = `${mm}mm`;
  dom.fovDisplay.textContent = `FOV: ${camera.fov.toFixed(1)}° (${mm}mm)`;
  dom.hudCamSummary.textContent = `Cam: ${mm}mm · ${state.aspect}`;

  updateFramingMatte();
}

function updateFramingMatte() {
  const parts = state.aspect.split(':');
  const targetAspect = parseFloat(parts[0]) / parseFloat(parts[1]);

  const winW = window.innerWidth;
  const winH = window.innerHeight;
  const screenAspect = winW / winH;

  let boxW, boxH;
  const margin = 0.88; // 88% of screen fit

  if (screenAspect > targetAspect) {
    boxH = winH * margin;
    boxW = boxH * targetAspect;
  } else {
    boxW = winW * margin;
    boxH = boxW / targetAspect;
  }

  dom.framingBox.style.width = `${Math.round(boxW)}px`;
  dom.framingBox.style.height = `${Math.round(boxH)}px`;
  dom.matteLabel.textContent = `${state.aspect} · ${state.lens}mm (focal)`;
}

// --- 4. Loading Models & Assets ---
const OVERVIEW = {
  paxos: { cam: [3200, -11800, 8200], target: [-200, 300, 0] },
  arche: { cam: [0, -9500, 6500], target: [0, 0, 0] }
};

function loadIslandModel(island, afterLoad = null) {
  const loader = new GLTFLoader();
  state.island = island;
  dom.islandSelect.value = island;

  dom.loadingOverlay.classList.remove('hidden');
  dom.progressBarFill.style.width = '0%';
  dom.loadingStatus.textContent = `Loading ${island} model...`;
  loadSites(island);

  loader.load(
    `/models/${island}.glb`,
    (gltf) => {
      const model = gltf.scene;
      state.islandModel = model;

      model.traverse((child) => {
        if (child.name === 'sea') {   // the composer draws its own, animated sea
          child.visible = false;
          return;
        }
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      islandGroup.clear();
      islandGroup.add(model);
      state.roofsLifted = false;

      dom.loadingOverlay.classList.add('hidden');
      showToast(`${island[0].toUpperCase()}${island.slice(1)} loaded`);
      if (afterLoad) afterLoad();
      else flyCameraTo(blenderToThree(OVERVIEW[island].cam), blenderToThree(OVERVIEW[island].target), 800);
    },
    (xhr) => {
      if (xhr.total > 0) {
        const pct = Math.round((xhr.loaded / xhr.total) * 100);
        dom.progressBarFill.style.width = `${pct}%`;
        dom.loadingStatus.textContent = `Loading ${island} model (${pct}%)...`;
      }
    },
    (err) => {
      console.error('Error loading island GLB:', err);
      dom.loadingStatus.textContent =
        `No model for ${island}. Run: sh world/composer/export.sh ${island}`;
    }
  );
}

async function loadSites(island) {
  try {
    const res = await fetch(`/api/sites/${island}`);
    const data = await res.json();
    state.sites = data.sites || [];
    state.frames = data.frames || {};
  } catch (err) {
    console.warn('Could not load sites:', err);
    state.sites = [];
    state.frames = {};
  }
  setupSitePins();
  populateTeleportMenu();
}

async function loadPropsCatalog() {
  try {
    const res = await fetch('/api/props');
    const data = await res.json();
    state.propsCatalog = data.props || [];
    // One filter chip per category of the catalog
    [...new Set(state.propsCatalog.map((p) => p.category))].forEach((cat) => {
      const chip = document.createElement('span');
      chip.className = 'prop-filter-chip';
      chip.dataset.category = cat;
      chip.textContent = cat;
      dom.propCategoryFilters.appendChild(chip);
    });
    if (!state.propsCatalog.length) {
      dom.propsCatalogGrid.innerHTML = '<p style="font-size: 0.78rem; color: var(--text-dim); padding: 12px 0;">No props yet. Run: sh world/composer/export.sh</p>';
    }
    state.activePropId = state.activePropId || (state.propsCatalog[0] && state.propsCatalog[0].id);
    renderPropsCatalog();
  } catch (err) {
    console.error('Failed to load props catalog:', err);
  }
}

async function loadCastData() {
  try {
    const res = await fetch('/api/cast');
    state.castData = await res.json();
    renderCastDrawer();
    updateCastSummaryUI();
  } catch (err) {
    console.error('Failed to load cast:', err);
  }
}

async function loadBooksList() {
  try {
    const res = await fetch('/api/books');
    const data = await res.json();
    state.books = data.books || [];

    // Populate save & browser dropdowns
    dom.saveBookSelect.innerHTML = '';
    dom.browserBookSelect.innerHTML = '';

    state.books.forEach((b) => {
      const opt1 = document.createElement('option');
      opt1.value = b.id;
      opt1.textContent = `${b.title} (${b.shots_count} shots)`;
      if (b.id === state.activeBook) opt1.selected = true;
      dom.saveBookSelect.appendChild(opt1);

      const opt2 = document.createElement('option');
      opt2.value = b.id;
      opt2.textContent = `${b.title} (${b.shots_count} shots)`;
      dom.browserBookSelect.appendChild(opt2);
    });
  } catch (err) {
    console.error('Failed to load books:', err);
  }
}

// --- 5. 3D Site Pins & Navigation ---
function setupSitePins() {
  dom.sitePinsLayer.innerHTML = '';
  sitePins = [];

  state.sites.forEach((site) => {
    const el = document.createElement('div');
    el.className = 'site-pin';
    el.textContent = site.name;
    el.dataset.id = site.id;

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      teleportToSite(site);
    });

    dom.sitePinsLayer.appendChild(el);
    sitePins.push({ el, pos: blenderToThree([site.x, site.y, site.z + 6]), site });
  });
}

function updateSitePinsScreenPos() {
  if (!state.showLabels) {
    dom.sitePinsLayer.style.display = 'none';
    return;
  }
  dom.sitePinsLayer.style.display = 'block';

  const halfW = window.innerWidth / 2;
  const halfH = window.innerHeight / 2;
  const tempVec = new THREE.Vector3();

  sitePins.forEach((pin) => {
    tempVec.copy(pin.pos).project(camera);

    // Behind camera check
    if (tempVec.z > 1.0) {
      pin.el.style.display = 'none';
      return;
    }

    const x = tempVec.x * halfW + halfW;
    const y = -tempVec.y * halfH + halfH;

    // Viewport bounds check
    if (x < 10 || x > window.innerWidth - 10 || y < 60 || y > window.innerHeight - 60) {
      pin.el.style.display = 'none';
    } else {
      pin.el.style.display = 'block';
      pin.el.style.left = `${Math.round(x)}px`;
      pin.el.style.top = `${Math.round(y)}px`;
    }
  });
}

function populateTeleportMenu() {
  dom.teleportSelect.innerHTML = '<option value="">Teleport to site...</option>';
  state.sites.forEach((site) => {
    const opt = document.createElement('option');
    opt.value = site.id;
    opt.textContent = site.name;
    dom.teleportSelect.appendChild(opt);
  });
}

function teleportToSite(site) {
  const big = ['chamber', 'tholos', 'stoa', 'festival', 'crown', 'granary'].includes(site.id);
  const dist = big ? 60 : 35;
  // Stand in front of the site when it has a facing (radians from +X), else to its south
  const ang = site.face ?? -Math.PI / 2;
  const at = [site.x, site.y, site.z + 3];
  const from = [site.x + Math.cos(ang) * dist, site.y + Math.sin(ang) * dist, site.z + dist * 0.45];
  flyCameraTo(blenderToThree(from), blenderToThree(at), 1200);
  showToast(`Teleported to ${site.name}`);
}

/** Ground height at a Blender (x, y), from the island model. */
function groundAt(x, y) {
  const ray = new THREE.Raycaster(blenderToThree([x, y, 2000]), new THREE.Vector3(0, -1, 0));
  const hit = ray.intersectObjects(islandGroup.children, true)[0];
  return hit ? hit.point.y : 0;
}

function flyCameraTo(targetCamPos, targetLookAt, duration = 1000) {
  const startCamPos = camera.position.clone();
  const startTarget = controls.target.clone();
  const startTime = performance.now();

  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1.0);
    // Smooth easeInOutCubic
    const ease = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    camera.position.lerpVectors(startCamPos, targetCamPos, ease);
    controls.target.lerpVectors(startTarget, targetLookAt, ease);
    controls.update();

    if (progress < 1.0) {
      requestAnimationFrame(step);
    }
  }
  requestAnimationFrame(step);
}

// --- 6. Prop Placement Engine ---
function renderPropsCatalog(categoryFilter = 'all') {
  dom.propsCatalogGrid.innerHTML = '';

  const filtered = state.propsCatalog.filter(
    (p) => categoryFilter === 'all' || p.category === categoryFilter
  );

  filtered.forEach((p) => {
    const card = document.createElement('div');
    card.className = `prop-card ${state.activePropId === p.id ? 'active' : ''}`;
    card.dataset.id = p.id;
    card.innerHTML = `
      <div class="prop-icon">${esc(p.icon)}</div>
      <div class="prop-name">${esc(p.name)}</div>
      <div class="prop-category">${esc(p.category)}</div>
    `;

    card.addEventListener('click', () => {
      document.querySelectorAll('.prop-card').forEach((c) => c.classList.remove('active'));
      card.classList.add('active');
      state.activePropId = p.id;
      showToast(`Selected prop: ${esc(p.name)}`);
    });

    dom.propsCatalogGrid.appendChild(card);
  });
}

async function loadPropModel(propDef) {
  if (propModelCache.has(propDef.id)) {
    return propModelCache.get(propDef.id).clone();
  }

  const loader = new GLTFLoader();
  return new Promise((resolve, reject) => {
    loader.load(
      propDef.url,
      (gltf) => {
        const root = gltf.scene;
        root.scale.setScalar(propDef.scale || 1.0);
        root.traverse((c) => {
          if (c.isMesh) {
            c.castShadow = true;
            c.receiveShadow = true;
          }
        });
        propModelCache.set(propDef.id, root);
        resolve(root.clone());
      },
      undefined,
      (err) => reject(err)
    );
  });
}

async function placePropAtPosition(hitPoint) {
  const propDef = state.propsCatalog.find((p) => p.id === state.activePropId);
  if (!propDef) return;
  try {
    // A slight random turn, so repeated props do not stand in line
    const entry = await spawnProp(propDef, hitPoint, Math.random() * Math.PI * 2, 1);
    selectPlacedProp(entry);
    renderPlacedPropsList();
    showToast(`Placed ${propDef.name}`);
  } catch (err) {
    console.error('Failed to load and place prop:', err);
    showToast('Failed to load prop model');
  }
}

/** Put a prop of the catalog into the scene: a three.js position, a yaw about up in radians, a scale. */
async function spawnProp(propDef, position, yaw, scale) {
  const mesh = await loadPropModel(propDef);
  mesh.position.copy(position);
  mesh.rotation.y = yaw;
  mesh.scale.multiplyScalar(scale);

  const uniqueId = `prop_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  mesh.userData = { isProp: true, propId: propDef.id, name: propDef.name, uniqueId };
  propsGroup.add(mesh);

  const entry = {
    id: uniqueId, propId: propDef.id, name: propDef.name, icon: propDef.icon, mesh,
    position: mesh.position, rotation: mesh.rotation, scale: mesh.scale
  };
  state.placedProps.push(entry);
  return entry;
}

/** The placed props as a shot records them: catalog id, Blender position, yaw in degrees (from +x), scale. */
function placedPropsForShot() {
  return state.placedProps.map((p) => ({
    prop: p.propId,
    at: shotPoint(p.mesh.position),
    face: parseFloat(((p.mesh.rotation.y * 180) / Math.PI).toFixed(1)),
    scale: parseFloat(p.mesh.scale.x.toFixed(3))
  }));
}

async function restorePlacedProps(items) {
  clearAllProps();
  for (const it of items || []) {
    const def = state.propsCatalog.find((p) => p.id === it.prop);
    if (!def) {
      console.warn(`Saved prop '${it.prop}' is not in the catalog`);
      continue;
    }
    await spawnProp(def, blenderToThree(it.at), (it.face * Math.PI) / 180, it.scale || 1);
  }
  renderPlacedPropsList();
}

function selectPlacedProp(placedEntry) {
  state.selectedPlacedProp = placedEntry;
  if (placedEntry && placedEntry.mesh) {
    transformControls.attach(placedEntry.mesh);
  } else {
    transformControls.detach();
  }
  renderPlacedPropsList();
}

function renderPlacedPropsList() {
  dom.placedPropsCount.textContent = state.placedProps.length;
  dom.placedPropsList.innerHTML = '';

  if (state.placedProps.length === 0) {
    dom.placedPropsList.innerHTML =
      '<p style="font-size: 0.78rem; color: var(--text-dim); text-align: center; padding: 12px 0;">No props placed yet. Select a prop and click anywhere on the island!</p>';
    return;
  }

  state.placedProps.forEach((p, idx) => {
    const item = document.createElement('div');
    item.className = `placed-prop-item ${state.selectedPlacedProp && state.selectedPlacedProp.id === p.id ? 'selected' : ''}`;
    item.innerHTML = `
      <span>${esc(p.icon)} ${esc(p.name)} #${idx + 1}</span>
      <div style="display: flex; gap: 4px;">
        <button class="btn btn-chip" data-action="focus" title="Focus camera on prop">🔍</button>
        <button class="btn btn-chip" data-action="delete" title="Delete prop" style="color: var(--accent-red);">✕</button>
      </div>
    `;

    item.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (btn) {
        const action = btn.dataset.action;
        if (action === 'focus') {
          flyCameraTo(
            p.mesh.position.clone().add(new THREE.Vector3(12, 10, 14)),
            p.mesh.position.clone(),
            800
          );
        } else if (action === 'delete') {
          deleteProp(p);
        }
        return;
      }
      selectPlacedProp(p);
    });

    dom.placedPropsList.appendChild(item);
  });
}

function deleteProp(p) {
  if (state.selectedPlacedProp && state.selectedPlacedProp.id === p.id) {
    transformControls.detach();
    state.selectedPlacedProp = null;
  }
  propsGroup.remove(p.mesh);
  state.placedProps = state.placedProps.filter((item) => item.id !== p.id);
  renderPlacedPropsList();
  showToast(`Deleted ${esc(p.name)}`);
}

function clearAllProps() {
  if (state.placedProps.length === 0) return;
  transformControls.detach();
  state.selectedPlacedProp = null;
  propsGroup.clear();
  state.placedProps = [];
  renderPlacedPropsList();
  showToast('All placed props removed');
}

// --- 7. Screen View Capture Widget (Without UI Elements) ---
function captureCurrentScreenView(supersample = 1) {
  // 1. Temporarily detach all visual helpers in the 3D scene
  transformControls.detach();
  dom.sitePinsLayer.style.display = 'none';

  // 2. Render clean 3D scene
  renderer.render(scene, camera);

  // 3. Compute crop bounding box based on active aspect ratio
  const parts = state.aspect.split(':');
  const targetAspect = parseFloat(parts[0]) / parseFloat(parts[1]);

  const canvasW = renderer.domElement.width;
  const canvasH = renderer.domElement.height;
  const screenAspect = canvasW / canvasH;

  let cropW, cropH;
  if (screenAspect > targetAspect) {
    cropH = canvasH;
    cropW = cropH * targetAspect;
  } else {
    cropW = canvasW;
    cropH = cropW / targetAspect;
  }

  const cropX = (canvasW - cropW) / 2;
  const cropY = (canvasH - cropH) / 2;

  // 4. Draw to offscreen canvas
  const offscreen = document.createElement('canvas');
  offscreen.width = Math.round(cropW);
  offscreen.height = Math.round(cropH);
  const ctx = offscreen.getContext('2d');

  ctx.drawImage(
    renderer.domElement,
    cropX, cropY, cropW, cropH,
    0, 0, offscreen.width, offscreen.height
  );

  const dataURL = offscreen.toDataURL('image/png', 0.95);

  // 5. Restore 3D visual helpers
  if (state.selectedPlacedProp && state.selectedPlacedProp.mesh) {
    transformControls.attach(state.selectedPlacedProp.mesh);
  }
  if (state.showLabels) {
    dom.sitePinsLayer.style.display = 'block';
  }

  // 6. Update state & UI
  state.capturedImageURL = dataURL;
  dom.capturePreviewImg.src = dataURL;
  dom.previsMetaBadge.textContent = `${offscreen.width}×${offscreen.height} · ${state.aspect}`;

  // Automatically save previs capture to backend
  saveCaptureToBackend(dataURL);

  return dataURL;
}

async function saveCaptureToBackend(dataURL) {
  try {
    const res = await fetch('/api/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_data: dataURL,
        shot_id: state.shotId || 'capture',
        metadata: {
          island: state.island,
          cam: shotPoint(camera.position),
          target: shotPoint(controls.target),
          lens: state.lens,
          aspect: state.aspect,
          cast: state.selectedCast
        }
      })
    });
    const data = await res.json();
    if (data.status === 'success') {
      state.captureFilename = data.filename;
    }
  } catch (err) {
    console.warn('Backend capture save failed:', err);
  }
}

async function copyCapturedImageToClipboard() {
  if (!state.capturedImageURL) return;
  try {
    const res = await fetch(state.capturedImageURL);
    const blob = await res.blob();
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ]);
    showToast('Image copied to clipboard!');
  } catch (err) {
    console.error('Clipboard copy failed:', err);
    showToast('Could not copy image. Downloading PNG instead.');
    downloadCapturedImage();
  }
}

function downloadCapturedImage() {
  if (!state.capturedImageURL) return;
  const link = document.createElement('a');
  link.href = state.capturedImageURL;
  link.download = `daag_${state.shotId || 'previs'}_${state.lens}mm.png`;
  link.click();
  showToast('Downloaded previs image');
}

// --- 8. Character Reference Cast Picker ---
function renderCastDrawer(filterSheet = 'all', searchQuery = '') {
  dom.castSheetTabs.innerHTML = '';
  dom.castCatalogGrid.innerHTML = '';

  const chars = state.castData.characters || [];
  const sheets = state.castData.sheets || {};

  // Build sheet tabs
  const allTab = document.createElement('span');
  allTab.className = `prop-filter-chip ${filterSheet === 'all' ? 'active' : ''}`;
  allTab.textContent = `All (${chars.length})`;
  allTab.addEventListener('click', () => renderCastDrawer('all', searchQuery));
  dom.castSheetTabs.appendChild(allTab);

  Object.entries(sheets).forEach(([sheetKey, sheetLabel]) => {
    const chip = document.createElement('span');
    chip.className = `prop-filter-chip ${filterSheet === sheetKey ? 'active' : ''}`;
    chip.textContent = sheetLabel.split(':')[0];
    chip.addEventListener('click', () => renderCastDrawer(sheetKey, searchQuery));
    dom.castSheetTabs.appendChild(chip);
  });

  // Filter characters
  const q = searchQuery.toLowerCase().trim();
  const filtered = chars.filter((c) => {
    const matchSheet = filterSheet === 'all' || (c.sheets && c.sheets.includes(filterSheet));
    const matchQuery = !q || c.id.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
    return matchSheet && matchQuery;
  });

  filtered.forEach((c) => {
    const isSelected = state.selectedCast.includes(c.id);
    const card = document.createElement('div');
    card.className = `cast-card ${isSelected ? 'selected' : ''}`;
    card.dataset.id = c.id;

    card.innerHTML = `
      <div class="cast-img-box">
        <img src="${esc(c.image_url || '/cast/images/legislator-man.png')}" alt="${esc(c.name)}">
      </div>
      <div class="cast-card-name">${esc(c.name)}</div>
      <div class="cast-card-kind">${esc(c.kind)}</div>
    `;

    card.addEventListener('click', () => {
      toggleCastSelection(c.id);
      card.classList.toggle('selected', state.selectedCast.includes(c.id));
    });

    dom.castCatalogGrid.appendChild(card);
  });
}

function toggleCastSelection(charId) {
  const idx = state.selectedCast.indexOf(charId);
  if (idx >= 0) {
    state.selectedCast.splice(idx, 1);
  } else {
    state.selectedCast.push(charId);
  }
  updateCastSummaryUI();
  updatePrompt();
}

function updateCastSummaryUI() {
  const count = state.selectedCast.length;
  dom.castBadgeCount.textContent = count;

  if (count === 0) {
    dom.hudCastNames.textContent = 'None selected';
    dom.modalCastStrip.innerHTML = '<span style="font-size: 0.8rem; color: var(--text-dim); padding: 8px 0;">No cast selected. Click "+ Pick Characters" to add cast reference portraits.</span>';
    return;
  }

  const names = state.selectedCast.map((id) => id.replace(/-/g, ' '));
  dom.hudCastNames.textContent = names.slice(0, 3).join(', ') + (names.length > 3 ? ` +${names.length - 3}` : '');

  // Render horizontal strip in Capture Modal
  dom.modalCastStrip.innerHTML = '';
  state.selectedCast.forEach((cid, index) => {
    const char = (state.castData.characters || []).find((c) => c.id === cid) || {
      id: cid,
      name: cid.replace(/-/g, ' '),
      image_url: `/cast/images/${cid}.png`
    };

    const item = document.createElement('div');
    item.className = 'cast-thumb-item';
    item.innerHTML = `
      <div class="cast-thumb-badge">Image ${index + 2}</div>
      <img src="${char.image_url || `/cast/images/${cid}.png`}" alt="${esc(char.name)}">
      <div class="cast-thumb-name">${esc(char.name)}</div>
      <div style="display: flex; gap: 2px; margin-top: 2px;">
        <button class="btn btn-chip" data-action="copy" title="Copy reference image" style="padding: 2px 4px; font-size: 0.65rem;">📋</button>
        <button class="btn btn-chip" data-action="remove" title="Remove from shot" style="padding: 2px 4px; font-size: 0.65rem; color: var(--accent-red);">✕</button>
      </div>
    `;

    item.querySelector('[data-action="copy"]').addEventListener('click', async (e) => {
      e.stopPropagation();
      await copyImageUrlToClipboard(char.image_url);
    });

    item.querySelector('[data-action="remove"]').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleCastSelection(cid);
    });

    dom.modalCastStrip.appendChild(item);
  });
}

async function copyImageUrlToClipboard(imgUrl) {
  try {
    const res = await fetch(imgUrl);
    const blob = await res.blob();
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ]);
    showToast('Character reference copied to clipboard!');
  } catch (err) {
    console.error('Failed to copy character image:', err);
    showToast('Failed to copy reference image');
  }
}

// --- 9. AI Prompt Generator ---
function updatePrompt() {
  const prompt = buildPrompt({
    style: state.promptStyle,
    action: state.promptAction,
    others: state.promptOthers,
    cast: state.selectedCast
  });
  dom.promptOutputText.textContent = prompt;
  return prompt;
}

// --- 10. Book Shots Storage (shots.json) ---
/** The shot on screen as shots.json holds it: camera in Blender coordinates, or in the building's frame
 *  when the shot being edited has a site. */
function composedShot(shotId) {
  const frame = state.shotSite && state.shotId === shotId ? state.frames[state.shotSite] : null;
  const inShotSpace = (v) => frame ? worldToFrame(threeToBlender(v), frame).map((n) => parseFloat(n.toFixed(2))) : shotPoint(v);
  return {
    island: state.island,
    cam: inShotSpace(camera.position),
    target: inShotSpace(controls.target),
    lens: state.lens,
    aspect: state.aspect,
    cast: [...state.selectedCast],
    prompt: state.promptAction.trim(),
    light: state.timeOfDay,
    sun_from: Math.round(state.sunAzimuth),
    others: state.promptOthers.trim() || null,
    placed_props: state.placedProps.length ? placedPropsForShot() : null,
    ...(frame ? { site: state.shotSite } : {})
  };
}

async function saveShotToBook() {
  const bookId = dom.saveBookSelect.value;
  const shotId = dom.saveShotId.value.trim() || state.shotId || 'shot';

  if (!bookId) {
    showToast('Please select a book');
    return;
  }

  const shotData = composedShot(shotId);
  const variant = dom.saveVariant.value.trim() || null;

  try {
    const res = await fetch(`/api/books/${bookId}/shots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shot_id: shotId,
        variant,
        shot: shotData
      })
    });
    const result = await res.json();
    if (result.status === 'success') {
      showToast(`${result.created ? 'Created' : 'Updated'} '${shotId}${variant ? '/' + variant : ''}' in ${bookId}/shots.json`);
      loadBooksList(); // Refresh counts
    } else {
      showToast(`Save failed: ${result.error}`);
    }
  } catch (err) {
    console.error('Failed to save shot:', err);
    showToast('Error saving shot to backend');
  }
}

// --- Full-detail renders ---
async function startRender() {
  const shotId = dom.saveShotId.value.trim() || state.shotId || 'shot';
  const shot = composedShot(shotId);
  dom.btnRender.disabled = true;
  dom.renderStatus.textContent = 'queued';
  try {
    const res = await fetch('/api/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ island: state.island, shot, quality: dom.renderQuality.value, size: dom.renderSize.value })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || res.statusText);
    state.renderJob = data.job;
    pollRender(data.job, performance.now());
  } catch (err) {
    dom.renderStatus.textContent = `failed: ${err.message}`;
    dom.btnRender.disabled = false;
  }
}

async function pollRender(job, t0) {
  try {
    const data = await (await fetch(`/api/render/${job}`)).json();
    const secs = Math.round((performance.now() - t0) / 1000);
    if (data.status === 'done') {
      state.renderURL = data.url;
      dom.renderStatus.textContent = `done in ${data.seconds}s`;
      dom.renderImg.src = data.url;
      dom.btnRenderOpen.href = data.url;
      dom.btnRenderDownload.href = data.url;
      dom.btnRenderDownload.download = `${state.shotId || 'shot'}-${job}.png`;
      dom.renderResult.style.display = 'block';
      dom.btnRender.disabled = false;
      return;
    }
    if (data.status === 'error') {
      dom.renderStatus.textContent = 'failed';
      dom.btnRender.disabled = false;
      console.error('Render failed:', data.error);
      showToast(`Render failed: ${String(data.error).slice(-160)}`);
      return;
    }
    dom.renderStatus.textContent = `${data.status}… ${secs}s`;
    setTimeout(() => pollRender(job, t0), 2500);
  } catch (err) {
    dom.renderStatus.textContent = 'lost contact with server';
    dom.btnRender.disabled = false;
  }
}

async function useRenderAsPrevis() {
  if (!state.renderURL) return;
  state.capturedImageURL = state.renderURL;
  state.captureFilename = `render:${state.renderURL.split('/').pop()}`;
  dom.capturePreviewImg.src = state.renderURL;
  dom.previsMetaBadge.textContent = `Blender render · ${state.aspect}`;
  showToast('The render is now Image 1');
}

// --- Shots browser ---
async function loadBookShotsBrowser(bookId) {
  try {
    const res = await fetch(`/api/books/${bookId}/shots`);
    const data = await res.json();
    state.shotsData = { book: bookId, shots: data.shots || {}, images: data.images || {} };
    renderShotsBrowser();
  } catch (err) {
    console.error('Failed to load shots for browser:', err);
  }
}

const PICTURE_LABELS = { previs: 'previs', scene: 'scene', ligne: 'ligne claire' };

function renderShotsBrowser() {
  const { shots, images } = state.shotsData || { shots: {}, images: {} };
  dom.shotsBrowserList.innerHTML = '';

  // A shot with variants is listed once per variant, its keys laid over the shot's own.
  let entries = Object.entries(shots).flatMap(([sid, s]) => {
    const { variants, ...base } = s;
    return variants && Object.keys(variants).length
      ? Object.entries(variants).map(([v, over]) => [`${sid}/${v}`, { ...base, ...over }])
      : [[sid, s]];
  });

  const q = dom.browserSearch.value.trim().toLowerCase();
  if (q) {
    entries = entries.filter(([sid, s]) =>
      [sid, s.prompt, s.others, (s.cast || []).join(' '), s.site, s.base, s.island].join(' ').toLowerCase().includes(q));
  }
  if (dom.browserOnlyPictures.checked) entries = entries.filter(([sid]) => images[sid]);

  if (entries.length === 0) {
    dom.shotsBrowserList.innerHTML = '<p style="color: var(--text-dim); text-align: center;">No shots match.</p>';
    return;
  }

  entries.forEach(([sid, s]) => {
    const pics = images[sid] || {};
    const thumbs = Object.entries(PICTURE_LABELS).filter(([k]) => pics[k]).map(([k, label]) => `
      <a href="${esc(pics[k])}" target="_blank" rel="noopener" class="shot-thumb" title="${esc(label)}" style="flex: 1; min-width: 0; text-decoration: none; color: var(--text-dim); font-size: 0.7rem; text-align: center;">
        <img loading="lazy" src="${esc(pics[k])}?w=360" alt="${esc(label)}" style="width: 100%; aspect-ratio: ${esc((s.aspect || '3:4').replace(':', ' / '))}; object-fit: cover; border-radius: 6px; display: block;">
        ${esc(label)}
      </a>`).join('');
    const card = document.createElement('div');
    card.className = 'control-section';
    card.style.cursor = 'pointer';
    card.innerHTML = `
      <div class="section-title">
        <span>${esc(sid)}</span>
        <span class="control-val">${esc(s.lens || '')}${s.lens ? 'mm · ' : ''}${esc(s.aspect || '')}</span>
      </div>
      ${thumbs ? `<div style="display: flex; gap: 6px; margin-bottom: 8px;">${thumbs}</div>` : '<div style="font-size: 0.72rem; color: var(--text-dim); margin-bottom: 6px;">no pictures yet</div>'}
      <div style="font-size: 0.82rem; color: var(--text-muted); line-height: 1.4;">
        <strong>Island:</strong> ${esc(s.island || '')} · <strong>Light:</strong> ${esc(s.light || 'from base')}${s.site ? ` · <strong>Site:</strong> ${esc(s.site)}` : ''}<br>
        <strong>Cast:</strong> ${esc((s.cast || []).join(', ') || 'none')}<br>
        <p style="margin-top: 4px; color: var(--text-main); font-style: italic;">"${esc((s.prompt || '').substring(0, 160))}${(s.prompt || '').length > 160 ? '…' : ''}"</p>
      </div>
      <button class="btn btn-primary btn-chip" style="margin-top: 6px;">🎯 Jump to this Shot</button>
    `;

    card.addEventListener('click', (e) => {
      if (e.target.closest('a')) return;            // a picture opens full size instead
      applyBookShot(sid, s);
      dom.shotsBrowserModal.style.display = 'none';
      showToast(`Loaded shot: ${sid}`);
    });

    dom.shotsBrowserList.appendChild(card);
  });
}

function applyBookShot(shotId, shot) {
  const [baseId, variantId = ''] = shotId.split('/');
  state.shotId = baseId;
  dom.saveShotId.value = baseId;
  dom.saveVariant.value = variantId;

  state.shotSite = shot.site || null;
  const flyToShot = () => {
    const frame = state.shotSite && state.frames[state.shotSite];
    if (state.shotSite && !frame) showToast(`No frame for site '${state.shotSite}'; camera not moved`);
    else flyCameraTo(
      blenderToThree(shotToWorld(shot.cam, frame, groundAt)),
      blenderToThree(shotToWorld(shot.target, frame, groundAt)), 1200);
  };
  if (shot.cam && shot.target) {
    if (shot.island && shot.island !== state.island) loadIslandModel(shot.island, flyToShot);
    else flyToShot();
  } else if (shot.base) {
    showToast(`'${shotId}' takes its camera from the world shot '${shot.base}'`);
  }

  if (shot.lens) applyFocalLength(shot.lens);
  if (shot.aspect) {
    state.aspect = shot.aspect;
    document.querySelectorAll('[data-aspect]').forEach((b) => {
      b.classList.toggle('active', b.dataset.aspect === shot.aspect);
    });
    updateFramingMatte();
  }

  if (shot.light) {
    state.timeOfDay = shot.light;
    document.querySelectorAll('[data-tod]').forEach((b) => {
      b.classList.toggle('active', b.dataset.tod === shot.light);
    });
  }

  if (shot.sun_from !== undefined) {
    state.sunAzimuth = shot.sun_from;
    dom.sunAzimuthSlider.value = shot.sun_from;
    dom.sunAzimuthVal.textContent = `${shot.sun_from}°`;
  }
  updateSunPosition();

  if (shot.cast) {
    state.selectedCast = [...shot.cast];
    updateCastSummaryUI();
  }

  if (shot.prompt) {
    state.promptAction = shot.prompt;
    dom.promptActionInput.value = shot.prompt;
  }

  if (shot.others) {
    state.promptOthers = shot.others;
    dom.promptOthersInput.value = shot.others;
  }

  restorePlacedProps(shot.placed_props);
  updatePrompt();
}

// --- 11. Event Listeners ---
function setupEventListeners() {
  window.addEventListener('resize', onWindowResize);

  // Keyboard navigation & Shortcuts
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  // Mouse Raycasting & Prop Placement
  renderer.domElement.addEventListener('pointerdown', onPointerDown);

  // Left Dock Tabs
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-content').forEach((tc) => (tc.style.display = 'none'));
      const activeEl = document.getElementById(`tab-${tab}`);
      if (activeEl) activeEl.style.display = 'flex';
    });
  });

  // Dock Collapse/Expand
  dom.btnDockCollapse.addEventListener('click', () => {
    dom.leftDock.classList.add('collapsed');
    dom.btnDockExpand.style.display = 'block';
  });
  dom.btnDockExpand.addEventListener('click', () => {
    dom.leftDock.classList.remove('collapsed');
    dom.btnDockExpand.style.display = 'none';
  });

  // Camera Sliders & Presets
  dom.focalSlider.addEventListener('input', (e) => {
    applyFocalLength(parseInt(e.target.value));
  });

  document.querySelectorAll('[data-lens]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-lens]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      applyFocalLength(parseInt(btn.dataset.lens));
    });
  });

  document.querySelectorAll('[data-aspect]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-aspect]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.aspect = btn.dataset.aspect;
      updateFramingMatte();
      dom.hudCamSummary.textContent = `Cam: ${state.lens}mm · ${state.aspect}`;
    });
  });

  // Ground snap (+1.7m human eye level)
  document.getElementById('btn-snap-eye').addEventListener('click', () => {
    snapCameraToEyeLevel();
  });

  // Sun & Environment Sliders
  dom.sunAzimuthSlider.addEventListener('input', (e) => {
    state.sunAzimuth = parseInt(e.target.value);
    dom.sunAzimuthVal.textContent = `${state.sunAzimuth}°`;
    updateSunPosition();
  });

  dom.sunElevationSlider.addEventListener('input', (e) => {
    state.sunElevation = parseInt(e.target.value);
    dom.sunElevationVal.textContent = `${state.sunElevation}°`;
    updateSunPosition();
  });

  dom.sunIntensitySlider.addEventListener('input', (e) => {
    state.sunIntensity = parseFloat(e.target.value);
    dom.sunIntensityVal.textContent = state.sunIntensity.toFixed(1);
    updateSunPosition();
  });

  dom.fogDensitySlider.addEventListener('input', (e) => {
    state.fogDensity = parseInt(e.target.value);
    dom.fogDensityVal.textContent = `${state.fogDensity}%`;
    applyTimeOfDayAtmosphere();
  });

  dom.seaWavesToggle.addEventListener('change', (e) => {
    state.seaWaves = e.target.checked;
  });

  document.querySelectorAll('[data-tod]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-tod]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.timeOfDay = btn.dataset.tod;
      if (btn.dataset.tod === 'golden') {
        state.sunAzimuth = 250;
        state.sunElevation = 24;
      } else if (btn.dataset.tod === 'morning') {
        state.sunAzimuth = 100;
        state.sunElevation = 32;
      } else if (btn.dataset.tod === 'noon') {
        state.sunAzimuth = 180;
        state.sunElevation = 70;
      } else if (btn.dataset.tod === 'late') {
        state.sunAzimuth = 245;
        state.sunElevation = 18;
      } else if (btn.dataset.tod === 'overcast') {
        state.sunElevation = 50;
      }
      dom.sunAzimuthSlider.value = state.sunAzimuth;
      dom.sunAzimuthVal.textContent = `${state.sunAzimuth}°`;
      dom.sunElevationSlider.value = state.sunElevation;
      dom.sunElevationVal.textContent = `${state.sunElevation}°`;
      updateSunPosition();
    });
  });

  // View Presets
  document.getElementById('btn-view-both').addEventListener('click', () => {
    flyCameraTo(new THREE.Vector3(120, 260, 520), new THREE.Vector3(0, 15, 0), 1000);
  });
  ['arche', 'paxos'].forEach((island) => {
    document.getElementById(`btn-view-${island}`).addEventListener('click', () => {
      if (state.island !== island) return loadIslandModel(island);
      flyCameraTo(blenderToThree(OVERVIEW[island].cam), blenderToThree(OVERVIEW[island].target), 1000);
    });
  });

  // Teleport Select
  dom.teleportSelect.addEventListener('change', (e) => {
    const site = state.sites.find((s) => s.id === e.target.value);
    if (site) teleportToSite(site);
    e.target.value = '';
  });

  dom.islandSelect.addEventListener('change', (e) => loadIslandModel(e.target.value));

  // Roof Cutaway
  document.getElementById('btn-roof-cutaway').addEventListener('click', (e) => {
    state.roofsLifted = !state.roofsLifted;
    e.target.classList.toggle('active', state.roofsLifted);
    toggleRoofCutaway(state.roofsLifted);
  });

  // Labels Toggle
  document.getElementById('btn-toggle-labels').addEventListener('click', (e) => {
    state.showLabels = !state.showLabels;
    e.target.classList.toggle('active', state.showLabels);
    updateSitePinsScreenPos();
  });

  // Grid Toggle
  document.getElementById('btn-toggle-grid').addEventListener('click', (e) => {
    state.showGrid = !state.showGrid;
    e.target.classList.toggle('active', state.showGrid);
    dom.framingBox.classList.toggle('guide-grid', state.showGrid);
  });

  // Prop Placement Mode
  dom.btnPlacePropMode.addEventListener('click', () => {
    state.placePropMode = !state.placePropMode;
    dom.btnPlacePropMode.classList.toggle('active', state.placePropMode);
    dom.btnPlacePropMode.textContent = state.placePropMode
      ? '🎯 Active: Click Island Surface'
      : '🎯 Click Island to Place Prop';
    dom.hudStatusDot.classList.toggle('placing', state.placePropMode);
    dom.hudStatusText.textContent = state.placePropMode ? 'Prop Placement Active' : 'Aegean View Active';
  });

  document.getElementById('gizmo-mode-translate').addEventListener('click', (e) => {
    setGizmoMode('translate', e.target);
  });
  document.getElementById('gizmo-mode-rotate').addEventListener('click', (e) => {
    setGizmoMode('rotate', e.target);
  });
  document.getElementById('gizmo-mode-scale').addEventListener('click', (e) => {
    setGizmoMode('scale', e.target);
  });

  dom.btnClearProps.addEventListener('click', clearAllProps);

  // Prop Category Filter Chips
  dom.propCategoryFilters.addEventListener('click', (e) => {
    const chip = e.target.closest('.prop-filter-chip');
    if (!chip) return;
    dom.propCategoryFilters.querySelectorAll('.prop-filter-chip').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    renderPropsCatalog(chip.dataset.category);
  });

  // Capture & Compose Modal Controls
  document.getElementById('btn-capture-modal').addEventListener('click', () => {
    captureCurrentScreenView();
    dom.captureModal.classList.remove('hidden');
  });

  document.getElementById('btn-quick-capture').addEventListener('click', () => {
    captureCurrentScreenView();
    dom.captureModal.classList.remove('hidden');
  });

  document.getElementById('btn-close-capture-modal').addEventListener('click', () => {
    dom.captureModal.classList.add('hidden');
  });

  dom.btnCopyImage.addEventListener('click', copyCapturedImageToClipboard);
  dom.btnDownloadImage.addEventListener('click', downloadCapturedImage);
  dom.btnRecapture.addEventListener('click', () => {
    captureCurrentScreenView();
    showToast('Recaptured view');
  });

  // Prompt Style Buttons
  document.querySelectorAll('.style-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.style-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.promptStyle = btn.dataset.style;
      updatePrompt();
    });
  });

  dom.promptActionInput.addEventListener('input', (e) => {
    state.promptAction = e.target.value;
    updatePrompt();
  });

  dom.promptOthersInput.addEventListener('input', (e) => {
    state.promptOthers = e.target.value;
    updatePrompt();
  });

  dom.btnCopyPrompt.addEventListener('click', async () => {
    const prompt = updatePrompt();
    await navigator.clipboard.writeText(prompt);
    showToast('Prompt copied to clipboard!');
  });

  dom.btnExportBundle.addEventListener('click', () => {
    const prompt = updatePrompt();
    const query = new URLSearchParams({
      shot: state.shotId || 'composition',
      capture: state.captureFilename || '',
      prompt
    });
    state.selectedCast.forEach((cid) => query.append('cast', cid));
    window.location.href = `/api/bundle?${query.toString()}`;
  });

  dom.btnSaveShotBook.addEventListener('click', saveShotToBook);
  dom.btnRender.addEventListener('click', startRender);
  dom.btnRenderUse.addEventListener('click', useRenderAsPrevis);
  dom.browserSearch.addEventListener('input', renderShotsBrowser);
  dom.browserOnlyPictures.addEventListener('change', renderShotsBrowser);

  // Cast Drawer Controls
  document.getElementById('btn-open-cast').addEventListener('click', () => {
    dom.castDrawer.classList.add('open');
  });
  dom.btnModalAddCast.addEventListener('click', () => {
    dom.castDrawer.classList.add('open');
  });
  document.getElementById('hud-cast-pill').addEventListener('click', () => {
    dom.castDrawer.classList.add('open');
  });
  document.getElementById('btn-close-cast-drawer').addEventListener('click', () => {
    dom.castDrawer.classList.remove('open');
  });
  document.getElementById('btn-clear-cast-selection').addEventListener('click', () => {
    state.selectedCast = [];
    renderCastDrawer();
    updateCastSummaryUI();
    updatePrompt();
  });

  dom.castSearchInput.addEventListener('input', (e) => {
    renderCastDrawer('all', e.target.value);
  });

  // Book Shots Browser Controls
  document.getElementById('btn-open-shots-browser').addEventListener('click', () => {
    dom.shotsBrowserModal.style.display = 'flex';
    loadBookShotsBrowser(dom.browserBookSelect.value || state.activeBook);
  });
  document.getElementById('btn-close-shots-browser').addEventListener('click', () => {
    dom.shotsBrowserModal.style.display = 'none';
  });
  dom.browserBookSelect.addEventListener('change', (e) => {
    loadBookShotsBrowser(e.target.value);
  });
}

function setGizmoMode(mode, targetBtn) {
  state.gizmoMode = mode;
  transformControls.setMode(mode);
  ['translate', 'rotate', 'scale'].forEach((m) => {
    const btn = document.getElementById(`gizmo-mode-${m}`);
    if (btn) btn.classList.remove('active');
  });
  if (targetBtn) targetBtn.classList.add('active');
}

// The roofs are instanced tile, ridge and antefix meshes; lifting them shows the rooms below
const ROOF_PARTS = /roof|^inst_(pan|cover|antefix|ridge|slab)/i;

function toggleRoofCutaway(lift) {
  if (!state.islandModel) return;
  state.islandModel.traverse((child) => {
    if (child.isMesh && ROOF_PARTS.test(child.name)) {
      child.position.y = lift ? 9.0 : 0.0;
    }
  });
  showToast(lift ? 'Roofs lifted by 9m to inspect interiors' : 'Roofs restored to normal');
}

function snapCameraToEyeLevel() {
  raycaster.set(camera.position, new THREE.Vector3(0, -1, 0));
  const intersects = raycaster.intersectObjects(islandGroup.children, true);
  if (intersects.length > 0) {
    const groundY = intersects[0].point.y;
    camera.position.y = groundY + 1.7; // 1.7m eye level
    controls.update();
    showToast('Camera snapped to 1.7m eye level');
  }
}

// --- 12. Pointer Raycasting for Prop Placement ---
function onPointerDown(event) {
  // Ignore clicks on UI elements
  if (event.target !== renderer.domElement) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  // If in Prop Placement Mode: place active prop
  if (state.placePropMode) {
    const intersects = raycaster.intersectObjects(islandGroup.children, true);
    if (intersects.length > 0) {
      const hit = intersects[0];
      placePropAtPosition(hit.point, hit.face ? hit.face.normal : new THREE.Vector3(0, 1, 0));
      return;
    }
  }

  // Otherwise: test selection of placed props
  const propIntersects = raycaster.intersectObjects(propsGroup.children, true);
  if (propIntersects.length > 0) {
    let obj = propIntersects[0].object;
    while (obj && obj.parent !== propsGroup) {
      obj = obj.parent;
    }
    if (obj) {
      const placed = state.placedProps.find((p) => p.mesh === obj);
      if (placed) {
        selectPlacedProp(placed);
        return;
      }
    }
  }

  // Clicked empty space: deselect prop
  if (!state.placePropMode && state.selectedPlacedProp) {
    selectPlacedProp(null);
  }
}

// --- 13. Keyboard Fly Navigation & Shortcuts ---
function onKeyDown(e) {
  keyState[e.code] = true;

  // Spacebar: quick capture
  if (e.code === 'Space' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
    e.preventDefault();
    captureCurrentScreenView();
    dom.captureModal.classList.remove('hidden');
    return;
  }

  // Delete / Backspace: delete selected prop
  if ((e.code === 'Delete' || e.code === 'Backspace') && state.selectedPlacedProp && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
    deleteProp(state.selectedPlacedProp);
    return;
  }

  // Shortcuts: G = move, R = rotate, S = scale
  if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
    if (e.code === 'KeyG') setGizmoMode('translate', document.getElementById('gizmo-mode-translate'));
    if (e.code === 'KeyR') setGizmoMode('rotate', document.getElementById('gizmo-mode-rotate'));
    if (e.code === 'KeyS') setGizmoMode('scale', document.getElementById('gizmo-mode-scale'));
  }
}

function onKeyUp(e) {
  keyState[e.code] = false;
}

function updateFlyControls(delta) {
  // Active fly controls via WASDQE
  if (!keyState['KeyW'] && !keyState['KeyS'] && !keyState['KeyA'] && !keyState['KeyD'] && !keyState['KeyQ'] && !keyState['KeyE']) {
    return;
  }

  const pace = Math.max(20, camera.position.y * 0.4);   // faster the higher the camera is
  const speed = (keyState['ShiftLeft'] || keyState['ShiftRight'] ? 3 : 1) * pace * delta;

  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);

  const right = new THREE.Vector3();
  right.crossVectors(forward, camera.up).normalize();

  const moveDelta = new THREE.Vector3();

  if (keyState['KeyW']) moveDelta.addScaledVector(forward, speed);
  if (keyState['KeyS']) moveDelta.addScaledVector(forward, -speed);
  if (keyState['KeyD']) moveDelta.addScaledVector(right, speed);
  if (keyState['KeyA']) moveDelta.addScaledVector(right, -speed);
  if (keyState['KeyE']) moveDelta.y += speed;
  if (keyState['KeyQ']) moveDelta.y -= speed;

  camera.position.add(moveDelta);
  controls.target.add(moveDelta);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  updateFramingMatte();
}

function updateCoordsDisplay() {
  // Blender coordinates, the ones shots.json holds
  const [cx, cy, cz] = threeToBlender(camera.position);
  const [tx, ty, tz] = threeToBlender(controls.target);
  dom.camX.textContent = cx.toFixed(1);
  dom.camY.textContent = cy.toFixed(1);
  dom.camZ.textContent = cz.toFixed(1);
  dom.tarX.textContent = tx.toFixed(1);
  dom.tarY.textContent = ty.toFixed(1);
  dom.tarZ.textContent = tz.toFixed(1);
}

function showToast(msg) {
  dom.toast.textContent = msg;
  dom.toast.classList.add('show');
  clearTimeout(dom.toast._timer);
  dom.toast._timer = setTimeout(() => {
    dom.toast.classList.remove('show');
  }, 2600);
}

// --- 14. Main Animation Loop ---
let lastTime = performance.now();

function animate() {
  requestAnimationFrame(animate);

  const now = performance.now();
  const delta = (now - lastTime) / 1000;
  lastTime = now;

  // Fly Keyboard Navigation
  updateFlyControls(delta);

  // Orbit controls update
  controls.update();
  aimSun();
  skyDome.position.copy(camera.position);

  // Sea Wave Shader Animation
  if (state.seaWaves && seaMesh && seaMesh.material.uniforms) {
    seaMesh.material.uniforms.uTime.value += delta * 1.2;
  }

  // Update real-time HUD coords & 3D site labels
  updateCoordsDisplay();
  updateSitePinsScreenPos();

  // Render Scene
  renderer.render(scene, camera);
}

// Start application
init();
