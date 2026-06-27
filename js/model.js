// =============================================================
//  3Dモデル構築：骨格 + 筋（筋束=fascicle ベースのリアル生成）
// =============================================================
import * as THREE from 'three';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import { L, MUSCLES } from './anatomyData.js';

const v = (p) => new THREE.Vector3(p[0], p[1], p[2]);
const resolve = (p) => Array.isArray(p) ? p.slice() : L[p].slice();
const mirror = (p) => [-p[0], p[1], p[2]];
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smoothstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
// 決定的ハッシュ（見た目を安定させる）
const hash = (x) => { const s = Math.sin(x * 127.1) * 43758.5453; return s - Math.floor(s); };

// ----- 色 ------------------------------------------------------
const BELLY_COL  = new THREE.Color(0xc8473a);  // 筋腹（赤）
const BELLY_DEEP = new THREE.Color(0xa02e28);  // 深部の陰
const TENDON_COL = new THREE.Color(0xe6d6b0);  // 腱（淡色）

// ----- マテリアル ----------------------------------------------
const BONE_MAT = new THREE.MeshStandardMaterial({
  color: 0xe8e0d0, roughness: 0.9, metalness: 0.0,
});
function muscleMaterial() {
  return new THREE.MeshPhysicalMaterial({
    vertexColors: true, roughness: 0.5, metalness: 0.0,
    sheen: 0.5, sheenColor: new THREE.Color(0xff6655), sheenRoughness: 0.6,
    clearcoat: 0.12, clearcoatRoughness: 0.5,
    side: THREE.DoubleSide, transparent: true, opacity: 1.0,
  });
}

// ----- 補助：骨用カプセル --------------------------------------
function capsuleBetween(a, b, r, mat) {
  const A = v(a), B = v(b);
  const len = Math.max(A.distanceTo(B), 0.01);
  const geo = new THREE.CapsuleGeometry(r, Math.max(len - 2 * r, 0.05), 6, 14);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(A).add(B).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  return mesh;
}

// =============================================================
//  筋束（1本のfascicle）を out バッファへ追記
//  紡錘形プロファイル＋腱の先細り＋楕円断面＋腱/筋腹の色分け
// =============================================================
function addStrand(pts, baseR, flat, out, seed) {
  const SEG = 16, RAD = 8;
  const curve = new THREE.CatmullRomCurve3(pts.map(v), false, 'catmullrom', 0.5);
  const frames = curve.computeFrenetFrames(SEG, false);
  const ringStart = out.pos.length / 3;
  const fiberShade = 0.86 + 0.14 * hash(seed * 1.7);    // 束ごとの陰影差→繊維感

  for (let i = 0; i <= SEG; i++) {
    const t = i / SEG;
    const p = curve.getPoint(t);
    const fi = Math.min(i, SEG - 1);
    const N = frames.normals[fi], B = frames.binormals[fi];
    // 紡錘形：両端は腱で細く、中央は筋腹で太い
    const belly = Math.pow(Math.sin(Math.PI * t), 0.62);
    const r = baseR * (0.14 + 0.86 * belly) * (0.92 + 0.16 * hash(seed + i));
    // 色：両端(腱)は淡色、中央は赤。深さでわずかに陰
    const tendon = 1 - smoothstep(0.0, 0.16, t) * smoothstep(0.0, 0.16, 1 - t);
    const col = TENDON_COL.clone().lerp(
      BELLY_COL.clone().lerp(BELLY_DEEP, 0.12 + 0.18 * hash(seed * 2.3)),
      1 - tendon
    ).multiplyScalar(fiberShade);

    for (let j = 0; j < RAD; j++) {
      const a = (j / RAD) * Math.PI * 2;
      const off = N.clone().multiplyScalar(Math.cos(a) * r * flat[0])
        .add(B.clone().multiplyScalar(Math.sin(a) * r * flat[1]));
      const vert = p.clone().add(off);
      const nrm = off.clone().normalize();
      out.pos.push(vert.x, vert.y, vert.z);
      out.nrm.push(nrm.x, nrm.y, nrm.z);
      out.col.push(col.r, col.g, col.b);
    }
  }
  for (let i = 0; i < SEG; i++) {
    for (let j = 0; j < RAD; j++) {
      const a = ringStart + i * RAD + j;
      const b = ringStart + i * RAD + (j + 1) % RAD;
      const c = ringStart + (i + 1) * RAD + j;
      const d = ringStart + (i + 1) * RAD + (j + 1) % RAD;
      out.idx.push(a, c, b, b, c, d);
    }
  }
}

// ----- 1筋の geometry（複数束を結合） -------------------------
function muscleGeometry(build, side) {
  const tf = (p) => side === 'R' ? mirror(resolve(p)) : resolve(p);
  const O = build.o.map(tf), I = build.i.map(tf);
  const n = build.n || 8, w = build.w || 0.6, flat = build.flat || [1, 1];
  let bulge = build.bulge || [0, 0, 0];
  if (side === 'R') bulge = [-bulge[0], bulge[1], bulge[2]];
  const fusiform = build.kind === 'fusiform';

  const oCurve = O.length > 1 ? new THREE.CatmullRomCurve3(O.map(v)) : null;
  const iCurve = I.length > 1 ? new THREE.CatmullRomCurve3(I.map(v)) : null;
  const out = { pos: [], nrm: [], col: [], idx: [] };

  for (let k = 0; k < n; k++) {
    const s = n > 1 ? k / (n - 1) : 0.5;
    let start = oCurve ? oCurve.getPoint(s).toArray() : O[0].slice();
    let end   = iCurve ? iCurve.getPoint(s).toArray() : I[0].slice();
    let strandR = w;

    if (fusiform) {
      // 束を軸まわりに散らして筋腹のボリュームを作る
      const axis = new THREE.Vector3().subVectors(v(end), v(start)).normalize();
      const up = Math.abs(axis.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
      const u = new THREE.Vector3().crossVectors(axis, up).normalize();
      const ww = new THREE.Vector3().crossVectors(axis, u).normalize();
      const ang = s * Math.PI * 2;
      const spread = w * 0.72;
      const ox = u.clone().multiplyScalar(Math.cos(ang) * spread * flat[0])
        .add(ww.clone().multiplyScalar(Math.sin(ang) * spread * flat[1]));
      start = [start[0] + ox.x * 0.35, start[1] + ox.y * 0.35, start[2] + ox.z * 0.35];
      end   = [end[0] + ox.x, end[1] + ox.y, end[2] + ox.z];
      strandR = w * 0.5;
    }

    const mid = [
      (start[0] + end[0]) / 2 + bulge[0],
      (start[1] + end[1]) / 2 + bulge[1],
      (start[2] + end[2]) / 2 + bulge[2],
    ];
    addStrand([start, mid, end], strandR, flat, out, k * 3.3 + (side === 'R' ? 137 : 0));
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(out.pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(out.nrm, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(out.col, 3));
  g.setIndex(out.idx);
  return g;
}

function buildOneMuscle(data, side) {
  const mesh = new THREE.Mesh(muscleGeometry(data.build, side), muscleMaterial());
  mesh.userData = { muscle: data, side };
  mesh.name = `${data.id}_${side}`;
  return mesh;
}

export function buildMuscles() {
  const group = new THREE.Group();
  group.name = 'muscles';
  const meshes = [];
  MUSCLES.forEach((m) => {
    const sides = m.side === 'both' ? ['L', 'R'] : ['L'];
    sides.forEach((s) => {
      const mesh = buildOneMuscle(m, s);
      group.add(mesh);
      meshes.push(mesh);
    });
  });
  return { group, meshes };
}

// =============================================================
//  骨格
// =============================================================
function buildSkeleton() {
  const g = new THREE.Group();
  g.name = 'skeleton';

  const skull = new THREE.Mesh(new THREE.SphereGeometry(8, 24, 20), BONE_MAT);
  skull.position.set(0, 162, -1.5); skull.scale.set(1, 1.15, 1.1); g.add(skull);
  const jaw = new THREE.Mesh(new THREE.SphereGeometry(5.5, 18, 14), BONE_MAT);
  jaw.position.set(0, 154, 1.5); jaw.scale.set(1, 0.7, 1.1); g.add(jaw);

  for (let y = 150; y >= 90; y -= 2.4) {
    const t = (150 - y) / 60;
    const z = -5 - 2.2 * Math.sin(t * Math.PI);
    const vert = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.6, 3.0), BONE_MAT);
    vert.position.set(0, y, z); g.add(vert);
  }

  for (let i = 0; i < 7; i++) {
    const y = 138 - i * 3;
    const z0 = -6 + i * 0.2;
    const w = 13 - Math.abs(i - 3) * 0.6;
    for (const s of [-1, 1]) {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, y, z0),
        new THREE.Vector3(s * w * 0.6, y - 1, 4),
        new THREE.Vector3(s * w, y - 3, 8),
        new THREE.Vector3(s * w * 0.5, y - 5, 9.5),
      ]);
      g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.6, 6), BONE_MAT));
    }
  }
  const sternum = new THREE.Mesh(new THREE.BoxGeometry(2.4, 22, 1.4), BONE_MAT);
  sternum.position.set(0, 129, 9); g.add(sternum);

  const pelvisPts = [
    L.iliacCrestL, L.asisL, L.ischiumL, L.sacrum, L.pubis, L.iliacPostL,
    mirror(L.iliacCrestL), mirror(L.asisL), mirror(L.ischiumL), mirror(L.iliacPostL),
    [0, 100, -2], [0, 86, 3],
  ].map((p) => v(p));
  g.add(new THREE.Mesh(new ConvexGeometry(pelvisPts), BONE_MAT));

  const bones = [
    ['clavInL', 'acromionL', 0.7], ['acromionL', 'scapInfL', 0.8], ['acromionL', 'scapMedL', 0.6],
    ['humHeadL', 'elbowL', 1.4], ['elbowL', 'wristL', 1.1],
    ['gtrochL', 'kneeL', 2.0], ['kneeL', 'ankleL', 1.6], ['ankleL', 'calcaneusL', 1.0],
  ];
  bones.forEach(([a, b, r]) => {
    g.add(capsuleBetween(resolve(a), resolve(b), r, BONE_MAT));
    g.add(capsuleBetween(mirror(resolve(a)), mirror(resolve(b)), r, BONE_MAT));
  });
  return g;
}

export function buildBody() {
  const root = new THREE.Group();
  const skeleton = buildSkeleton();
  const { group: muscles, meshes } = buildMuscles();
  root.add(skeleton);
  root.add(muscles);
  return { root, skeleton, muscles, muscleMeshes: meshes };
}
