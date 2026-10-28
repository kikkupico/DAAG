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

const COMPASS_POINTS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
function compassHeading(deg) {
  const norm = ((deg % 360) + 360) % 360;
  const idx = Math.round(norm / 22.5) % 16;
  return COMPASS_POINTS[idx];
}

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
  sunIntensity: 1.5,    // the viewport's own scale: 1.5 is the light preset as it is
  lightPresets: {},     // render.py's light presets, from /api/lights
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
  selectedCast: [],

  // Capture & Prompt Studio
  capturedImageURL: null,
  captureFilename: null,
  renderJob: null,       // the Blender render in progress, if any
  draftId: null,         // the id of the shot being composed (null until it is first saved: a capture, a render, a FLUX picture)
  drafts: {},            // the shots saved so far, by id
  draftSummary: {},      // each one's newest pictures
  renderURL: null,       // its picture when done
  renderView: null,      // the camera the render was made from, to tell when the view has moved since
  lastCaptureFile: null, // the viewport capture on disk (captureFilename may name a render instead)
  image1IsRender: false, // 'Use as Image 1' was pressed: the render stands in for the capture in the prompt and bundle
  shotsData: null,       // the book on show in the shots browser: { book, shots, images }
  promptStyle: 'photo', // 'photo' | 'ligne-claire'
  promptAction: '',     // what the shot shows; typed in the capture dialog
  promptOthers: '',     // people with no portrait of their own (a crowd); empty means nobody else

  // Book Storage
  books: [],
  activeBook: (() => {
    try { return localStorage.getItem('daag.composer.activeBook') || 'the-part-time-parliament'; } catch (_) { return 'the-part-time-parliament'; }
  })(),
  shotId: 'cover-alt',

  // Layout & Sites
  island: 'paxos',      // the island model on screen: 'arche' | 'paxos' (chosen on page open)
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
  btnCopyCoords: document.getElementById('btn-copy-coords'),

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
  btnFlux: document.getElementById('btn-flux'),
  shotSwitch: document.getElementById('shot-switch'),
  recentModal: document.getElementById('recent-modal'),
  recentList: document.getElementById('recent-list'),
  captureShotChips: document.getElementById('capture-shot-chips'),
  shotNameInput: document.getElementById('shot-name-input'),
  explorerModal: document.getElementById('explorer-modal'),
  explorerList: document.getElementById('explorer-list'),
  renderCaption: document.getElementById('render-caption'),
  renderStrip: document.getElementById('render-strip'),
  fluxCaption: document.getElementById('flux-caption'),
  fluxStrip: document.getElementById('flux-strip'),
  fluxSourceRender: document.getElementById('flux-source-render'),
  fluxSourceNote: document.getElementById('flux-source-note'),
  fluxStatus: document.getElementById('flux-status'),
  fluxSeed: document.getElementById('flux-seed'),
  fluxResult: document.getElementById('flux-result'),
  fluxImg: document.getElementById('flux-img'),
  btnFluxOpen: document.getElementById('btn-flux-open'),
  btnFluxDownload: document.getElementById('btn-flux-download'),
  btnRenderOpen: document.getElementById('btn-render-open'),
  btnRenderDownload: document.getElementById('btn-render-download'),
  browserSearch: document.getElementById('browser-search'),
  testsModal: document.getElementById('tests-modal'),
  propInspector: document.getElementById('prop-inspector'),
  propInspectorName: document.getElementById('prop-inspector-name'),
  propX: document.getElementById('prop-x'),
  propY: document.getElementById('prop-y'),
  propZ: document.getElementById('prop-z'),
  propYaw: document.getElementById('prop-yaw'),
  propScale: document.getElementById('prop-scale'),
  testsList: document.getElementById('tests-list'),
  testsQuality: document.getElementById('tests-quality'),
  testsStatus: document.getElementById('tests-status'),
  testShotName: document.getElementById('test-shot-name'),
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
  btnViewArche: document.getElementById('btn-view-arche'),
  btnViewPaxos: document.getElementById('btn-view-paxos'),
  btnToggleProps: document.getElementById('btn-toggle-props'),
  btnOpenHelp: document.getElementById('btn-open-help'),
  btnCloseHelp: document.getElementById('btn-close-help'),
  helpModal: document.getElementById('help-modal'),
  propSearchInput: document.getElementById('prop-search-input'),
  interiorJumpChips: document.getElementById('interior-jump-chips'),
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
  await loadDrafts();
  updatePendingBadge();
  state.lightPresets = (await (await fetch('/api/lights')).json()).presets || {};
  applyLightPreset(state.timeOfDay);

  // Ask which island on open (?island=arche|paxos picks one without asking); each model is about 160 MB
  chooseIsland().then(loadIslandModel);

  // Start Animation Loop
  animate();
  updateFramingMatte();
  updatePrompt();
}

/** The island chooser shown on page open; resolves with the island picked. */
function chooseIsland() {
  const preset = new URLSearchParams(location.search).get('island');
  if (preset === 'arche' || preset === 'paxos') return Promise.resolve(preset);
  const modal = document.getElementById('island-modal');
  dom.loadingOverlay.classList.add('hidden');
  modal.style.display = 'flex';
  return new Promise((resolve) => {
    modal.querySelectorAll('.island-card').forEach((card) => {
      card.addEventListener('click', () => {
        modal.style.display = 'none';
        resolve(card.dataset.island);
      }, { once: true });
    });
  });
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

  camera = new THREE.PerspectiveCamera(state.fov, window.innerWidth / window.innerHeight, 0.1, 80000);
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
  controls.maxPolarAngle = Math.PI;      // eye-level shots sit at or past the horizon; a clamp would move them on load
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

  transformControls.addEventListener('objectChange', () => {
    const p = state.selectedPlacedProp;
    if (!p) return;
    // A shot records a prop's position, yaw and one scale: keep to those
    if (state.gizmoMode === 'scale') {
      const s = Math.cbrt(Math.abs(p.mesh.scale.x * p.mesh.scale.y * p.mesh.scale.z)) || 1;
      p.mesh.scale.setScalar(s);
    }
    p.mesh.rotation.x = 0;
    p.mesh.rotation.z = 0;
    refreshPropInspector();
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

// A light preset's own compass bearing for the sun in the viewport (render.py takes the bearing from the shot)
const PRESET_BEARING = { golden: 250, morning: 100, noon: 180, late: 245, overcast: 210, cloudy_sun: 200, evening_cloud: 250, dusk: 270 };

/** Select a time of day or weather as render.py has it: its sun elevation (a sun sky only), the sun at
 *  the preset's own strength and its own haze. The sliders are offsets from that. */
function applyLightPreset(name) {
  const p = state.lightPresets[name] || {};
  state.timeOfDay = name;
  state.sunAzimuth = PRESET_BEARING[name] ?? state.sunAzimuth;
  if (p.sky === 'sun' && p.elev !== undefined) state.sunElevation = p.elev;
  state.sunIntensity = 1.5;
  state.fogDensity = 25;
  dom.sunElevationSlider.disabled = p.sky === 'hdri';      // an HDRI sky has its own sun: the render ignores elevation
  dom.sunElevationSlider.title = p.sky === 'hdri' ? 'This sky has its own sun; the render ignores elevation' : '';
  document.querySelectorAll('[data-tod]').forEach((b) => b.classList.toggle('active', b.dataset.tod === name));
  dom.sunAzimuthSlider.value = state.sunAzimuth;
  dom.sunAzimuthVal.textContent = `${state.sunAzimuth}° · ${compassHeading(state.sunAzimuth)}`;
  dom.sunElevationSlider.value = state.sunElevation;
  dom.sunElevationVal.textContent = `${state.sunElevation}°`;
  dom.sunIntensitySlider.value = state.sunIntensity;
  dom.sunIntensityVal.textContent = state.sunIntensity.toFixed(1);
  dom.fogDensitySlider.value = state.fogDensity;
  dom.fogDensityVal.textContent = `${state.fogDensity}%`;
  updateSunPosition();
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
    case 'cloudy_sun':
      skyTop = 0x5a86b0;
      skyHorizon = 0xc4d2de;
      skyGround = 0x8aa4bc;
      lightColor = 0xf2f0ea;
      fogCol = 0xc4d2de;
      break;
    case 'evening_cloud':
      skyTop = 0x4a5f80;
      skyHorizon = 0xe0a070;
      skyGround = 0x6a5a5a;
      lightColor = 0xf0b080;
      fogCol = 0xc89478;
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
/** Field of view of a Blender camera for this lens and frame shape. The renders use a 36 mm sensor fitted to
 *  the longer side of the frame (sensor_width 36, sensor_fit AUTO), so a 3:4 frame has 36 mm over its height
 *  and a 16:9 frame over its width. Returns radians. */
function shotFov(lens, aspect) {
  const half = 18 / lens;
  return aspect >= 1
    ? { h: 2 * Math.atan(half), v: 2 * Math.atan(half / aspect) }
    : { v: 2 * Math.atan(half), h: 2 * Math.atan(half * aspect) };
}

function applyFocalLength(mm) {
  state.lens = mm;
  dom.focalSlider.value = mm;
  dom.focalVal.textContent = `${mm}mm`;
  dom.hudCamSummary.textContent = `Cam: ${mm}mm · ${state.aspect}`;
  updateFramingMatte();
}

/** The framing matte on screen: the largest box of the shot's aspect that fits the window with a margin. */
function frameBox() {
  const [w, h] = state.aspect.split(':').map(parseFloat);
  const targetAspect = w / h;
  const winW = window.innerWidth;
  const winH = window.innerHeight;
  const margin = 0.88;
  return winW / winH > targetAspect
    ? { boxW: winH * margin * targetAspect, boxH: winH * margin, targetAspect }
    : { boxW: winW * margin, boxH: (winW * margin) / targetAspect, targetAspect };
}

/** Draw the matte, and set the camera so that what is inside the matte has the field of view a Blender render
 *  of this lens and aspect has. (The window is taller than the matte, so the camera's own vertical field of
 *  view is wider than the shot's.) */
function updateFramingMatte() {
  const { boxW, boxH, targetAspect } = frameBox();
  dom.framingBox.style.width = `${Math.round(boxW)}px`;
  dom.framingBox.style.height = `${Math.round(boxH)}px`;
  dom.matteLabel.textContent = `${state.aspect} · ${state.lens}mm (focal)`;

  const fov = shotFov(state.lens, targetAspect);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.fov = (2 * Math.atan(Math.tan(fov.v / 2) * (window.innerHeight / boxH)) * 180) / Math.PI;
  camera.updateProjectionMatrix();
  state.fov = (fov.v * 180) / Math.PI;
  dom.fovDisplay.textContent = `FOV: ${(fov.h * 180 / Math.PI).toFixed(1)}° × ${state.fov.toFixed(1)}° (${state.lens}mm)`;
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
  if (dom.btnViewArche) dom.btnViewArche.classList.toggle('active', island === 'arche');
  if (dom.btnViewPaxos) dom.btnViewPaxos.classList.toggle('active', island === 'paxos');

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
  populateInteriorJumpChips();
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

    // Selected book to preserve: current select value, or state.activeBook, or localStorage
    const savedActiveBook = (() => {
      try { return localStorage.getItem('daag.composer.activeBook'); } catch (_) { return null; }
    })();
    const targetBook = dom.saveBookSelect.value || state.activeBook || savedActiveBook;
    const targetBrowserBook = dom.browserBookSelect.value || state.activeBook || savedActiveBook;

    // Populate save & browser dropdowns
    dom.saveBookSelect.innerHTML = '';
    dom.browserBookSelect.innerHTML = '';

    state.books.forEach((b) => {
      const opt1 = document.createElement('option');
      opt1.value = b.id;
      opt1.textContent = `${b.title} (${b.shots_count} shots)`;
      if (b.id === targetBook) opt1.selected = true;
      dom.saveBookSelect.appendChild(opt1);

      const opt2 = document.createElement('option');
      opt2.value = b.id;
      opt2.textContent = `${b.title} (${b.shots_count} shots)`;
      if (b.id === targetBrowserBook) opt2.selected = true;
      dom.browserBookSelect.appendChild(opt2);
    });

    if (dom.saveBookSelect.value) {
      state.activeBook = dom.saveBookSelect.value;
      try { localStorage.setItem('daag.composer.activeBook', state.activeBook); } catch (_) {}
    }
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
    const isInterior = site.kind === 'interior' || (site.cam && site.target);
    el.className = isInterior ? 'site-pin site-pin-interior' : 'site-pin';
    el.innerHTML = isInterior ? `<span class="pin-icon">🏛</span>${site.name}` : site.name;
    el.dataset.id = site.id;

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      teleportToSite(site);
    });

    dom.sitePinsLayer.appendChild(el);
    const pinCoord = (site.x != null && site.y != null && site.z != null)
      ? [site.x, site.y, site.z + (isInterior ? 3 : 6)]
      : (site.target || site.cam);
    sitePins.push({ el, pos: blenderToThree(pinCoord), site });
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
  dom.teleportSelect.innerHTML = '<option value="">Teleport to location...</option>';
  const interiors = state.sites.filter((s) => s.kind === 'interior' || (s.cam && s.target));
  const exteriors = state.sites.filter((s) => s.kind !== 'interior' && !(s.cam && s.target));

  if (interiors.length > 0) {
    const grp = document.createElement('optgroup');
    grp.label = '🏛 Building Interiors';
    interiors.forEach((site) => {
      const opt = document.createElement('option');
      opt.value = site.id;
      opt.textContent = site.name;
      grp.appendChild(opt);
    });
    dom.teleportSelect.appendChild(grp);
  }

  if (exteriors.length > 0) {
    const grp = document.createElement('optgroup');
    grp.label = '📍 Sites & Landmarks (Exterior)';
    exteriors.forEach((site) => {
      const opt = document.createElement('option');
      opt.value = site.id;
      opt.textContent = site.name;
      grp.appendChild(opt);
    });
    dom.teleportSelect.appendChild(grp);
  }
}

function populateInteriorJumpChips() {
  if (!dom.interiorJumpChips) return;
  dom.interiorJumpChips.innerHTML = '';
  const interiors = state.sites.filter((s) => s.kind === 'interior' || (s.cam && s.target));
  if (interiors.length === 0) {
    dom.interiorJumpChips.innerHTML = '<span style="font-size: 0.75rem; color: var(--text-dim); padding: 4px 0;">No interior locations on this island</span>';
    return;
  }
  interiors.forEach((site) => {
    const btn = document.createElement('button');
    btn.className = 'btn btn-chip interior-chip';
    btn.title = `Jump to ${site.name}${site.lens ? ` (${site.lens}mm)` : ''}`;
    btn.innerHTML = `<span style="font-size: 0.85rem;">🏛</span> <span>${site.name}</span>`;
    btn.addEventListener('click', () => {
      teleportToSite(site);
    });
    dom.interiorJumpChips.appendChild(btn);
  });
}

function teleportToSite(site) {
  if (site.cam && site.target) {
    flyCameraTo(blenderToThree(site.cam), blenderToThree(site.target), 1200);
    if (site.lens) {
      applyFocalLength(site.lens);
      document.querySelectorAll('[data-lens]').forEach((b) => {
        b.classList.toggle('active', parseInt(b.dataset.lens) === site.lens);
      });
    }
  } else {
    const big = ['chamber', 'tholos', 'stoa', 'festival', 'crown', 'granary'].includes(site.id);
    const dist = big ? 60 : 35;
    // Stand in front of the site when it has a facing (radians from +X), else to its south
    const ang = site.face ?? -Math.PI / 2;
    const at = [site.x, site.y, site.z + 3];
    const from = [site.x + Math.cos(ang) * dist, site.y + Math.sin(ang) * dist, site.z + dist * 0.45];
    flyCameraTo(blenderToThree(from), blenderToThree(at), 1200);
  }
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
function renderPropsCatalog(categoryFilter = 'all', textFilter = '') {
  dom.propsCatalogGrid.innerHTML = '';

  const q = (textFilter || (dom.propSearchInput ? dom.propSearchInput.value : '')).trim().toLowerCase();

  const filtered = state.propsCatalog.filter((p) => {
    const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
    const matchText = !q || p.name.toLowerCase().includes(q) || (p.category && p.category.toLowerCase().includes(q));
    return matchCat && matchText;
  });

  if (filtered.length === 0) {
    dom.propsCatalogGrid.innerHTML = '<p style="grid-column: 1 / -1; font-size: 0.78rem; color: var(--text-dim); text-align: center; padding: 16px 0;">No props match search.</p>';
    return;
  }

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

/** Put a prop of the catalog into the scene: a three.js position of its base, a yaw about up in radians, a scale.
 *  The prop hangs from a pivot group at the middle of its bounding box, so the gizmo sits in the model and
 *  turning it turns it about its own middle; the entry's mesh is that pivot. */
async function spawnProp(propDef, base, yaw, scale) {
  const model = await loadPropModel(propDef);
  const box = new THREE.Box3().setFromObject(model);
  const centre = box.getCenter(new THREE.Vector3());
  model.position.sub(centre);
  const pivot = new THREE.Group();
  pivot.add(model);
  pivot.rotation.y = yaw;
  pivot.scale.setScalar(scale);

  const uniqueId = `prop_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  pivot.userData = { isProp: true, propId: propDef.id, name: propDef.name, uniqueId };
  propsGroup.add(pivot);

  const entry = {
    id: uniqueId, propId: propDef.id, name: propDef.name, icon: propDef.icon, mesh: pivot, model, centre,
    position: pivot.position, rotation: pivot.rotation, scale: pivot.scale
  };
  setPropBase(entry, base);
  state.placedProps.push(entry);
  return entry;
}

/** Where the prop stands: its base, the origin of the model, in three.js coordinates. */
function propBase(p) {
  return p.model.getWorldPosition(new THREE.Vector3());
}

/** Move the pivot so the prop's base is at `base`, keeping its turn and scale. */
function setPropBase(p, base) {
  p.mesh.updateMatrixWorld(true);
  const offset = p.centre.clone().multiply(p.mesh.scale).applyQuaternion(p.mesh.quaternion);
  p.mesh.position.copy(base).add(offset);
}

/** The placed props as a shot records them: catalog id, Blender position, yaw in degrees (from +x), scale. */
function placedPropsForShot() {
  return state.placedProps.map((p) => ({
    prop: p.propId,
    at: shotPoint(propBase(p)),
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

/** The numeric fields for the selected prop: position of its base in Blender metres, yaw, scale. */
function refreshPropInspector() {
  const p = state.selectedPlacedProp;
  dom.propInspector.style.display = p ? 'block' : 'none';
  if (!p) return;
  const [x, y, z] = shotPoint(propBase(p));
  const set = (el, v) => { if (document.activeElement !== el) el.value = v; };
  set(dom.propX, x); set(dom.propY, y); set(dom.propZ, z);
  set(dom.propYaw, ((p.mesh.rotation.y * 180) / Math.PI).toFixed(1));
  set(dom.propScale, p.mesh.scale.x.toFixed(2));
  dom.propInspectorName.textContent = p.name;
}

/** Apply the inspector's fields to the selected prop. */
function applyPropInspector() {
  const p = state.selectedPlacedProp;
  if (!p) return;
  p.mesh.rotation.y = (parseFloat(dom.propYaw.value) || 0) * Math.PI / 180;
  p.mesh.scale.setScalar(Math.max(0.05, parseFloat(dom.propScale.value) || 1));
  setPropBase(p, blenderToThree([parseFloat(dom.propX.value) || 0, parseFloat(dom.propY.value) || 0, parseFloat(dom.propZ.value) || 0]));
  refreshPropInspector();
}

function turnSelectedProp(degrees) {
  const p = state.selectedPlacedProp;
  if (!p) return;
  const base = propBase(p);
  p.mesh.rotation.y += (degrees * Math.PI) / 180;
  setPropBase(p, base);
  refreshPropInspector();
}

function dropSelectedProp() {
  const p = state.selectedPlacedProp;
  if (!p) return;
  const [x, y] = threeToBlender(propBase(p));
  setPropBase(p, blenderToThree([x, y, groundAt(x, y)]));
  refreshPropInspector();
}

function selectPlacedProp(placedEntry) {
  state.selectedPlacedProp = placedEntry;
  if (placedEntry && placedEntry.mesh) {
    transformControls.attach(placedEntry.mesh);
  } else {
    transformControls.detach();
  }
  renderPlacedPropsList();
  refreshPropInspector();
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
      <span class="prop-label">${esc(p.icon)} ${esc(p.name)} #${idx + 1}</span>
      <div style="display: flex; gap: 4px; flex-shrink: 0;">
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
  // A render still made from this very view stays Image 1 and FLUX's source; otherwise the capture is
  const renderFits = state.renderView && state.renderView === viewSignature();
  state.image1IsRender = state.image1IsRender && renderFits;
  setFluxSource(renderFits ? 'render' : 'capture');
  // 1. Temporarily detach all visual helpers in the 3D scene
  transformControls.detach();
  dom.sitePinsLayer.style.display = 'none';

  // 2. Render clean 3D scene
  renderer.render(scene, camera);

  // 3. Crop to the framing matte, so the picture is what the matte shows
  const canvasW = renderer.domElement.width;
  const canvasH = renderer.domElement.height;
  const { boxW, boxH } = frameBox();
  const scale = canvasW / window.innerWidth;
  const cropW = boxW * scale;
  const cropH = boxH * scale;
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
        shot_id: state.draftId || state.shotId || 'capture',
        metadata: {
          shot: state.draftId,
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
      state.lastCaptureFile = data.filename;
      addPending(data.filename);
      if (!state.image1IsRender) state.captureFilename = data.filename;
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
    if (dom.btnCopyImage) {
      const orig = dom.btnCopyImage.textContent;
      dom.btnCopyImage.textContent = '✓ Copied!';
      setTimeout(() => { dom.btnCopyImage.textContent = orig; }, 1500);
    }
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
/** The prompt for the style and cast on screen; labels=false for clean cast crops without printed banners. */
function currentPrompt({ labels = false } = {}) {
  const { shots } = state.shotsData || { shots: {} };
  const current = (shots && shots[state.shotId]) || {};
  const interior = Boolean(current.interior || (current.base && current.base.includes('interior')));
  return buildPrompt({
    style: state.promptStyle,
    action: state.promptAction,
    others: state.promptOthers,
    cast: state.selectedCast,
    labels,
    interior
  });
}

function updatePrompt() {
  const prompt = currentPrompt();
  dom.promptOutputText.textContent = prompt;
  return prompt;
}

// --- 10. Book Shots Storage (shots.json) ---
/** The shot on screen as shots.json holds it: camera in Blender coordinates, or in the building's frame
 *  when the shot being edited has a site. */
/** What the sliders change from the light preset, as render.py reads it; null where they are as the preset has them. */
function weatherOffsets() {
  const p = state.lightPresets[state.timeOfDay] || {};
  return {
    sun_elev: p.sky === 'sun' && state.sunElevation !== p.elev ? state.sunElevation : null,
    sun_scale: Math.abs(state.sunIntensity - 1.5) > 0.05 ? parseFloat((state.sunIntensity / 1.5).toFixed(2)) : null,
    fog_scale: state.fogDensity !== 25 ? parseFloat((state.fogDensity / 25).toFixed(2)) : null
  };
}

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
    ...weatherOffsets(),
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

  // Update activeBook in state and persist
  state.activeBook = bookId;
  try { localStorage.setItem('daag.composer.activeBook', bookId); } catch (_) {}

  const shotData = composedShot(shotId);
  const variant = dom.saveVariant.value.trim() || null;

  try {
    if (dom.btnSaveShotBook) {
      dom.btnSaveShotBook.disabled = true;
      dom.btnSaveShotBook.textContent = '💾 Saving shot...';
    }
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
      showToast(`✓ ${result.created ? 'Created' : 'Updated'} '${shotId}${variant ? '/' + variant : ''}' in ${bookId}/shots.json`);
      dropPending(state.lastCaptureFile);      // saved into a book: no longer pending
      await loadBooksList(); // Refresh counts
      dom.saveBookSelect.value = bookId; // Explicitly ensure dropdown stays where shot was saved
      if (dom.btnSaveShotBook) {
        dom.btnSaveShotBook.textContent = '✓ Saved to Book!';
        setTimeout(() => {
          dom.btnSaveShotBook.textContent = "💾 Save Shot into Book's shots.json";
          dom.btnSaveShotBook.disabled = false;
        }, 1600);
      }
    } else {
      showToast(`Save failed: ${result.error}`);
      if (dom.btnSaveShotBook) {
        dom.btnSaveShotBook.textContent = "💾 Save Shot into Book's shots.json";
        dom.btnSaveShotBook.disabled = false;
      }
    }
  } catch (err) {
    console.error('Failed to save shot:', err);
    showToast('Error saving shot to backend');
    if (dom.btnSaveShotBook) {
      dom.btnSaveShotBook.textContent = "💾 Save Shot into Book's shots.json";
      dom.btnSaveShotBook.disabled = false;
    }
  }
}

// --- Full-detail renders ---
async function startRender() {
  await saveDraft().catch(() => {});
  const captureAtStart = state.lastCaptureFile;     // the capture this render belongs to, for the recent list
  const shotId = dom.saveShotId.value.trim() || state.shotId || 'shot';
  const shot = composedShot(shotId);
  dom.btnRender.disabled = true;
  dom.renderStatus.textContent = 'queued';
  try {
    const res = await fetch('/api/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ island: state.island, shot, quality: dom.renderQuality.value, size: dom.renderSize.value, view: currentView(), shot_id: state.draftId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || res.statusText);
    state.renderJob = data.job;
    pollRender(data.job, performance.now(), captureAtStart);
  } catch (err) {
    dom.renderStatus.textContent = `failed: ${err.message}`;
    dom.btnRender.disabled = false;
  }
}

async function pollRender(job, t0, captureAtStart) {
  try {
    const data = await (await fetch(`/api/render/${job}`)).json();
    const secs = Math.round((performance.now() - t0) / 1000);
    if (data.status === 'done') {
      state.renderURL = data.url;
      loadAttempts({ view: data.view, newest: true });
      attachPending('renders', data.url, captureAtStart);
      state.renderView = viewSignature();
      dom.fluxSourceRender.disabled = false;
      setFluxSource('render');
      dom.renderStatus.textContent = `done in ${data.seconds}s`;
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
    setTimeout(() => pollRender(job, t0, captureAtStart), 2500);
  } catch (err) {
    dom.renderStatus.textContent = 'lost contact with server';
    dom.btnRender.disabled = false;
  }
}

// --- Shots being composed, each with an id ---
const draftLabel = (id) => `${id}${state.drafts[id]?.name ? ` · ${state.drafts[id].name}` : ''}`;

async function loadDrafts() {
  const data = await (await fetch('/api/shots')).json();
  state.drafts = data.shots || {};
  state.draftSummary = data.summary || {};
  updateShotSwitch();
  if (dom.explorerModal.style.display === 'flex') renderExplorer();
}

/** Save the composition on screen as the current shot, creating it (shot-N) the first time. */
async function saveDraft() {
  if (!state.draftId) {
    // The same camera, look-at, island and site as a shot already saved is that shot, not a new one
    const mine = composedShot(state.shotId);
    const same = (p, q) => Array.isArray(p) && Array.isArray(q) && p.every((v, i) => v === q[i]);
    const found = Object.entries(state.drafts).find(([, d]) =>
      d.island === mine.island && (d.site || null) === (mine.site || null) && same(d.cam, mine.cam) && same(d.target, mine.target));
    if (found) state.draftId = found[0];
  }
  const res = await fetch('/api/shots', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: state.draftId || undefined,
      name: dom.shotNameInput.value.trim(),
      shot: composedShot(state.shotId)
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  state.draftId = data.id;
  await loadDrafts();
  return data.id;
}

function updateShotSwitch() {
  const ids = Object.keys(state.drafts);
  dom.shotSwitch.innerHTML = `<option value="">${state.draftId ? 'New shot…' : 'Unsaved shot'}</option>` +
    ids.map((id) => `<option value="${esc(id)}">${esc(draftLabel(id))}</option>`).join('');
  dom.shotSwitch.value = state.draftId && state.drafts[state.draftId] ? state.draftId : '';

  dom.captureShotChips.innerHTML = '';
  ids.forEach((id) => {
    const chip = document.createElement('button');
    chip.className = `btn btn-chip${id === state.draftId ? ' active' : ''}`;
    chip.textContent = draftLabel(id);
    chip.addEventListener('click', () => switchDraft(id, { recapture: true }));
    dom.captureShotChips.appendChild(chip);
  });
  if (document.activeElement !== dom.shotNameInput) dom.shotNameInput.value = state.drafts[state.draftId]?.name || '';
}

/** Leave the current shot (saved as it is) and open another: its island, camera, lens, light, cast, prompt and props. */
async function switchDraft(id, { recapture = false } = {}) {
  if (id === state.draftId) return;
  if (state.draftId) await saveDraft().catch(() => {});
  const shot = state.drafts[id];
  if (!shot) return;
  applyBookShot(id, shot, { draft: id });
  showToast(`Shot ${draftLabel(id)}`);
  if (recapture) {
    setTimeout(() => { captureCurrentScreenView(); loadAttempts(); }, 1500);   // after the camera has flown there
  }
}

function newShot() {
  state.draftId = null;
  state.selectedCast = [];
  updateCastSummaryUI();
  renderCastDrawer();
  updatePrompt();
  updateShotSwitch();
  showToast('New shot: it gets an id when you capture, render or save');
}

async function deleteDraft(id) {
  await fetch('/api/shots/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
  if (state.draftId === id) state.draftId = null;
  await loadDrafts();
}

function renderExplorer() {
  const ids = Object.keys(state.drafts).sort((a, b) => (state.drafts[b].updated || '').localeCompare(state.drafts[a].updated || ''));
  dom.explorerList.innerHTML = ids.length ? '' :
    '<p style="color: var(--text-dim);">No shots yet. A shot gets its id when you first capture, render or save it.</p>';
  ids.forEach((id) => {
    const s = state.drafts[id];
    const sum = state.draftSummary[id] || { renders: [], flux: [], counts: { renders: 0, flux: 0 } };
    const pic = (url, label) => url ? `
      <a href="${esc(url)}" target="_blank" rel="noopener" style="flex: 1; min-width: 0; text-decoration: none; color: var(--text-dim); font-size: 0.7rem; text-align: center;">
        <img loading="lazy" src="${esc(url)}?w=320" alt="${esc(label)}" style="width: 100%; border-radius: 6px; display: block;">${esc(label)}</a>` : '';
    const card = document.createElement('div');
    card.className = 'control-section';
    card.innerHTML = `
      <div class="section-title">
        <span>${esc(id)}</span>
        <span class="control-val">${esc(s.island)} · ${esc(s.lens || '')}mm · ${esc(s.aspect || '')}${id === state.draftId ? ' · open' : ''}</span>
      </div>
      <input type="text" class="input-text" data-act="name" value="${esc(s.name || '')}" placeholder="name this shot" style="margin-bottom: 6px;">
      <div style="display: flex; gap: 6px; margin-bottom: 6px; min-height: 40px;">
        ${pic(sum.renders[0], `render (${sum.counts.renders})`) + pic(sum.flux[0], `FLUX (${sum.counts.flux})`) || '<span style="color: var(--text-dim); font-size: 0.8rem;">no pictures yet</span>'}
      </div>
      <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 6px;">${esc((s.prompt || '').slice(0, 110))}${(s.prompt || '').length > 110 ? '…' : ''}</div>
      <div style="display: flex; gap: 6px;">
        <button class="btn btn-primary btn-chip" data-act="open">🎯 Open</button>
        <button class="btn btn-chip" data-act="delete" style="color: var(--accent-red);">✕ Delete</button>
      </div>`;
    card.addEventListener('click', async (e) => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'open') {
        await switchDraft(id);
        dom.explorerModal.style.display = 'none';
      } else if (act === 'delete') deleteDraft(id);
    });
    card.querySelector('[data-act="name"]').addEventListener('change', async (e) => {
      await fetch('/api/shots', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: e.target.value.trim(), shot: s }) });
      loadDrafts();
    });
    dom.explorerList.appendChild(card);
  });
}

/** The camera position and look-at point in world (Blender) coordinates. */
function currentView() {
  return { cam: shotPoint(camera.position), target: shotPoint(controls.target) };
}

// --- Captures not yet saved to a book, kept in local storage so they can be revisited ---
const PENDING_KEY = 'daag.composer.pending';
const PENDING_MAX = 60;

function readPending() {
  try {
    return JSON.parse(localStorage.getItem(PENDING_KEY) || '[]');
  } catch (err) {
    return [];
  }
}

function writePending(list) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(list.slice(0, PENDING_MAX)));
  } catch (err) {
    console.warn('Could not keep recent captures:', err);
  }
  updatePendingBadge();
}

/** A capture was saved to composer/captures: remember its composition and path. */
function addPending(file) {
  const shot = composedShot(state.shotId);
  const entry = {
    file, capture: `/captures/${file}`, at: new Date().toISOString(), island: state.island, draft: state.draftId,
    shot, view: currentView(), renders: [], flux: []
  };
  writePending([entry, ...readPending().filter((e) => e.file !== file)]);
}

/** A render or FLUX picture was made for a capture: add its path to that entry. */
function attachPending(kind, url, file) {
  if (!file) return;
  const list = readPending();
  const entry = list.find((e) => e.file === file);
  if (!entry) return;
  if (!entry[kind].includes(url)) entry[kind].unshift(url);
  writePending(list);
}

/** The capture was saved into a book's shots.json: it no longer needs keeping. */
function dropPending(file) {
  if (file) writePending(readPending().filter((e) => e.file !== file));
}

function updatePendingBadge() {
  const n = readPending().length;
  const el = document.getElementById('pending-count');
  if (el) el.textContent = n;
}

function renderRecent() {
  const list = readPending();
  dom.recentList.innerHTML = list.length ? '' :
    '<p style="color: var(--text-dim);">Nothing here. Each capture that has not been saved into a book is kept here, with its renders and FLUX pictures, in this browser.</p>';
  list.forEach((e) => {
    const s = e.shot || {};
    const when = new Date(e.at).toLocaleString();
    const card = document.createElement('div');
    card.className = 'control-section';
    const link = (url, label) => `<a href="${esc(url)}" target="_blank" rel="noopener" style="color: var(--gold);">${esc(label)}</a>`;
    card.innerHTML = `
      <div class="section-title">
        <span>${esc(when)}</span>
        <span class="control-val">${esc(e.island)} · ${esc(s.lens || '')}mm · ${esc(s.aspect || '')}</span>
      </div>
      <img loading="lazy" src="${esc(e.capture)}?w=360" alt="capture" style="width: 100%; border-radius: 6px; display: block; margin-bottom: 6px;">
      <div style="font-size: 0.75rem; color: var(--text-dim); line-height: 1.5; margin-bottom: 6px; word-break: break-all;">
        ${link(e.capture, 'capture')}: ${esc(e.file)}<br>
        ${e.renders.map((u, i) => link(u, `render ${e.renders.length - i}`)).join(' · ') || 'no renders'}<br>
        ${e.flux.map((u, i) => link(u, `FLUX ${e.flux.length - i}`)).join(' · ') || 'no FLUX pictures'}
      </div>
      <div style="display: flex; gap: 6px;">
        <button class="btn btn-primary btn-chip" data-act="open">🎯 Open</button>
        <button class="btn btn-chip" data-act="forget" style="color: var(--accent-red);">✕ Forget</button>
      </div>`;
    card.addEventListener('click', (ev) => {
      const act = ev.target.closest('button')?.dataset.act;
      if (act === 'open') openRecent(e);
      else if (act === 'forget') { dropPending(e.file); renderRecent(); }
    });
    dom.recentList.appendChild(card);
  });
}

/** Go back to a recent capture: its composition, its capture picture, and the attempts from its view. */
function openRecent(e) {
  dom.recentModal.style.display = 'none';
  applyBookShot(e.file, e.shot, { draft: e.draft && state.drafts[e.draft] ? e.draft : null });
  state.lastCaptureFile = e.file;
  state.captureFilename = e.file;
  state.image1IsRender = false;
  state.capturedImageURL = e.capture;
  dom.capturePreviewImg.src = e.capture;
  dom.previsMetaBadge.textContent = `Earlier capture · ${new Date(e.at).toLocaleString()}`;
  setFluxSource('capture');
  loadAttempts({ view: e.view, newest: true });
  setTimeout(() => dom.captureModal.classList.remove('hidden'), 1300);     // after the camera has flown there
}

// --- Earlier attempts, in the Blender and FLUX panels ---
// A picture is an attempt at this shot when it was made from this camera position looking the same way;
// the lens, aspect and time of day may differ. Stepping through them only shows them.
const attempts = { renders: [], flux: [], at: { renders: 0, flux: 0 } };

function panelOf(kind) {
  return kind === 'renders'
    ? { box: dom.renderResult, img: dom.renderImg, caption: dom.renderCaption, strip: dom.renderStrip,
        open: dom.btnRenderOpen, download: dom.btnRenderDownload }
    : { box: dom.fluxResult, img: dom.fluxImg, caption: dom.fluxCaption, strip: dom.fluxStrip,
        open: dom.btnFluxOpen, download: dom.btnFluxDownload };
}

/** Load the attempts for a view: the one given (a job's, or a recent capture's), else the camera's now. The view
 *  is kept, so what is listed stays that view's however the camera has moved since. */
async function loadAttempts({ view = null, newest = false } = {}) {
  try {
    const v = view || currentView();
    state.attemptsView = v;
    const data = await (await fetch(`/api/history?cam=${v.cam.join(',')}&target=${v.target.join(',')}`)).json();
    attempts.renders = data.renders || [];
    attempts.flux = data.flux || [];
  } catch (err) {
    attempts.renders = [];
    attempts.flux = [];
  }
  ['renders', 'flux'].forEach((kind) => {
    if (newest) attempts.at[kind] = 0;
    showAttempts(kind);
  });
}

function attemptLabel(it) {
  const bits = [it.made];
  if (it.lens) bits.push(`${it.lens}mm`);
  if (it.aspect) bits.push(it.aspect);
  if (it.light) bits.push(it.light);
  if (it.seed !== undefined && it.seed !== null) bits.push(`seed ${it.seed}`);
  if (it.seconds) bits.push(`${it.seconds}s`);
  if (it.from) bits.push(`from ${it.from}`);
  return bits.join(' · ');
}

function showAttempts(kind) {
  const p = panelOf(kind);
  const list = attempts[kind];
  p.box.style.display = list.length ? 'block' : 'none';
  p.strip.innerHTML = '';
  if (!list.length) return;
  attempts.at[kind] = Math.min(Math.max(attempts.at[kind], 0), list.length - 1);
  const i = attempts.at[kind];
  const it = list[i];
  p.img.src = it.url;
  p.open.href = it.url;
  p.download.href = it.url;
  p.download.download = `${state.draftId || state.shotId || 'shot'}-${kind === 'flux' ? 'flux-' : ''}${it.url.split('/').pop()}`;
  p.caption.textContent = `${i + 1} of ${list.length} · ${attemptLabel(it)}`;
  list.forEach((item, k) => {
    const t = document.createElement('img');
    t.src = `${item.url}?w=120`;
    t.loading = 'lazy';
    t.alt = item.made;
    t.title = attemptLabel(item);
    t.style.cssText = `height: 52px; border-radius: 4px; cursor: pointer; opacity: ${k === i ? 1 : 0.55}; outline: ${k === i ? '2px solid var(--gold)' : 'none'};`;
    t.addEventListener('click', () => { attempts.at[kind] = k; showAttempts(kind); });
    p.strip.appendChild(t);
  });
}

// --- FLUX generation ---
/** The camera, lens and aspect as a string, to tell whether the view has moved since a render. */
function viewSignature() {
  const s = composedShot('view');
  return JSON.stringify([s.cam, s.target, s.lens, s.aspect]);
}

function fluxSource() {
  return document.querySelector('input[name="flux-source"]:checked').value;
}

function setFluxSource(which) {
  const radio = document.querySelector(`input[name="flux-source"][value="${which}"]`);
  if (!radio || radio.disabled) return;
  radio.checked = true;
  updateFluxSourceNote();
}

function updateFluxSourceNote() {
  const moved = fluxSource() === 'render' && state.renderView && state.renderView !== viewSignature();
  dom.fluxSourceNote.textContent = moved ? 'The view has moved since this render was made.' : '';
}

async function startFlux() {
  await saveDraft().catch(() => {});
  const captureAtStart = state.lastCaptureFile;
  const source = fluxSource();
  let kindFile;
  if (source === 'render') {
    if (!state.renderURL) return showToast('Render the shot first');
    kindFile = `render:${state.renderURL.split('/').pop()}`;
  } else {
    if (!state.lastCaptureFile) return showToast('Capture the view first');
    kindFile = `capture:${state.lastCaptureFile}`;
  }
  dom.btnFlux.disabled = true;
  dom.fluxStatus.textContent = 'queued';
  try {
    const res = await fetch('/api/flux', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        previs: kindFile,
        prompt: currentPrompt({ labels: false }),     // FLUX copies printed names, so the references carry none
        cast: state.selectedCast,
        seed: parseInt(dom.fluxSeed.value, 10) || 0,
        shot_id: state.draftId
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || res.statusText);
    const t0 = performance.now();
    for (;;) {
      await new Promise((r) => setTimeout(r, 3000));
      const job = await (await fetch(`/api/render/${data.job}`)).json();
      if (job.status === 'done') {
        loadAttempts({ view: job.view, newest: true });
        attachPending('flux', job.url, captureAtStart);
        dom.fluxStatus.textContent = `done in ${job.seconds}s · from the ${source === 'render' ? 'Blender render' : 'capture'}`;
        break;
      }
      if (job.status === 'error') throw new Error(String(job.error).slice(-200));
      dom.fluxStatus.textContent = `${job.status}… ${Math.round((performance.now() - t0) / 1000)}s`;
    }
  } catch (err) {
    dom.fluxStatus.textContent = 'failed';
    showToast(`FLUX: ${err.message}`);
  } finally {
    dom.btnFlux.disabled = false;
  }
}

async function useRenderAsPrevis() {
  const it = attempts.renders[attempts.at.renders];
  if (!it) return;
  state.renderURL = it.url;                // the render on show is the one FLUX and the prompt's Image 1 now use
  state.renderView = viewSignature();
  dom.fluxSourceRender.disabled = false;
  state.capturedImageURL = it.url;
  state.captureFilename = `render:${it.url.split('/').pop()}`;
  state.image1IsRender = true;
  setFluxSource('render');
  dom.capturePreviewImg.src = it.url;
  dom.previsMetaBadge.textContent = `Blender render · ${state.aspect}`;
  showToast('This render is now Image 1');
}

// --- Test shots: throwaway views for trying world changes ---
let testsData = { shots: {}, renders: {} };

async function loadTests() {
  testsData = await (await fetch('/api/tests')).json();
  renderTestsList();
}

async function saveTestShot() {
  const id = dom.testShotName.value.trim().replace(/[^A-Za-z0-9_.-]+/g, '-').replace(/^[^A-Za-z0-9]+/, '');
  if (!id) return showToast('Name the test shot first');
  const res = await fetch('/api/tests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, shot: composedShot(id) })
  });
  const data = await res.json();
  showToast(res.ok ? `Saved test shot '${id}'` : `Not saved: ${data.error}`);
}

async function deleteTest(id) {
  await fetch('/api/tests/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });
  await loadTests();
}

/** Render one test shot and wait for the picture. Resolves when the job is over. */
async function renderTest(id, quality, onStatus) {
  const shot = testsData.shots[id];
  const res = await fetch('/api/render', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ island: shot.island, shot, quality, test: id })
  });
  const { job, error } = await res.json();
  if (error) throw new Error(error);
  const t0 = performance.now();
  for (;;) {
    await new Promise((r) => setTimeout(r, 2000));
    const data = await (await fetch(`/api/render/${job}`)).json();
    if (data.status === 'done') return data;
    if (data.status === 'error') throw new Error(String(data.error).slice(-200));
    onStatus(`${data.status}… ${Math.round((performance.now() - t0) / 1000)}s`);
  }
}

async function renderTests(ids) {
  dom.testsStatus.textContent = '';
  for (const [k, id] of ids.entries()) {
    const note = (s) => { dom.testsStatus.textContent = `${id} (${k + 1}/${ids.length}): ${s}`; };
    try {
      await renderTest(id, dom.testsQuality.value, note);
    } catch (err) {
      showToast(`${id}: ${err.message}`);
    }
    await loadTests();
  }
  dom.testsStatus.textContent = 'done';
}

function renderTestsList() {
  const ids = Object.keys(testsData.shots);
  dom.testsList.innerHTML = ids.length ? '' :
    '<p style="color: var(--text-dim);">No test shots yet. Frame a view, then use "Save as test shot" in the capture dialog.</p>';
  ids.forEach((id) => {
    const s = testsData.shots[id];
    const renders = testsData.renders[id] || [];
    const pic = (r, label) => r ? `
      <a href="${esc(r.url)}" target="_blank" rel="noopener" style="flex: 1; min-width: 0; text-decoration: none; color: var(--text-dim); font-size: 0.7rem; text-align: center;"
         title="${esc(`${r.quality}, made ${r.made}; island built ${r.blend_built}; commit ${r.commit}${(r.uncommitted || []).length ? ` + ${r.uncommitted.length} uncommitted in world/src` : ''}`)}">
        <img loading="lazy" src="${esc(r.url)}?w=420" alt="${esc(label)}" style="width: 100%; border-radius: 6px; display: block;">
        ${esc(label)} · ${esc((r.made || '').replace('T', ' ').slice(5, 16))}
      </a>` : '';
    const card = document.createElement('div');
    card.className = 'control-section';
    card.innerHTML = `
      <div class="section-title">
        <span>${esc(id)}</span>
        <span class="control-val">${esc(s.island)} · ${esc(s.lens || '')}mm · ${esc(s.aspect || '')}</span>
      </div>
      <div style="display: flex; gap: 6px; margin-bottom: 8px;">
        ${pic(renders[0], 'latest') || '<span style="color: var(--text-dim); font-size: 0.8rem;">not rendered yet</span>'}
        ${pic(renders[1], 'before')}
      </div>
      <div style="display: flex; gap: 6px;">
        <button class="btn btn-primary btn-chip" data-act="render">🎞 Render</button>
        <button class="btn btn-chip" data-act="jump">🎯 Open in composer</button>
        <button class="btn btn-chip" data-act="delete" style="color: var(--accent-red);">✕ Delete</button>
      </div>`;
    card.addEventListener('click', (e) => {
      const act = e.target.closest('button')?.dataset.act;
      if (act === 'render') renderTests([id]);
      else if (act === 'jump') {
        applyBookShot(id, s);
        dom.testsModal.style.display = 'none';
      } else if (act === 'delete') deleteTest(id);
    });
    dom.testsList.appendChild(card);
  });
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

function applyBookShot(shotId, shot, { draft } = {}) {
  if (state.shotsData?.book) {
    state.activeBook = state.shotsData.book;
    if (dom.saveBookSelect) dom.saveBookSelect.value = state.activeBook;
    try { localStorage.setItem('daag.composer.activeBook', state.activeBook); } catch (_) {}
  }

  if (draft !== undefined) {
    state.draftId = draft;                  // one of your own shots, or a recent capture: keep the book-shot name as it is
  } else {
    const [baseId, variantId = ''] = shotId.split('/');
    state.shotId = baseId;
    dom.saveShotId.value = baseId;
    dom.saveVariant.value = variantId;
    state.draftId = null;                   // a book or test shot starts a new shot of your own
  }
  updateShotSwitch();

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

  if (shot.light) applyLightPreset(shot.light);

  if (shot.sun_from !== undefined) {
    state.sunAzimuth = shot.sun_from;
    dom.sunAzimuthSlider.value = shot.sun_from;
    dom.sunAzimuthVal.textContent = `${shot.sun_from}° · ${compassHeading(shot.sun_from)}`;
  }
  if (shot.sun_elev !== undefined) {
    state.sunElevation = shot.sun_elev;
    dom.sunElevationSlider.value = shot.sun_elev;
    dom.sunElevationVal.textContent = `${shot.sun_elev}°`;
  }
  if (shot.sun_scale !== undefined) {
    state.sunIntensity = Math.min(3, Math.max(0.2, 1.5 * shot.sun_scale));
    dom.sunIntensitySlider.value = state.sunIntensity;
    dom.sunIntensityVal.textContent = state.sunIntensity.toFixed(1);
  }
  if (shot.fog_scale !== undefined) {
    state.fogDensity = Math.min(100, Math.round(25 * shot.fog_scale));
    dom.fogDensitySlider.value = state.fogDensity;
    dom.fogDensityVal.textContent = `${state.fogDensity}%`;
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

function switchDockTab(tab) {
  document.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tab-content').forEach((tc) => (tc.style.display = 'none'));
  const activeEl = document.getElementById(`tab-${tab}`);
  if (activeEl) {
    activeEl.style.display = 'flex';
    activeEl.style.flexDirection = 'column';
  }
  if (dom.leftDock && dom.leftDock.classList.contains('collapsed')) {
    dom.leftDock.classList.remove('collapsed');
    dom.btnDockExpand.style.display = 'none';
  }
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
      switchDockTab(btn.dataset.tab);
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

  // Copy coordinates
  if (dom.btnCopyCoords) {
    dom.btnCopyCoords.addEventListener('click', async () => {
      const [cx, cy, cz] = threeToBlender(camera.position);
      const [tx, ty, tz] = threeToBlender(controls.target);
      const text = `cam: [${cx.toFixed(2)}, ${cy.toFixed(2)}, ${cz.toFixed(2)}], target: [${tx.toFixed(2)}, ${ty.toFixed(2)}, ${tz.toFixed(2)}]`;
      try {
        await navigator.clipboard.writeText(text);
        showToast('Camera coordinates copied to clipboard');
      } catch (_) {
        showToast(text);
      }
    });
  }

  // Sun & Environment Sliders
  dom.sunAzimuthSlider.addEventListener('input', (e) => {
    state.sunAzimuth = parseInt(e.target.value);
    dom.sunAzimuthVal.textContent = `${state.sunAzimuth}° · ${compassHeading(state.sunAzimuth)}`;
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
      applyLightPreset(btn.dataset.tod);
      dom.sunAzimuthSlider.value = state.sunAzimuth;
      dom.sunAzimuthVal.textContent = `${state.sunAzimuth}° · ${compassHeading(state.sunAzimuth)}`;
      dom.sunElevationSlider.value = state.sunElevation;
      dom.sunElevationVal.textContent = `${state.sunElevation}°`;
      updateSunPosition();
    });
  });

  // View Presets
  ['arche', 'paxos'].forEach((island) => {
    const el = document.getElementById(`btn-view-${island}`);
    if (el) {
      el.addEventListener('click', () => {
        if (state.island !== island) return loadIslandModel(island);
        flyCameraTo(blenderToThree(OVERVIEW[island].cam), blenderToThree(OVERVIEW[island].target), 1000);
      });
    }
  });

  // Toggle props from header
  if (dom.btnToggleProps) {
    dom.btnToggleProps.addEventListener('click', () => {
      switchDockTab('props');
    });
  }

  // Help modal controls
  if (dom.btnOpenHelp) {
    dom.btnOpenHelp.addEventListener('click', () => {
      if (dom.helpModal) dom.helpModal.style.display = 'flex';
    });
  }
  if (dom.btnCloseHelp) {
    dom.btnCloseHelp.addEventListener('click', () => {
      if (dom.helpModal) dom.helpModal.style.display = 'none';
    });
  }

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

  // Prop search input
  if (dom.propSearchInput) {
    dom.propSearchInput.addEventListener('input', (e) => {
      const activeChip = dom.propCategoryFilters.querySelector('.prop-filter-chip.active');
      const cat = activeChip ? activeChip.dataset.category : 'all';
      renderPropsCatalog(cat, e.target.value);
    });
  }

  // Prop Category Filter Chips
  dom.propCategoryFilters.addEventListener('click', (e) => {
    const chip = e.target.closest('.prop-filter-chip');
    if (!chip) return;
    dom.propCategoryFilters.querySelectorAll('.prop-filter-chip').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    renderPropsCatalog(chip.dataset.category, dom.propSearchInput ? dom.propSearchInput.value : '');
  });

  // Save Book Select change listener
  dom.saveBookSelect.addEventListener('change', (e) => {
    state.activeBook = e.target.value;
    try { localStorage.setItem('daag.composer.activeBook', state.activeBook); } catch (_) {}
  });

  // Capture & Compose Modal Controls
  document.getElementById('btn-quick-capture').addEventListener('click', async () => {
    await saveDraft().catch((err) => showToast(`Shot not saved: ${err.message}`));
    loadAttempts();
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
    const orig = dom.btnCopyPrompt.textContent;
    dom.btnCopyPrompt.textContent = '✓ Copied!';
    setTimeout(() => { dom.btnCopyPrompt.textContent = orig; }, 1500);
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
  [dom.propX, dom.propY, dom.propZ, dom.propYaw, dom.propScale].forEach((el) => el.addEventListener('change', applyPropInspector));
  document.getElementById('btn-prop-turn-left').addEventListener('click', () => turnSelectedProp(-90));
  document.getElementById('btn-prop-turn-right').addEventListener('click', () => turnSelectedProp(90));
  document.getElementById('btn-prop-drop').addEventListener('click', dropSelectedProp);
  dom.btnFlux.addEventListener('click', startFlux);
  dom.shotSwitch.addEventListener('change', (e) => (e.target.value ? switchDraft(e.target.value) : newShot()));
  document.getElementById('btn-new-shot').addEventListener('click', newShot);
  document.getElementById('btn-open-recent').addEventListener('click', () => {
    dom.recentModal.style.display = 'flex';
    renderRecent();
  });
  document.getElementById('btn-close-recent').addEventListener('click', () => { dom.recentModal.style.display = 'none'; });
  document.getElementById('btn-open-explorer').addEventListener('click', async () => {
    dom.explorerModal.style.display = 'flex';
    if (state.draftId) await saveDraft().catch(() => {});
    else await loadDrafts();
  });
  document.getElementById('btn-close-explorer').addEventListener('click', () => { dom.explorerModal.style.display = 'none'; });
  dom.shotNameInput.addEventListener('change', () => (state.draftId ? saveDraft() : null));
  [['render', 'renders'], ['flux', 'flux']].forEach(([id, kind]) => {
    document.getElementById(`${id}-prev`).addEventListener('click', () => { attempts.at[kind] += 1; showAttempts(kind); });
    document.getElementById(`${id}-next`).addEventListener('click', () => { attempts.at[kind] -= 1; showAttempts(kind); });
  });
  document.querySelectorAll('input[name="flux-source"]').forEach((r) => r.addEventListener('change', updateFluxSourceNote));
  document.getElementById('btn-save-test').addEventListener('click', saveTestShot);
  document.getElementById('btn-open-tests').addEventListener('click', () => {
    dom.testsModal.style.display = 'flex';
    loadTests();
  });
  document.getElementById('btn-close-tests').addEventListener('click', () => { dom.testsModal.style.display = 'none'; });
  document.getElementById('btn-render-all-tests').addEventListener('click', () => renderTests(Object.keys(testsData.shots)));
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
  // Turning is about up only (a shot records a yaw): the ring for that axis alone; move and scale show everything
  transformControls.showX = mode !== 'rotate';
  transformControls.showY = true;
  transformControls.showZ = mode !== 'rotate';
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
  // A click on a gizmo handle is the gizmo's, even where the handle lies outside the prop's outline
  if (transformControls.dragging || transformControls.axis) return;

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

  // Escape: close active modal, clear selection, or exit placement mode
  if (e.code === 'Escape') {
    if (dom.helpModal && dom.helpModal.style.display === 'flex') {
      dom.helpModal.style.display = 'none';
      return;
    }
    if (dom.castDrawer.classList.contains('open')) {
      dom.castDrawer.classList.remove('open');
      return;
    }
    if (!dom.captureModal.classList.contains('hidden')) {
      dom.captureModal.classList.add('hidden');
      return;
    }
    if (dom.shotsBrowserModal.style.display === 'flex') {
      dom.shotsBrowserModal.style.display = 'none';
      return;
    }
    if (dom.recentModal.style.display === 'flex') {
      dom.recentModal.style.display = 'none';
      return;
    }
    if (dom.explorerModal.style.display === 'flex') {
      dom.explorerModal.style.display = 'none';
      return;
    }
    if (dom.testsModal.style.display === 'flex') {
      dom.testsModal.style.display = 'none';
      return;
    }
    if (state.selectedPlacedProp) {
      selectPlacedProp(null);
      return;
    }
    if (state.placePropMode) {
      state.placePropMode = false;
      dom.btnPlacePropMode.classList.remove('active');
      dom.btnPlacePropMode.textContent = '🎯 Click Island to Place Prop';
      dom.hudStatusDot.classList.remove('placing');
      dom.hudStatusText.textContent = 'Aegean View Active';
      return;
    }
  }

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

  // Shortcuts: G = move, R = rotate, S = scale, 1/2/3 = tabs, ? = help
  if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
    if (e.code === 'Digit1') switchDockTab('camera');
    if (e.code === 'Digit2') switchDockTab('lighting');
    if (e.code === 'Digit3') switchDockTab('props');
    if (e.key === '?') {
      if (dom.helpModal) dom.helpModal.style.display = dom.helpModal.style.display === 'flex' ? 'none' : 'flex';
    }
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
