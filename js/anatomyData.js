// =============================================================
//  解剖データ（解剖学的根拠：Gray's Anatomy / Netter / Kendall「筋・機能とテスト」）
//  座標系: Y=上方, +Z=前方(腹側), X=被験者の左(負)〜右(正)
//  単位: おおよそ cm（身長 ~170）
//  ※ 左右対の筋は被験者「左側(負のX)」で定義し、描画側で反転して右を生成
// =============================================================

// --- 骨格ランドマーク（attachment landmarks） -----------------
export const L = {
  // 頭頸部・脊柱（正中: x=0）
  vertex:     [0, 172, 0],
  occiput:    [0, 160, -7],
  nuchal:     [0, 159, -6],
  mastoidL:   [-5, 158, -3.5],
  c1:         [0, 150, -5],
  c4:         [0, 146, -5.5],
  c7:         [0, 144, -6],
  t1:         [0, 142, -6.5],
  t3:         [0, 135, -7],
  t7:         [0, 126, -7],
  t12:        [0, 114, -7],
  l1:         [0, 112, -7],
  l3:         [0, 104, -7],
  l5:         [0, 97, -6.5],
  sacrum:     [0, 92, -6],
  coccyx:     [0, 86, -5],

  // 体幹前面（正中）
  manubrium:  [0, 140, 9],
  sternumMid: [0, 128, 9],
  xiphoid:    [0, 118, 8],
  pubis:      [0, 90, 5],
  rib6L:      [-7, 122, 7],
  rib10L:     [-9, 110, 4.5],

  // 肩・上肢（左）
  clavInL:    [-3, 142.5, 8],     // 鎖骨胸骨端
  clavMidL:   [-10, 143, 6],      // 鎖骨外側
  acromionL:  [-17, 143, 1],      // 肩峰
  scapSpineL: [-13, 141, -6],     // 肩甲棘
  scapUpperL: [-11, 140, -6],     // 上角
  scapMedL:   [-10, 131, -6.5],   // 内側縁
  scapInfL:   [-12, 121, -6],     // 下角
  humHeadL:   [-17, 140, -1],     // 上腕骨頭
  deltTubL:   [-18.5, 122, 2],    // 三角筋粗面
  bicepTubL:  [-18, 105, 4],      // 橈骨粗面
  humLatEpiL: [-19, 107, 1],      // 外側上顆
  humMedEpiL: [-15, 107, 1],      // 内側上顆
  olecranonL: [-18, 106, -2],     // 肘頭
  elbowL:     [-18, 107, 2],
  wristL:     [-21, 80, 4],

  // 骨盤・下肢（左）
  iliacCrestL:[-13, 99, -2],      // 腸骨稜
  iliacPostL: [-8, 96, -5],       // 腸骨翼後部（殿筋線後方）
  iliacAlaL:  [-13, 97, 0],       // 腸骨翼外面
  asisL:      [-12, 96, 6],       // 上前腸骨棘
  aiisL:      [-10, 93, 6],       // 下前腸骨棘
  ischiumL:   [-7, 81, -5],       // 坐骨結節
  gtrochL:    [-16, 88, -1],      // 大転子
  ltrochL:    [-6, 84, 2],        // 小転子
  glutTubL:   [-12, 80, -3],      // 殿筋粗面（大腿骨）
  femurMidL:  [-10, 66, 0],
  itKneeL:    [-11, 50, 1],       // 腸脛靭帯停止（外側）
  kneeL:      [-9, 47, 2],
  medCondyleL:[-11, 47, -1],      // 大腿骨内側顆
  latCondyleL:[-7, 47, -1],       // 大腿骨外側顆
  tibTubL:    [-9, 44, 5],        // 脛骨粗面
  tibMedL:    [-10, 42, 3],       // 脛骨内側（鵞足）
  fibHeadL:   [-12, 45, 1],       // 腓骨頭
  ankleL:     [-8, 9, 0],
  calcaneusL: [-8, 3, -5],        // 踵骨隆起
};

// --- 領域定義 -------------------------------------------------
export const REGIONS = {
  neck:  '頸部',
  shoulder: '肩・上肢',
  back:  '背部',
  trunk: '体幹',
  hip:   '殿部・下肢',
};

// --- 筋データ（解剖学的根拠あり） -----------------------------
// build.type: 'sheet'(扁平・幅広) / 'spindle'(紡錘状)
// build.pts : ランドマーク or 座標。sheet は多角形、spindle は2点
// bulge     : 筋腹の膨らみ方向ベクトル
export const MUSCLES = [
  {
    id: 'trapezius', name: '僧帽筋', latin: 'M. trapezius',
    region: 'back', side: 'both',
    origin: '外後頭隆起・項靭帯、第7頸椎〜第12胸椎の棘突起',
    insertion: '鎖骨外側1/3、肩峰、肩甲棘',
    nerve: '副神経（第XI脳神経）、頸神経叢の枝（C3–C4）',
    action: '肩甲骨の挙上・内転・下制、上方回旋（肩関節外転の補助）',
    memo: '肩こりの主因筋。上部線維の過緊張は頭板状筋・肩甲挙筋と連動。施術では起始(後頭〜項)と停止(肩峰)の張力差を確認。',
    build: { kind:'fan', o:['occiput','c7','t3','t12'], i:['clavMidL','acromionL','scapSpineL'], n:24, w:1.0, bulge:[0,0,-1.6] },
  },
  {
    id: 'latissimus', name: '広背筋', latin: 'M. latissimus dorsi',
    region: 'back', side: 'both',
    origin: '第7胸椎〜第5腰椎棘突起、胸腰筋膜、腸骨稜、下位肋骨（第9–12）、肩甲骨下角',
    insertion: '上腕骨小結節稜（結節間溝底）',
    nerve: '胸背神経（C6–C8）',
    action: '肩関節の伸展・内転・内旋（体幹引き上げ）',
    memo: '体幹と上肢をつなぐ最大の背筋。胸腰筋膜を介し殿部・腰部と連鎖。猫背・巻き肩の評価で重要。',
    build: { kind:'fan', o:['t7','t12','l3','l5','iliacCrestL'], i:['humHeadL'], n:26, w:0.92, bulge:[0,0,-1.4] },
  },
  {
    id: 'erector', name: '脊柱起立筋', latin: 'Mm. erector spinae',
    region: 'back', side: 'both',
    origin: '仙骨後面、腸骨稜、腰椎棘突起、胸腰筋膜（総腱）',
    insertion: '肋骨角、胸腰椎の横突起・棘突起、後頭骨（乳様突起；最長筋頭部）',
    nerve: '脊髄神経後枝',
    action: '脊柱の伸展、一側で側屈・回旋、姿勢保持',
    memo: '腸肋筋・最長筋・棘筋の総称。腰痛で最も触診される。左右差・過緊張を棘突起外側で確認。',
    build: { kind:'fusiform', o:[[-4.5,91,-6]], i:[[-4.5,137,-6.5]], n:8, w:2.3, flat:[1.5,0.9], bulge:[0,0,0.3] },
  },
  {
    id: 'splenius', name: '頭板状筋', latin: 'M. splenius capitis',
    region: 'neck', side: 'both',
    origin: '項靭帯下部、第7頸椎〜第3胸椎の棘突起',
    insertion: '側頭骨乳様突起、後頭骨上項線の外側部',
    nerve: '脊髄神経後枝（C2–C4の外側枝）',
    action: '頭頸部の伸展、同側への回旋・側屈',
    memo: '画像例の筋。起始は C7椎骨付近の棘突起。寝違え・頸部痛で胸鎖乳突筋と対で評価する。',
    build: { kind:'fusiform', o:['t3'], i:['mastoidL'], n:5, w:1.5, flat:[1.3,0.8], bulge:[0,0,-0.8] },
  },
  {
    id: 'levator', name: '肩甲挙筋', latin: 'M. levator scapulae',
    region: 'neck', side: 'both',
    origin: '第1〜第4頸椎の横突起',
    insertion: '肩甲骨上角〜内側縁上部',
    nerve: '肩甲背神経（C4–C5）、頸神経（C3–C4）',
    action: '肩甲骨の挙上・下方回旋、頸部の同側側屈',
    memo: '「首の付け根のこり」の代表筋。肩甲骨上角の停止部に圧痛が出やすい。',
    build: { kind:'fusiform', o:['c1'], i:['scapUpperL'], n:4, w:1.0, bulge:[-0.5,0,-0.8] },
  },
  {
    id: 'scm', name: '胸鎖乳突筋', latin: 'M. sternocleidomastoideus',
    region: 'neck', side: 'both',
    origin: '胸骨柄前面、鎖骨内側1/3',
    insertion: '側頭骨乳様突起、後頭骨上項線の外側',
    nerve: '副神経（第XI脳神経）、頸神経叢（C2–C3）',
    action: '一側で頭部の対側回旋・同側側屈、両側で頸部屈曲',
    memo: 'むち打ち・頭位異常で硬くなる。前頸部の触知しやすい筋。施術は神経・血管に注意し愛護的に。',
    build: { kind:'fusiform', o:['clavInL'], i:['mastoidL'], n:6, w:1.2, flat:[1,1.1], bulge:[0,0,1.3] },
  },
  {
    id: 'rhomboid', name: '菱形筋', latin: 'Mm. rhomboidei',
    region: 'back', side: 'both',
    origin: '第7頸椎〜第5胸椎の棘突起（小菱形筋 C7–T1／大菱形筋 T2–T5）',
    insertion: '肩甲骨内側縁',
    nerve: '肩甲背神経（C4–C5）',
    action: '肩甲骨の内転・挙上・下方回旋',
    memo: '巻き肩で引き伸ばされ弱化しやすい。僧帽筋中部の深層。肩甲骨内側縁の痛みで着目。',
    build: { kind:'fan', o:['c7','t3'], i:['scapUpperL','scapMedL','scapInfL'], n:12, w:0.6, bulge:[0,0,-0.9] },
  },
  {
    id: 'deltoid', name: '三角筋', latin: 'M. deltoideus',
    region: 'shoulder', side: 'both',
    origin: '鎖骨外側1/3、肩峰、肩甲棘',
    insertion: '上腕骨三角筋粗面',
    nerve: '腋窩神経（C5–C6）',
    action: '肩関節外転（前部：屈曲・内旋／後部：伸展・外旋）',
    memo: '前部・中部・後部で作用が異なる。四十肩で可動域評価の起点。',
    build: { kind:'fan', o:['clavMidL','acromionL','scapSpineL'], i:['deltTubL'], n:20, w:0.82, bulge:[-1.7,-0.3,0.2] },
  },
  {
    id: 'pecmajor', name: '大胸筋', latin: 'M. pectoralis major',
    region: 'trunk', side: 'both',
    origin: '鎖骨内側1/2、胸骨、第1–6肋軟骨、腹直筋鞘前葉',
    insertion: '上腕骨大結節稜',
    nerve: '内側・外側胸筋神経（C5–T1）',
    action: '肩関節の内転・内旋・屈曲（水平内転）',
    memo: '短縮すると巻き肩を助長。背部筋とのバランスで姿勢を評価。',
    build: { kind:'fan', o:['clavInL','manubrium','sternumMid','rib6L'], i:['humHeadL'], n:22, w:0.82, bulge:[0,0,2.0] },
  },
  {
    id: 'rectusabd', name: '腹直筋', latin: 'M. rectus abdominis',
    region: 'trunk', side: 'both',
    origin: '恥骨結合・恥骨稜',
    insertion: '第5–7肋軟骨、剣状突起',
    nerve: '肋間神経（T5–T12）',
    action: '体幹（腰椎）の屈曲、腹圧上昇、骨盤後傾',
    memo: '腱画により分節する。腰椎前弯・反り腰の評価で腸腰筋と対比。',
    build: { kind:'fusiform', o:[[-3,90.5,5.5]], i:[[-3,119,8]], n:5, w:1.7, flat:[1.5,0.55], bulge:[0,0,0.8] },
  },
  {
    id: 'obliqueext', name: '外腹斜筋', latin: 'M. obliquus externus abdominis',
    region: 'trunk', side: 'both',
    origin: '第5–12肋骨外面',
    insertion: '腸骨稜前部、鼠径靭帯、白線',
    nerve: '肋間神経（T7–T12）、腸骨下腹神経・腸骨鼠径神経',
    action: '体幹の屈曲、同側側屈、対側回旋',
    memo: '回旋系の動作評価で重要。骨盤の安定に寄与。',
    build: { kind:'fan', o:['rib6L','rib10L'], i:['asisL','pubis'], n:14, w:0.62, bulge:[0,0,1.4] },
  },
  {
    id: 'glutmax', name: '大殿筋', latin: 'M. gluteus maximus',
    region: 'hip', side: 'both',
    origin: '腸骨翼後部（後殿筋線後方）、仙骨・尾骨後面、仙結節靭帯、胸腰筋膜',
    insertion: '腸脛靭帯、大腿骨殿筋粗面',
    nerve: '下殿神経（L5–S2）',
    action: '股関節の伸展・外旋（上部線維は外転）',
    memo: '人体最大の筋。弱化で腰部代償が起こりやすい。歩行・立ち上がりの推進力。',
    build: { kind:'fan', o:['iliacPostL','sacrum','coccyx'], i:['glutTubL','itKneeL'], n:22, w:1.15, bulge:[0,0,-2.3] },
  },
  {
    id: 'glutmed', name: '中殿筋', latin: 'M. gluteus medius',
    region: 'hip', side: 'both',
    origin: '腸骨翼外面（前・後殿筋線の間）',
    insertion: '大腿骨大転子の外側面',
    nerve: '上殿神経（L4–S1）',
    action: '股関節の外転（前部：内旋・屈曲／後部：外旋・伸展）、片脚立位の骨盤水平保持',
    memo: '弱化でトレンデレンブルグ徴候・腰痛。歩行安定の鍵。大転子上方を触診。',
    build: { kind:'fan', o:['asisL','iliacAlaL','iliacCrestL'], i:['gtrochL'], n:14, w:0.72, bulge:[-1.9,0,-0.4] },
  },
  {
    id: 'iliopsoas', name: '腸腰筋', latin: 'M. iliopsoas',
    region: 'hip', side: 'both',
    origin: '大腰筋：第12胸椎〜第4腰椎の椎体・肋骨突起／腸骨筋：腸骨窩',
    insertion: '大腿骨小転子',
    nerve: '大腰筋：腰神経叢（L1–L3）／腸骨筋：大腿神経（L2–L4）',
    action: '股関節の屈曲・外旋、腰椎前弯の保持',
    memo: '反り腰・腰痛の中核。短縮すると骨盤前傾。深層のため間接的アプローチが基本。',
    build: { kind:'fusiform', o:['l1','l3'], i:['ltrochL'], n:7, w:1.6, bulge:[-0.5,0,1.3] },
  },
  {
    id: 'quadratus', name: '腰方形筋', latin: 'M. quadratus lumborum',
    region: 'trunk', side: 'both',
    origin: '腸骨稜、腸腰靭帯',
    insertion: '第12肋骨、第1–4腰椎の肋骨突起（横突起）',
    nerve: '腰神経叢の枝（T12–L4）',
    action: '腰椎の側屈、第12肋骨の下制、骨盤の挙上',
    memo: '一側性腰痛の代表。デスクワークの側屈姿勢で過緊張。腸骨稜と第12肋骨の間を評価。',
    build: { kind:'fan', o:['iliacCrestL'], i:['t12','l3'], n:6, w:0.5, bulge:[0,0,-0.6] },
  },
  {
    id: 'quadriceps', name: '大腿四頭筋', latin: 'M. quadriceps femoris',
    region: 'hip', side: 'both',
    origin: '大腿直筋：下前腸骨棘・寛骨臼上縁／広筋群：大腿骨前面・粗線',
    insertion: '膝蓋骨を経て膝蓋靭帯→脛骨粗面',
    nerve: '大腿神経（L2–L4）',
    action: '膝関節の伸展（大腿直筋は股関節屈曲も）',
    memo: '膝痛・歩行で重要。大腿直筋は二関節筋で骨盤前傾と連動。',
    build: { kind:'fusiform', o:['aiisL'], i:['tibTubL'], n:12, w:2.9, flat:[1.1,1.0], bulge:[0,0,2.2] },
  },
  {
    id: 'hamstrings', name: 'ハムストリングス', latin: 'Mm. ischiocrurales',
    region: 'hip', side: 'both',
    origin: '坐骨結節（大腿二頭筋短頭のみ大腿骨粗線）',
    insertion: '腓骨頭（大腿二頭筋）、脛骨内側面（半腱様筋・半膜様筋）',
    nerve: '坐骨神経（脛骨神経部 L5–S2／二頭筋短頭は総腓骨神経部）',
    action: '膝関節の屈曲、股関節の伸展',
    memo: '短縮で骨盤後傾・腰痛、SLR制限。坐骨神経痛との鑑別に留意。',
    build: { kind:'fusiform', o:['ischiumL'], i:['fibHeadL','tibMedL'], n:10, w:2.4, bulge:[0,0,-1.9] },
  },
  {
    id: 'gastroc', name: '腓腹筋', latin: 'M. gastrocnemius',
    region: 'hip', side: 'both',
    origin: '大腿骨内側顆・外側顆（後面）',
    insertion: 'アキレス腱を経て踵骨隆起',
    nerve: '脛骨神経（S1–S2）',
    action: '足関節の底屈、膝関節の屈曲',
    memo: '二関節筋。こむら返り・足のむくみで着目。アキレス腱との移行部を評価。',
    build: { kind:'fusiform', o:['medCondyleL','latCondyleL'], i:[[-8.5,22,-2.5]], n:9, w:2.2, bulge:[0,0,-1.7] },
  },
];
