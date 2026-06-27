// =============================================================
//  3Dモデル構築：骨格 + 筋（手続き的生成）
// =============================================================
import * as THREE from 'three';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import { L, MUSCLES } from './anatomyData.js';

const v = (p) => new THREE.Vector3(p[0], p[1], p[2]);
const resolve = (p) => Array.isArray(p) ? p.slice() : L[p].slice();
const mirror = (p) => [-p[0], p[1], p[2]];

// ----- マテリアル ----------------------------------------------
const BONE_MAT = new THREE.MeshStandardMaterial({
  color: 0xe8e0d0, roughness: 0.85, metalness: 0.0,
});
function muscleMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0xb23a36, roughness: 0.55, metalness: 0.05,
    emissive: 0x000000, transparent: true, opacity: 0.96,
  });
}

// ----- ジオメトリ補助 ------------------------------------------
function capsuleBetween(a, b, r, mat) {
  const A = v(a), B = v(b);
  const len = Math.max(A.distanceTo(B), 0.01);
  const geo = new THREE.CapsuleGeometry(r, Math.max(len - 2 * r, 0.05), 6, 14);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(A).add(B).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    B.clone().sub(A).normalize()
  );
  return mesh;
}

function sheetGeometry(pts, bulge) {
  const cloud = [];
  const bx = bulge[0], by = bulge[1], bz = bulge[2];
  pts.forEach((p) => {
    cloud.push(new THREE.Vector3(p[0], p[1], p[2]));
    cloud.push(new THREE.Vector3(p[0] + bx, p[1] + by, p[2] + bz));
    cloud.push(new THREE.Vector3(p[0] - bx * 0.25, p[1] - by * 0.25, p[2] - bz * 0.25));
  });
  return new ConvexGeometry(cloud);
}

// ----- 骨格 ----------------------------------------------------
function buildSkeleton() {
  const g = new THREE.Group();
  g.name = 'skeleton';

  // 頭蓋
  const skull = new THREE.Mesh(new THREE.SphereGeometry(8, 24, 20), BONE_MAT);
  skull.position.set(0, 162, -1.5);
  skull.scale.set(1, 1.15, 1.1);
  g.add(skull);
  const jaw = new THREE.Mesh(new THREE.SphereGeometry(5.5, 18, 14), BONE_MAT);
  jaw.position.set(0, 154, 1.5); jaw.scale.set(1, 0.7, 1.1);
  g.add(jaw);

  // 脊柱（椎骨を積む）
  for (let y = 150; y >= 90; y -= 2.4) {
    const t = (150 - y) / 60;
    const z = -5 - 2.2 * Math.sin(t * Math.PI);          // 生理的弯曲
    const vert = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.6, 3.0), BONE_MAT);
    vert.position.set(0, y, z);
    g.add(vert);
  }

  // 胸郭（肋骨弓）
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
      const rib = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.6, 6), BONE_MAT);
      g.add(rib);
    }
  }
  // 胸骨
  const sternum = new THREE.Mesh(new THREE.BoxGeometry(2.4, 22, 1.4), BONE_MAT);
  sternum.position.set(0, 129, 9);
  g.add(sternum);

  // 骨盤
  const pelvisPts = [
    L.iliacCrestL, L.asisL, L.ischiumL, L.sacrum, L.pubis, L.iliacPostL,
    mirror(L.iliacCrestL), mirror(L.asisL), mirror(L.ischiumL), mirror(L.iliacPostL),
    [0, 100, -2], [0, 86, 3],
  ].map((p) => v(p));
  const pelvis = new THREE.Mesh(new ConvexGeometry(pelvisPts), BONE_MAT);
  g.add(pelvis);

  // 四肢・肩甲帯（カプセル）
  const bones = [
    // 鎖骨・肩甲骨
    ['clavInL', 'acromionL', 0.7], ['acromionL', 'scapInfL', 0.8],
    ['acromionL', 'scapMedL', 0.6],
    // 上肢
    ['humHeadL', 'elbowL', 1.4], ['elbowL', 'wristL', 1.1],
    // 下肢
    ['gtrochL', 'kneeL', 2.0], ['kneeL', 'ankleL', 1.6],
    ['ankleL', 'calcaneusL', 1.0],
  ];
  bones.forEach(([a, b, r]) => {
    g.add(capsuleBetween(resolve(a), resolve(b), r, BONE_MAT));
    g.add(capsuleBetween(mirror(resolve(a)), mirror(resolve(b)), r, BONE_MAT));
  });

  return g;
}

// ----- 筋 ------------------------------------------------------
function buildOneMuscle(data, side /* 'L' | 'R' */) {
  const b = data.build;
  const tf = (p) => side === 'R' ? mirror(resolve(p)) : resolve(p);
  const bulge = b.bulge || [0, 0, 0];
  const mat = muscleMaterial();
  let mesh;
  if (b.type === 'spindle') {
    const a = tf(b.pts[0]), c = tf(b.pts[1]);
    mesh = capsuleBetween(a, c, b.r || 1.5, mat);
  } else {
    const pts = b.pts.map(tf);
    const bg = side === 'R' ? [-bulge[0], bulge[1], bulge[2]] : bulge;
    mesh = new THREE.Mesh(sheetGeometry(pts, bg), mat);
  }
  mesh.userData = { muscle: data, side, baseColor: 0xb23a36 };
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

export function buildBody() {
  const root = new THREE.Group();
  const skeleton = buildSkeleton();
  const { group: muscles, meshes } = buildMuscles();
  root.add(skeleton);
  root.add(muscles);
  return { root, skeleton, muscles, muscleMeshes: meshes };
}
