let monsters = [];
let tooth; // 中央的大牙齒物件
let timeLeft = 60; // 60 秒生存戰
let health = 100;
let gameState = "START"; // START, PLAYING, WIN, LOSE
let effects = []; // 存放所有點擊特效

let selectedWeapon = 'finger';
const weapons = {
  finger: { name: '指尖', power: 35, range: 60, icon: '☝️' },
  brush: { name: '牙刷', power: 100, range: 45, icon: '🪥' },
  paste: { name: '牙膏', power: 20, range: 150, icon: '🧪' }
};

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  let toothYOffset = min(height * 0.05, 50); // 將牙齒位置向上微調，最大偏移 50 像素
  // 初始化大牙齒（放在畫面中央）
  tooth = new MainTooth(width / 2, height / 2 - toothYOffset, 160);
}

function selectWeapon(type) {
  selectedWeapon = type;
  // 更新 UI 狀態
  document.querySelectorAll('.weapon-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`btn-${type}`).classList.add('active');
  document.getElementById('current-weapon-txt').innerText = weapons[type].name;
}

function startGame() {
  gameState = "PLAYING";
  document.getElementById("start-overlay").style.display = "none";
  // 遊戲正式開始才產生初始惡魔
  for (let i = 0; i < 6; i++) {
    monsters.push(new CavityDevil(random(width), random(height)));
  }
}

function draw() {
  if (gameState === "WIN" || gameState === "LOSE" || gameState === "END") return;

  if (gameState === "PLAYING") {
    updateGameLogic();
  }

  // ==========================================
  // 🎨 繪製寫實口腔背景 (對應你提供的第二張圖)
  // ==========================================
  background(242, 142, 156); // 1. 最外層的皮膚/嘴唇粉紅色
  
  push();
    translate(width / 2, height / 2); // 移到畫面中心開始畫口腔結構
    
    // 計算適合當前視窗大小的口腔比例
    let mouthW = min(width * 0.85, 600);
    let mouthH = min(height * 0.9, 700);

    // 2. 口腔深處暗部 (大橢圓)
    fill(140, 35, 52); 
    noStroke();
    ellipse(0, 0, mouthW, mouthH);

    // 3. 喉嚨深處與懸壅垂 (更深的暗紅部)
    fill(89, 16, 28);
    ellipse(0, -mouthH * 0.1, mouthW * 0.5, mouthH * 0.3);
    
    // 懸壅垂 (小肉垂)
    fill(166, 53, 71);
    ellipse(0, -mouthH * 0.2, mouthW * 0.06, mouthH * 0.1);
    // 兩側扁桃腺
    ellipse(-mouthW * 0.18, -mouthH * 0.08, mouthW * 0.08, mouthH * 0.1);
    ellipse(mouthW * 0.18, -mouthH * 0.08, mouthW * 0.08, mouthH * 0.1);

    // 4. 大舌頭 (下方的粉紅愛心/圓弧狀)
    fill(242, 121, 139);
    push();
      translate(0, mouthH * 0.15);
      // 用兩個圓組成舌頭的厚度感
      ellipse(-mouthW * 0.12, 0, mouthW * 0.32, mouthH * 0.35);
      ellipse(mouthW * 0.12, 0, mouthW * 0.32, mouthH * 0.35);
      ellipse(0, mouthH * 0.1, mouthW * 0.45, mouthH * 0.3);
    pop();

    // 5. 繪製環狀的「整排背景牙齒」
    // [概念對應]: 講義利用 for 迴圈配合 sin/cos 繪製環狀排列物件
    fill(255, 252, 240); // 象牙白
    stroke(200, 100, 120);
    strokeWeight(2);
    
    let totalTeeth = 16; 
    // 上排牙齒軌跡 (上半圓)
    for (let i = 0; i <= totalTeeth; i++) {
      let angle = map(i, 0, totalTeeth, PI + 0.2, TWO_PI - 0.2);
      let tx = (mouthW * 0.42) * cos(angle);
      let ty = (mouthH * 0.38) * sin(angle) - mouthH * 0.02;
      
      push();
        translate(tx, ty);
        rotate(angle - HALF_PI);
        rectMode(CENTER);
        rect(0, 0, mouthW * 0.04, mouthH * 0.05, 5); // 畫出單顆牙齒
      pop();
    }

    // 下排牙齒軌跡 (下半圓)
    for (let i = 0; i <= totalTeeth; i++) {
      let angle = map(i, 0, totalTeeth, 0.2, PI - 0.2);
      let tx = (mouthW * 0.42) * cos(angle);
      let ty = (mouthH * 0.38) * sin(angle) + mouthH * 0.05;
      
      push();
        translate(tx, ty);
        rotate(angle - HALF_PI);
        rectMode(CENTER);
        rect(0, 0, mouthW * 0.04, mouthH * 0.05, 5);
      pop();
    }
  pop();

  // ==========================================
  // 🦷 互動角色更新與繪製
  // ==========================================
  
  // 更新與繪製中央大牙齒
  tooth.update(monsters);
  tooth.draw();

  // 更新與繪製所有小惡魔
  // [概念對應]: for...of 迴圈管理
  for (let i = monsters.length - 1; i >= 0; i--) {
    let m = monsters[i];
    m.update();
    m.checkMouse();
    
    // 金色惡魔特殊邏輯：被滑鼠觸碰後消滅並補血
    if (m.type === 'gold' && m.mode === "scared") {
      health = min(100, health + 15); // 恢復 15% 生命值
      monsters.splice(i, 1); // 消滅它
      continue;
    }
    
    m.draw();
  }

  // 🚨 低血量警告特效 (當健康低於 20% 時螢幕邊緣閃爍紅光)
  if (health < 20 && gameState === "PLAYING") {
    push();
    // 利用 sin() 創造呼吸燈般的閃爍透明度 (20 ~ 150 之間)
    let alpha = map(sin(frameCount * 0.15), -1, 1, 20, 150); 
    noFill();
    stroke(255, 0, 0, alpha);
    strokeWeight(60); // 邊緣紅光的厚度
    rect(0, 0, width, height);
    pop();
  }

  // 更新網頁 UI 文字
  document.getElementById("monster-count").innerText = monsters.length;
  if (gameState === "PLAYING") {
    document.getElementById("health-val").innerText = floor(health);
    document.getElementById("game-timer").innerText = timeLeft;
  }

  // 更新與繪製所有視覺特效 (泡泡、衝擊波等)
  for (let i = effects.length - 1; i >= 0; i--) {
    effects[i].update();
    effects[i].display();
    if (effects[i].isDead()) effects.splice(i, 1);
  }

  // 繪製滑鼠攻擊範圍提示
  if (gameState === "PLAYING") {
    noFill();
    stroke(255, 255, 255, 50);
    ellipse(mouseX, mouseY, weapons[selectedWeapon].range * 2);
  }
}

function updateGameLogic() {
  // 時間倒數
  if (frameCount % 60 === 0 && timeLeft > 0) {
    timeLeft--;
  }

  // 難度曲線：時間越少，產生速度越快 (從 120 幀縮短到 20 幀產生一隻)
  let spawnInterval = floor(map(timeLeft, 60, 0, 80, 20));
  if (frameCount % spawnInterval === 0) {
    let r = random();
    let type = r < 0.12 ? 'gold' : (r < 0.6 ? 'devil' : 'germ');
    monsters.push(new CavityDevil(random([0, width]), random([0, height]), type));
  }

  // 檢查勝負
  if (health <= 0) {
    endGame("保衛失敗", "牙齒已經被蛀光了...要記得勤刷牙！");
  } else if (timeLeft <= 0) {
    endGame("保衛成功", "恭喜你成功守護了牙齒的健康！");
  }
}

function endGame(title, desc) {
  gameState = "END";
  document.getElementById("game-overlay").style.display = "block";
  document.getElementById("result-title").innerText = title;
  document.getElementById("result-desc").innerText = desc;
}

// 滑鼠點擊時，在滑鼠位置隨機誕生「小惡魔」或「紅病菌」
function mousePressed() {
  if (gameState !== "PLAYING") return;

  // 產生對應武器的特效
  effects.push(new AttackEffect(mouseX, mouseY, selectedWeapon));

  let weapon = weapons[selectedWeapon];
  
  // 檢查範圍內的所有惡魔
  for (let i = monsters.length - 1; i >= 0; i--) {
    let m = monsters[i];
    let d = dist(mouseX, mouseY, m.p.x, m.p.y);
    
    if (d < weapon.range + m.r) {
      m.hp -= weapon.power;
      // 強力擊退
      let pushDir = p5.Vector.sub(m.p, createVector(mouseX, mouseY)).setMag(20);
      m.v.add(pushDir);
      
      if (m.hp <= 0 && m.type !== 'gold') {
        monsters.splice(i, 1);
      }
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  let toothYOffset = min(height * 0.05, 50); // 保持一致的偏移量
  tooth.p.set(width / 2, height / 2 - toothYOffset);
}


// ==========================================
// 類別: 武器攻擊特效
// ==========================================
class AttackEffect {
  constructor(x, y, type) {
    this.p = createVector(x, y);
    this.type = type;
    this.life = 1.0; // 生命值從 1.0 降到 0
    this.particles = [];

    // 初始化不同類型的粒子
    if (type === 'brush') {
      // 牙刷：產生泡泡粒子
      for (let i = 0; i < 12; i++) {
        this.particles.push({
          pos: createVector(random(-20, 20), random(-10, 10)),
          vel: createVector(random(-0.5, 0.5), random(-1, -3)),
          size: random(8, 20)
        });
      }
    } else if (type === 'paste') {
      // 牙膏：產生泡泡泡沫
      for (let i = 0; i < 15; i++) {
        this.particles.push({
          pos: createVector(0, 0),
          vel: p5.Vector.random2D().mult(random(2, 6)),
          size: random(20, 50)
        });
      }
    }
  }

  update() {
    this.life -= 0.04; // 特效持續約 0.6 秒
    // 更新子粒子位置
    for (let p of this.particles) {
      p.pos.add(p.vel);
      if (this.type === 'brush') p.pos.x += sin(frameCount * 0.2) * 2; // 泡泡左右晃動
    }
  }

  display() {
    push();
    translate(this.p.x, this.p.y);
    let alpha = this.life * 255;

    if (this.type === 'finger') {
      // ☝️ 指尖：擴散衝擊波
      noFill();
      stroke(255, alpha);
      strokeWeight(3);
      ellipse(0, 0, (1 - this.life) * 120);
    } 
    else if (this.type === 'brush') {
      // 🪥 牙刷：繪製泡泡
      stroke(255, alpha);
      strokeWeight(1.5);
      fill(255, alpha * 0.3);
      for (let p of this.particles) {
        ellipse(p.pos.x, p.pos.y, p.size);
        // 泡泡上的小反光
        noStroke();
        fill(255, alpha * 0.6);
        ellipse(p.pos.x - p.size*0.2, p.pos.y - p.size*0.2, p.size*0.3);
      }
    } 
    else if (this.type === 'paste') {
      // 🧪 牙膏：繪製薄荷泡沫
      noStroke();
      fill(150, 255, 220, alpha * 0.5); // 薄荷綠
      for (let p of this.particles) {
        ellipse(p.pos.x, p.pos.y, p.size * this.life);
      }
    }
    pop();
  }

  isDead() {
    return this.life <= 0;
  }
}


// ==========================================
// 類別 1: 中央的大牙齒 (主角)
// ==========================================
class MainTooth {
  constructor(x, y, r) {
    this.p = createVector(x, y);
    this.r = r;
    this.currentR = r; 
    this.isAttacked = false;
    this.toothColor = color(255);
  }

  update(allMonsters) {
    this.isAttacked = false;
    
    // [概念對應]: 講義 dist() 距離檢查
    for (let m of allMonsters) {
      let d = dist(this.p.x, this.p.y, m.p.x, m.p.y);
      if (d < this.r/2 + m.r) {
        this.isAttacked = true;
        health -= 0.15; // 碰到就扣血
        break;
      }
    }

    if (this.isAttacked) {
      this.toothColor = lerpColor(this.toothColor, color(224, 235, 178), 0.2); // 被感染變綠黃色
      this.currentR = lerp(this.currentR, this.r * 0.85, 0.2); // 痛到縮小
    } else {
      this.toothColor = lerpColor(this.toothColor, color(255), 0.1);
      this.currentR = lerp(this.currentR, this.r, 0.1);
    }
  }

  draw() {
    push();
    translate(this.p.x, this.p.y);
    
    // 牙齒黑外框（完美還原插畫風格）
    stroke(40);
    strokeWeight(6);
    fill(this.toothColor);

    let w = this.currentR;
    let h = this.currentR * 1.05;
    
    // 繪製插畫風大牙齒
    beginShape();
    vertex(-w*0.4, -h*0.3);
    bezierVertex(-w*0.5, -h*0.6,  -w*0.1, -h*0.6,  0, -h*0.3);
    bezierVertex(w*0.1, -h*0.6,   w*0.5, -h*0.6,   w*0.4, -h*0.3);
    bezierVertex(w*0.5, 0,        w*0.4, h*0.2,    w*0.3, h*0.4);
    bezierVertex(w*0.2, h*0.6,    w*0.1, h*0.5,    0, h*0.1);
    bezierVertex(-w*0.1, h*0.5,   -w*0.2, h*0.6,   -w*0.3, h*0.4);
    bezierVertex(-w*0.4, h*0.2,   -w*0.5, 0,       -w*0.4, -h*0.3);
    endShape(CLOSE);

    // 內部亮光漸層感
    noStroke();
    fill(255, 255, 255, 120);
    ellipse(-w*0.15, -h*0.25, w*0.4, h*0.15);

    // --- 繪製表情 ---
    if (this.isAttacked) {
      // 痛苦表情 (> <)
      stroke(40);
      strokeWeight(5);
      noFill();
      // 左眼 >
      line(-w*0.2, -h*0.12, -w*0.08, -h*0.07);
      line(-w*0.2, -h*0.02, -w*0.08, -h*0.07);
      // 右眼 <
      line(w*0.2, -h*0.12, w*0.08, -h*0.07);
      line(w*0.2, -h*0.02, w*0.08, -h*0.07);
      
      // 哀鳴張大嘴
      fill(186, 45, 68);
      strokeWeight(3);
      ellipse(0, h*0.18, w*0.3, h*0.22);
      
      // 腮紅
      fill(255, 120, 140, 220);
      noStroke();
      ellipse(-w*0.25, h*0.06, w*0.18, w*0.12);
      ellipse(w*0.25, h*0.06, w*0.18, w*0.12);
      
      // 驚嚇藍色淚滴/汗
      fill(41, 171, 226);
      ellipse(w*0.38, -h*0.35, 14, 22);
      ellipse(w*0.48, -h*0.23, 9, 15);
    } else {
      // 微笑表情
      noStroke();
      fill(40);
      ellipse(-w*0.16, -h*0.08, w*0.09, w*0.09);
      ellipse(w*0.16, -h*0.08, w*0.09, w*0.09);
      noFill();
      stroke(40);
      strokeWeight(4);
      arc(0, h*0.02, w*0.22, h*0.12, 0, PI);
      
      // 腮紅
      noStroke();
      fill(255, 174, 185, 180);
      ellipse(-w*0.25, 0, w*0.14, w*0.09);
      ellipse(w*0.25, 0, w*0.14, w*0.09);
    }
    pop();
  }
}


// ==========================================
// 類別 2: 蛀牙小惡魔 / 病菌
// ==========================================
class CavityDevil {
  constructor(x, y, type = 'devil') {
    this.p = createVector(x, y);
    this.r = random(24, 36); 
    this.v = createVector(random(-2, 2), random(-2, 2));
    this.a = createVector(0, 0);
    this.type = type; 
    this.mode = "attack"; 
    this.rId = random(100); 
    this.hp = 100;
  }

  update() {
    // 尋獵邏輯：自動往中央大牙齒靠近
    let centerTooth = createVector(width / 2, height / 2);
    let huntForce = p5.Vector.sub(centerTooth, this.p);
    huntForce.setMag(0.06); 
    this.a.add(huntForce);

    this.v.add(this.a);
    this.p.add(this.v);
    this.v.mult(0.96); 
    this.a.mult(0); 

    // 邊界反彈
    if (this.p.x < 0 || this.p.x > width) this.v.x *= -1;
    if (this.p.y < 0 || this.p.y > height) this.v.y *= -1;
  }

  checkMouse() {
    let d = dist(mouseX, mouseY, this.p.x, this.p.y);
    if (d < 110) {
      this.mode = "scared";
      // [概念對應]: 向量計算逃跑力道
      let mouseV = createVector(mouseX, mouseY);
      let flee = p5.Vector.sub(this.p, mouseV);
      flee.setMag(1.2); 
      this.a.add(flee);
    } else {
      this.mode = "attack";
    }
  }

  draw() {
    push();
    translate(this.p.x, this.p.y);
    
    if (this.mode === "scared") {
      translate(random(-2, 2), random(-2, 2)); // 嚇到發抖
    }

    // 加上黑色厚外框符合圖片風格
    stroke(30);
    strokeWeight(3.5);

    if (this.type === 'gold') {
      // ✨ 【金色治癒惡魔】
      // 身體 (金黃色)
      fill(255, 215, 0); 
      ellipse(0, 0, this.r * 2.2, this.r * 2.2);
      
      // 畫一個小光環
      noFill();
      stroke(255, 255, 100);
      strokeWeight(4);
      ellipse(0, -this.r * 1.2, this.r * 1.5, this.r * 0.4);
      
      // 亮晶晶特效
      fill(255, 255, 255, 200);
      noStroke();
      push();
        rotate(frameCount * 0.1);
        rect(this.r * 0.8, this.r * 0.8, 10, 10);
        rect(-this.r * 0.8, -this.r * 0.8, 8, 8);
      pop();

      // 眼睛 (可愛大眼)
      stroke(30);
      strokeWeight(2);
      fill(255);
      ellipse(-this.r * 0.3, -this.r * 0.1, this.r * 0.4, this.r * 0.4);
      ellipse(this.r * 0.3, -this.r * 0.1, this.r * 0.4, this.r * 0.4);
      fill(0);
      ellipse(-this.r * 0.3, -this.r * 0.1, 5, 5);
      ellipse(this.r * 0.3, -this.r * 0.1, 5, 5);
      
      // 微笑
      noFill();
      arc(0, this.r * 0.3, this.r * 0.4, this.r * 0.3, 0, PI);

    } else if (this.type === 'devil') {
      // 😈 【手拿三叉戟的黑色小惡魔】
      
      // 1. 三叉戟
      let weaponX = -this.r * 0.7;
      line(0, 0, weaponX, -5);
      line(weaponX, -18, weaponX, 8);
      line(weaponX, -18, weaponX - 8, -18);
      line(weaponX, -5, weaponX - 12, -5);
      line(weaponX, 8, weaponX - 8, 8);

      // 2. 惡魔尾巴
      let tailWobble = sin(frameCount * 0.15 + this.rId) * 8;
      noFill();
      arc(this.r*0.4, this.r*0.4, this.r, this.r, 0, HALF_PI);
      fill(30);
      triangle(this.r*0.8, this.r*0.8 + tailWobble, this.r*1.1, this.r*0.6 + tailWobble, this.r*1.1, this.r*1.0 + tailWobble);

      // 3. 身體
      fill(45);
      ellipse(0, 0, this.r * 1.9, this.r * 1.9);

      // 4. 小惡魔角
      fill(30);
      push();
        translate(-this.r * 0.45, -this.r * 0.75);
        rotate(-QUARTER_PI);
        triangle(-6, 12, 6, 12, 0, -8);
      pop();
      push();
        translate(this.r * 0.45, -this.r * 0.75);
        rotate(QUARTER_PI);
        triangle(-6, 12, 6, 12, 0, -8);
      pop();

      // 5. 邪惡紫色眼睛 (驚嚇時變白色小圓)
      if (this.mode === "scared") {
        fill(255);
        ellipse(-this.r * 0.28, -this.r * 0.1, this.r * 0.28, this.r * 0.28);
        ellipse(this.r * 0.28, -this.r * 0.1, this.r * 0.28, this.r * 0.28);
        fill(0);
        ellipse(-this.r * 0.28, -this.r * 0.1, 4, 4);
        ellipse(this.r * 0.28, -this.r * 0.1, 4, 4);
        
        // 嚇到的 O 型嘴
        noFill();
        stroke(255);
        ellipse(0, this.r * 0.35, 8, 8);
      } else {
        fill(180, 70, 240); // 亮紫色眼框
        ellipse(-this.r * 0.28, -this.r * 0.1, this.r * 0.38, this.r * 0.38);
        ellipse(this.r * 0.28, -this.r * 0.1, this.r * 0.38, this.r * 0.38);
        fill(255); // 白色高光瞳孔
        ellipse(-this.r * 0.28, -this.r * 0.1, this.r * 0.15, this.r * 0.15);
        ellipse(this.r * 0.28, -this.r * 0.1, this.r * 0.15, this.r * 0.15);
        
        // 壞笑嘴巴
        noFill();
        stroke(255);
        arc(0, this.r * 0.25, this.r * 0.35, this.r * 0.2, 0, PI);
      }

    } else {
      // 💥 【桃紅色鋸齒狀病菌】
      // [概念對應]: 使用 sin() 與 vertex() 畫出星狀多邊形波浪
      fill(235, 30, 95);
      if (this.mode === "scared") fill(255, 110, 110); 

      beginShape();
      let totalPoints = 14; 
      for (let i = 0; i < totalPoints; i++) {
        let angle = map(i, 0, totalPoints, 0, TWO_PI);
        let spike = sin(i * 3 + frameCount * 0.25 + this.rId) * 5;
        let currentR = this.r + spike;
        
        if (i % 2 === 0) currentR *= 1.35; // 間隔拉長形成尖刺

        let x = currentR * cos(angle);
        let y = currentR * sin(angle);
        vertex(x, y);
      }
      endShape(CLOSE);

      // 病菌小眼睛與呆滯嘴巴
      fill(255);
      noStroke();
      ellipse(-this.r*0.2, -2, 8, 8);
      ellipse(this.r*0.2, -2, 8, 8);
      fill(0);
      ellipse(-this.r*0.2, -2, 4, 4);
      ellipse(this.r*0.2, -2, 4, 4);
      
      stroke(30);
      strokeWeight(2);
      line(-5, this.r*0.2, 5, this.r*0.2);
    }
    pop();
  }
}