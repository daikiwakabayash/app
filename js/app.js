// =============================================================
//  メインアプリ：シーン構築・操作・UI連携
// =============================================================
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildBody } from './model.js';
import { MUSCLES, REGIONS } from './anatomyData.js';

const HIGHLIGHT = 0xffd24a;
const DIM_OPACITY = 0.18;

let scene, camera, renderer, controls, raycaster, pointer;
let body, muscleMeshes = [];
let selected = null;
let activeRegion = 'all';
let searchTerm = '';
let muscleVisible = true;

// ---------------------------------------------------------------
function init() {
  const canvasWrap = document.getElementById('viewport');

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0e16);
  scene.fog = new THREE.Fog(0x0a0e16, 280, 520);

  camera = new THREE.PerspectiveCamera(38, canvasWrap.clientWidth / canvasWrap.clientHeight, 1, 1000);
  camera.position.set(0, 118, 230);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvasWrap.clientWidth, canvasWrap.clientHeight);
  canvasWrap.appendChild(renderer.domElement);

  // 照明
  scene.add(new THREE.HemisphereLight(0xd6e3ff, 0x33282a, 1.05));
  const key = new THREE.DirectionalLight(0xffffff, 1.15);
  key.position.set(60, 180, 160); scene.add(key);
  const rim = new THREE.DirectionalLight(0x88a0ff, 0.7);
  rim.position.set(-120, 120, -150); scene.add(rim);
  const fillFront = new THREE.DirectionalLight(0xfff2ee, 0.85);
  fillFront.position.set(0, 70, 200); scene.add(fillFront);
  const fillBack = new THREE.DirectionalLight(0xfff2ee, 0.7);
  fillBack.position.set(0, 70, -200); scene.add(fillBack);

  // 床（うっすら）
  const grid = new THREE.GridHelper(400, 20, 0x223047, 0x16202e);
  grid.position.y = 0; scene.add(grid);

  // 身体
  body = buildBody();
  body.root.position.y = -85;          // 視点中心を体幹へ
  scene.add(body.root);
  muscleMeshes = body.muscleMeshes;

  // コントロール
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 33, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 90;
  controls.maxDistance = 360;
  controls.update();

  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();

  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  bindCanvasClick();
  window.addEventListener('resize', onResize);

  buildList();
  buildRegionTabs();
  bindUI();
  applyFilters();
  animate();
}

// ---------------------------------------------------------------
function onResize() {
  const w = document.getElementById('viewport').clientWidth;
  const h = document.getElementById('viewport').clientHeight;
  camera.aspect = w / h; camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

let downXY = null;
function onPointerDown(e) { downXY = { x: e.clientX, y: e.clientY }; }

function bindCanvasClick() {
  // クリック（ドラッグでない）で選択
  document.addEventListener('pointerup', (e) => {
    if (!downXY) return;
    const moved = Math.hypot(e.clientX - downXY.x, e.clientY - downXY.y);
    downXY = null;
    if (moved > 6) return;                       // 回転操作は無視
    if (!renderer || e.target !== renderer.domElement) return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const visible = muscleMeshes.filter((m) => m.visible);
    const hits = raycaster.intersectObjects(visible, false);
    if (hits.length) selectMuscle(hits[0].object.userData.muscle.id);
    else selectMuscle(null);
  });
}

// ---------------------------------------------------------------
function selectMuscle(id) {
  selected = id;
  updateHighlights();
  updateInfoPanel();
  updateListSelection();
}

function updateHighlights() {
  muscleMeshes.forEach((m) => {
    const isSel = selected && m.userData.muscle.id === selected;
    const mat = m.material;
    if (!selected) {
      mat.emissive.setHex(0x000000);
      mat.opacity = 1.0;
      mat.color.setHex(0xffffff);           // 頂点カラー（繊維の陰影）をそのまま表示
    } else if (isSel) {
      mat.emissive.setHex(0x5a3300);
      mat.color.setHex(HIGHLIGHT);           // 頂点カラーに乗算→暖色ハイライト
      mat.opacity = 1.0;
    } else {
      mat.emissive.setHex(0x000000);
      mat.color.setHex(0xffffff);
      mat.opacity = DIM_OPACITY;
    }
  });
}

// ---------------------------------------------------------------
function updateInfoPanel() {
  const panel = document.getElementById('info');
  if (!selected) {
    panel.classList.remove('open');
    return;
  }
  const m = MUSCLES.find((x) => x.id === selected);
  panel.classList.add('open');
  panel.innerHTML = `
    <button class="info-close" aria-label="閉じる">×</button>
    <div class="info-head">
      <div class="info-title">${m.name}</div>
      <div class="info-latin">${m.latin}</div>
      <div class="info-region">${REGIONS[m.region]}</div>
    </div>
    <div class="info-body">
      ${row('起始', m.origin)}
      ${row('停止', m.insertion)}
      ${row('支配神経', m.nerve)}
      ${row('作用', m.action)}
      <div class="info-memo">
        <span class="memo-tag">整体メモ</span>
        <p>${m.memo}</p>
      </div>
    </div>`;
  panel.querySelector('.info-close').addEventListener('click', () => selectMuscle(null));
}
function row(label, val) {
  return `<div class="info-row"><span class="lbl">${label}</span><span class="val">${val}</span></div>`;
}

// ---------------------------------------------------------------
function buildRegionTabs() {
  const wrap = document.getElementById('regionTabs');
  const tabs = [['all', 'すべて'], ...Object.entries(REGIONS)];
  wrap.innerHTML = tabs.map(([k, label]) =>
    `<button class="rtab ${k === 'all' ? 'active' : ''}" data-region="${k}">${label}</button>`
  ).join('');
  wrap.querySelectorAll('.rtab').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeRegion = btn.dataset.region;
      wrap.querySelectorAll('.rtab').forEach((b) => b.classList.toggle('active', b === btn));
      applyFilters();
    });
  });
}

function buildList() {
  const list = document.getElementById('list');
  list.innerHTML = MUSCLES.map((m, i) => `
    <button class="litem" data-id="${m.id}">
      <span class="lidx">${i + 1}</span>
      <span class="lmain">
        <span class="lname">${m.name}</span>
        <span class="lsub">${REGIONS[m.region]}・${m.latin}</span>
      </span>
    </button>`).join('');
  list.querySelectorAll('.litem').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectMuscle(btn.dataset.id);
      focusOnMuscle(btn.dataset.id);
    });
  });
}

function updateListSelection() {
  document.querySelectorAll('.litem').forEach((b) =>
    b.classList.toggle('sel', b.dataset.id === selected));
}

// ---------------------------------------------------------------
function applyFilters() {
  const term = searchTerm.trim();
  // 3Dの可視性
  muscleMeshes.forEach((mesh) => {
    const m = mesh.userData.muscle;
    const okRegion = activeRegion === 'all' || m.region === activeRegion;
    mesh.visible = muscleVisible && okRegion;
  });
  // リストの可視性（検索 + 領域）
  document.querySelectorAll('.litem').forEach((btn) => {
    const m = MUSCLES.find((x) => x.id === btn.dataset.id);
    const okRegion = activeRegion === 'all' || m.region === activeRegion;
    const okTerm = !term ||
      m.name.includes(term) || m.latin.toLowerCase().includes(term.toLowerCase()) ||
      m.action.includes(term) || m.nerve.includes(term) || m.memo.includes(term);
    btn.style.display = (okRegion && okTerm) ? '' : 'none';
  });
  if (selected) {
    const sm = MUSCLES.find((x) => x.id === selected);
    if (sm && activeRegion !== 'all' && sm.region !== activeRegion) selectMuscle(null);
  }
  updateHighlights();
}

// ---------------------------------------------------------------
function focusOnMuscle(id) {
  const mesh = muscleMeshes.find((m) => m.userData.muscle.id === id && m.visible)
            || muscleMeshes.find((m) => m.userData.muscle.id === id);
  if (!mesh) return;
  const box = new THREE.Box3().setFromObject(mesh);
  const center = box.getCenter(new THREE.Vector3());
  // 緩やかにターゲット移動
  const start = controls.target.clone();
  const dur = 500;
  const begin = performance.now();
  function step(now) {
    const k = Math.min(1, (now - begin) / dur);
    const e = 1 - Math.pow(1 - k, 3);
    controls.target.lerpVectors(start, center, e);
    controls.update();
    if (k < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ---------------------------------------------------------------
function bindUI() {
  const search = document.getElementById('search');
  search.addEventListener('input', () => { searchTerm = search.value; applyFilters(); });
  document.getElementById('searchClear').addEventListener('click', () => {
    search.value = ''; searchTerm = ''; applyFilters();
  });

  document.getElementById('toggleMuscle').addEventListener('click', (e) => {
    muscleVisible = !muscleVisible;
    e.currentTarget.classList.toggle('off', !muscleVisible);
    e.currentTarget.textContent = muscleVisible ? '筋肉：表示' : '筋肉：非表示';
    applyFilters();
  });

  document.getElementById('btnFront').addEventListener('click', () => moveCamera(0, 118, 230));
  document.getElementById('btnBack').addEventListener('click', () => moveCamera(0, 118, -230));
  document.getElementById('btnReset').addEventListener('click', () => {
    selectMuscle(null);
    controls.target.set(0, 33, 0);
    moveCamera(0, 118, 230);
  });

  document.getElementById('panelToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('collapsed');
    setTimeout(onResize, 260);
  });
}

function moveCamera(x, y, z) {
  const start = camera.position.clone();
  const end = new THREE.Vector3(x, y, z);
  const begin = performance.now();
  const dur = 600;
  function step(now) {
    const k = Math.min(1, (now - begin) / dur);
    const e = 1 - Math.pow(1 - k, 3);
    camera.position.lerpVectors(start, end, e);
    controls.update();
    if (k < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ---------------------------------------------------------------
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

init();
