/* ===== 三维食堂大厅：Three.js =====
   构成：地板墙体、三个打饭窗口（带中文招牌）、菜品、四组餐桌椅、
   灯光、悬浮旋转的"招牌碗"、蒸汽动画，支持旋转/缩放/点击窗口。 */

(function () {
  var container = document.getElementById('three-box');
  var W = container.clientWidth, H = container.clientHeight;

  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0xeaf2fb);
  scene.fog = new THREE.Fog(0xeaf2fb, 40, 90);

  var camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 200);
  camera.position.set(16, 13, 20);

  var renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  // ---------- 灯光 ----------
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  var lamp1 = new THREE.PointLight(0xfff3e0, 0.9, 60);
  lamp1.position.set(-8, 9, 2);
  scene.add(lamp1);
  var lamp2 = new THREE.PointLight(0xfff3e0, 0.9, 60);
  lamp2.position.set(8, 9, 2);
  scene.add(lamp2);
  var dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
  dirLight.position.set(10, 18, 12);
  scene.add(dirLight);

  // ---------- 地板 ----------
  var floor = new THREE.Mesh(
    new THREE.BoxGeometry(32, 0.4, 24),
    new THREE.MeshStandardMaterial({ color: 0xd7b894, roughness: 0.9 })
  );
  floor.position.y = -0.2;
  floor.receiveShadow = true;
  scene.add(floor);

  // 地面格子线（地砖效果）
  var grid = new THREE.GridHelper(32, 16, 0xc4a477, 0xe7d3b5);
  grid.position.y = 0.02;
  scene.add(grid);

  // ---------- 墙体 ----------
  var wallMat = new THREE.MeshStandardMaterial({ color: 0xfdf6ec, roughness: 0.9 });
  var backWall = new THREE.Mesh(new THREE.BoxGeometry(32, 9, 0.4), wallMat);
  backWall.position.set(0, 4.5, -12);
  scene.add(backWall);
  var leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 9, 24), wallMat);
  leftWall.position.set(-16, 4.5, 0);
  scene.add(leftWall);
  var rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 9, 24), wallMat);
  rightWall.position.set(16, 4.5, 0);
  scene.add(rightWall);

  // ---------- 中文招牌纹理 ----------
  function makeSignTexture(text, bg) {
    var cv = document.createElement('canvas');
    cv.width = 256; cv.height = 96;
    var ctx = cv.getContext('2d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 256, 96);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 40px "Microsoft YaHei"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 48);
    return new THREE.CanvasTexture(cv);
  }

  // ---------- 三个打饭窗口 ----------
  var counters = [
    { name: '馨香苑', x: -9, color: 0xe8590c, sign: '#d9480f', info: '第一食堂 · 川菜与大众快餐，招牌：鱼香肉丝、土豆烧牛肉' },
    { name: '知味居', x: 0, color: 0x1971c2, sign: '#1864ab', info: '第二食堂 · 面食与小吃，招牌：牛肉拉面、煎饼果子' },
    { name: '清风堂', x: 9, color: 0x2f9e44, sign: '#2b8a3e', info: '第三食堂 · 清真与轻食，招牌：手抓羊肉饭、鸡胸肉沙拉' }
  ];
  var clickTargets = [];

  counters.forEach(function (c) {
    var group = new THREE.Group();

    // 柜台
    var counter = new THREE.Mesh(
      new THREE.BoxGeometry(6.4, 1.2, 1.6),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 })
    );
    counter.position.set(c.x, 0.6, -9.6);
    counter.castShadow = true;
    counter.receiveShadow = true;
    counter.userData.info = c.info;
    group.add(counter);
    clickTargets.push(counter);

    // 彩色挡板
    var panel = new THREE.Mesh(
      new THREE.BoxGeometry(6.4, 2.2, 0.2),
      new THREE.MeshStandardMaterial({ color: c.color, roughness: 0.7 })
    );
    panel.position.set(c.x, 2.3, -10.3);
    group.add(panel);

    // 中文招牌
    var sign = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 1.3, 0.15),
      new THREE.MeshStandardMaterial({ map: makeSignTexture(c.name, c.sign), emissive: 0x333333 })
    );
    sign.position.set(c.x, 4.4, -10.2);
    sign.userData.info = c.info;
    group.add(sign);
    clickTargets.push(sign);

    // 柜台上的餐盘（圆盘）+ 食物（小球）
    for (var i = 0; i < 3; i++) {
      var plate = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.32, 0.06, 24),
        new THREE.MeshStandardMaterial({ color: 0xf1f3f5, roughness: 0.4 })
      );
      plate.position.set(c.x - 1.8 + i * 1.8, 1.25, -9.6);
      group.add(plate);

      var food = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 20, 16),
        new THREE.MeshStandardMaterial({ color: [0xff8787, 0xffd43b, 0x69db7c][i], roughness: 0.8 })
      );
      food.position.set(c.x - 1.8 + i * 1.8, 1.45, -9.6);
      group.add(food);
    }
    scene.add(group);
  });

  // ---------- 餐桌椅 ----------
  function addTable(x, z) {
    var g = new THREE.Group();
    // 桌面
    var top = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 1.1, 0.12, 32),
      new THREE.MeshStandardMaterial({ color: 0xadb5bd, metalness: 0.3, roughness: 0.5 })
    );
    top.position.y = 1.0;
    top.castShadow = true;
    g.add(top);
    // 支柱
    var pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.09, 1.0, 16),
      new THREE.MeshStandardMaterial({ color: 0x868e96, metalness: 0.4 })
    );
    pole.position.y = 0.5;
    g.add(pole);
    // 底盘
    var base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 0.08, 24),
      new THREE.MeshStandardMaterial({ color: 0x868e96, metalness: 0.4 })
    );
    base.position.y = 0.04;
    g.add(base);
    // 四个方凳
    var seatPos = [[0, 1.6], [0, -1.6], [1.6, 0], [-1.6, 0]];
    seatPos.forEach(function (p) {
      var stool = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.1, 0.6),
        new THREE.MeshStandardMaterial({ color: 0xe8590c, roughness: 0.7 })
      );
      stool.position.set(p[0], 0.55, p[1]);
      g.add(stool);
      var leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 0.5, 10),
        new THREE.MeshStandardMaterial({ color: 0x868e96 })
      );
      leg.position.set(p[0], 0.28, p[1]);
      g.add(leg);
    });
    g.position.set(x, 0, z);
    scene.add(g);
  }
  addTable(-7, -1);
  addTable(7, -1);
  addTable(-7, 6);
  addTable(7, 6);

  // ---------- 悬浮旋转的"招牌碗" ----------
  var bowlGroup = new THREE.Group();
  var bowl = new THREE.Mesh(
    new THREE.SphereGeometry(0.9, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0xfff9db, side: THREE.DoubleSide, roughness: 0.5 })
  );
  bowl.rotation.x = Math.PI;
  bowlGroup.add(bowl);
  // 碗里的面条
  var noodle = new THREE.Mesh(
    new THREE.TorusGeometry(0.55, 0.08, 12, 40),
    new THREE.MeshStandardMaterial({ color: 0xf59f00, roughness: 0.8 })
  );
  noodle.rotation.x = Math.PI / 2;
  noodle.position.y = 0.05;
  bowlGroup.add(noodle);
  // 一双筷子
  for (var k = 0; k < 2; k++) {
    var stick = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 2.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x8d5524 })
    );
    stick.position.set(k === 0 ? -0.12 : 0.12, 0.5, 0);
    stick.rotation.z = 0.35;
    bowlGroup.add(stick);
  }
  bowlGroup.position.set(0, 6.6, 2);
  scene.add(bowlGroup);

  // ---------- 蒸汽（上升的半透明小球） ----------
  var steams = [];
  for (var s = 0; s < 3; s++) {
    var sm = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 })
    );
    sm.userData = { x: counters[s].x, offset: s * 0.9 };
    scene.add(sm);
    steams.push(sm);
  }

  // ---------- 交互：OrbitControls + 点击窗口 ----------
  var controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.target.set(0, 2, -4);
  controls.maxPolarAngle = Math.PI / 2.05;
  controls.minDistance = 8;
  controls.maxDistance = 45;

  var raycaster = new THREE.Raycaster();
  var mouse = new THREE.Vector2();
  renderer.domElement.addEventListener('click', function (e) {
    var rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    var hits = raycaster.intersectObjects(clickTargets);
    var info = document.getElementById('pick-info');
    if (hits.length > 0 && hits[0].object.userData.info) {
      info.textContent = '🍽 ' + hits[0].object.userData.info;
      info.className = 'alert alert-warning d-inline-block mt-2 mb-0';
    }
  });

  // ---------- 动画 ----------
  var clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    var t = clock.getElapsedTime();
    bowlGroup.rotation.y = t * 0.6;             // 招牌碗旋转
    bowlGroup.position.y = 6.6 + Math.sin(t * 1.5) * 0.18; // 上下浮动
    steams.forEach(function (sm) {
      var phase = (t + sm.userData.offset) % 2.4;
      sm.position.set(sm.userData.x, 1.6 + phase * 0.9, -9.6);
      sm.material.opacity = Math.max(0, 0.5 - phase * 0.2);
      sm.scale.setScalar(1 + phase * 0.6);
    });
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  // ---------- 自适应 ----------
  window.addEventListener('resize', function () {
    W = container.clientWidth; H = container.clientHeight;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    renderer.setSize(W, H);
  });
})();
