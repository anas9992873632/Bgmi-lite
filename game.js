/*
  BGMI LITE - Version 1
  Original browser battle-royale prototype
*/

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const homeScreen = document.getElementById("homeScreen");
const gameScreen = document.getElementById("gameScreen");
const gameOverScreen = document.getElementById("gameOverScreen");

const settingsPanel = document.getElementById("settingsPanel");
const controlsPanel = document.getElementById("controlsPanel");

const playBtn = document.getElementById("playBtn");
const restartBtn = document.getElementById("restartBtn");
const homeBtn = document.getElementById("homeBtn");

const settingsBtn = document.getElementById("settingsBtn");
const controlsBtn = document.getElementById("controlsBtn");

const closeSettings = document.getElementById("closeSettings");
const closeControls = document.getElementById("closeControls");

const healthText = document.getElementById("healthText");
const killsText = document.getElementById("killsText");
const aliveText = document.getElementById("aliveText");
const ammoText = document.getElementById("ammoText");

const finalKills = document.getElementById("finalKills");
const finalScore = document.getElementById("finalScore");

const graphicsSelect = document.getElementById("graphicsSelect");
const fpsSelect = document.getElementById("fpsSelect");
const sensitivity = document.getElementById("sensitivity");
const soundToggle = document.getElementById("soundToggle");

const shootBtn = document.getElementById("shootBtn");
const reloadBtn = document.getElementById("reloadBtn");
const jumpBtn = document.getElementById("jumpBtn");

const joystick = document.getElementById("joystick");
const joystickKnob = document.getElementById("joystickKnob");

let W = window.innerWidth;
let H = window.innerHeight;

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}

window.addEventListener("resize", resize);
resize();

/* =========================
   GAME STATE
========================= */

let running = false;
let gameOver = false;

const keys = {};

let mouseX = W / 2;
let mouseY = H / 2;
let mouseDown = false;

let lastTime = 0;
let deltaTime = 0;

const player = {
  x: 0,
  y: 0,

  radius: 17,

  speed: 3,
  sprintSpeed: 4.5,

  health: 100,
  maxHealth: 100,

  ammo: 30,
  magazine: 30,
  reserve: 120,

  kills: 0,
  score: 0,

  angle: 0,

  moving: false,
  sprinting: false,

  fireCooldown: 0,
  reloadTimer: 0,

  jumpTimer: 0
};

let bots = [];

let bullets = [];

const world = {
  size: 2600,

  zoneX: 0,
  zoneY: 0,

  zoneRadius: 1050,
  targetRadius: 350,

  zoneDamage: 0.025
};

let joystickActive = false;
let joyX = 0;
let joyY = 0;

/* =========================
   AUDIO
========================= */

let audioContext = null;

function playSound(type) {

  if (!soundToggle || !soundToggle.checked) {
    return;
  }

  try {

    if (!audioContext) {
      audioContext =
        new (window.AudioContext || window.webkitAudioContext)();
    }

    const oscillator =
      audioContext.createOscillator();

    const gain =
      audioContext.createGain();

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    if (type === "shoot") {
      oscillator.frequency.value = 150;
      gain.gain.value = 0.025;
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.04);
    }

    if (type === "reload") {
      oscillator.frequency.value = 500;
      gain.gain.value = 0.02;
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.08);
    }

    if (type === "hit") {
      oscillator.frequency.value = 700;
      gain.gain.value = 0.02;
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.06);
    }

  } catch (error) {
    // Audio unavailable — game still works.
  }
}

/* =========================
   KEYBOARD
========================= */

window.addEventListener("keydown", e => {

  const key = e.key.toLowerCase();

  keys[key] = true;

  if (key === "r") {
    reload();
  }

  if (e.code === "Space") {
    e.preventDefault();
    jump();
  }

  if (e.key === "Escape") {

    if (running) {
      running = false;
    } else if (!gameOver) {
      running = true;
    }
  }

});

window.addEventListener("keyup", e => {

  keys[e.key.toLowerCase()] = false;

});

/* =========================
   MOUSE
========================= */

canvas.addEventListener("mousemove", e => {

  if (!running) return;

  mouseX = e.clientX;
  mouseY = e.clientY;

  player.angle =
    Math.atan2(
      mouseY - H / 2,
      mouseX - W / 2
    );

});

canvas.addEventListener("mousedown", e => {

  if (e.button === 0) {

    mouseDown = true;

    shoot();
  }

});

window.addEventListener("mouseup", e => {

  if (e.button === 0) {
    mouseDown = false;
  }

});

/* =========================
   MOBILE JOYSTICK
========================= */

function updateJoystick(touch) {

  if (!joystick) return;

  const rect =
    joystick.getBoundingClientRect();

  const centerX =
    rect.left + rect.width / 2;

  const centerY =
    rect.top + rect.height / 2;

  let dx =
    touch.clientX - centerX;

  let dy =
    touch.clientY - centerY;

  const max = 42;

  const distance =
    Math.sqrt(dx * dx + dy * dy);

  if (distance > max) {

    dx =
      dx / distance * max;

    dy =
      dy / distance * max;
  }

  joyX = dx / max;
  joyY = dy / max;

  if (joystickKnob) {

    joystickKnob.style.transform =
      `translate(calc(-50% + ${dx}px),
                 calc(-50% + ${dy}px))`;
  }

}

if (joystick) {

  joystick.addEventListener("touchstart", e => {

    e.preventDefault();

    joystickActive = true;

    updateJoystick(e.touches[0]);

  }, { passive: false });

  joystick.addEventListener("touchmove", e => {

    e.preventDefault();

    if (!joystickActive) return;

    updateJoystick(e.touches[0]);

  }, { passive: false });

  joystick.addEventListener("touchend", resetJoystick);

  joystick.addEventListener("touchcancel", resetJoystick);
}

function resetJoystick() {

  joystickActive = false;

  joyX = 0;
  joyY = 0;

  if (joystickKnob) {
    joystickKnob.style.transform =
      "translate(-50%, -50%)";
  }
}

/* =========================
   MOBILE BUTTONS
========================= */

if (shootBtn) {

  shootBtn.addEventListener("touchstart", e => {

    e.preventDefault();

    shoot();

  }, { passive: false });

  shootBtn.addEventListener("mousedown", e => {

    e.preventDefault();

    shoot();

  });

}

if (reloadBtn) {

  reloadBtn.addEventListener("click", reload);
}

if (jumpBtn) {

  jumpBtn.addEventListener("click", jump);
}

/* =========================
   MENU
========================= */

if (playBtn) {
  playBtn.addEventListener("click", startGame);
}

if (restartBtn) {
  restartBtn.addEventListener("click", startGame);
}

if (homeBtn) {

  homeBtn.addEventListener("click", () => {

    gameOver = false;
    running = false;

    if (gameOverScreen) {
      gameOverScreen.classList.remove("active");
    }

    if (gameScreen) {
      gameScreen.classList.remove("active");
    }

    if (homeScreen) {
      homeScreen.classList.add("active");
    }

  });

}

if (settingsBtn) {

  settingsBtn.addEventListener("click", () => {

    settingsPanel.classList.add("open");

  });

}

if (controlsBtn) {

  controlsBtn.addEventListener("click", () => {

    controlsPanel.classList.add("open");

  });

}

if (closeSettings) {

  closeSettings.addEventListener("click", () => {

    settingsPanel.classList.remove("open");

  });

}

if (closeControls) {

  closeControls.addEventListener("click", () => {

    controlsPanel.classList.remove("open");

  });

}

/* =========================
   START GAME
========================= */

function startGame() {

  if (homeScreen) {
    homeScreen.classList.remove("active");
  }

  if (gameOverScreen) {
    gameOverScreen.classList.remove("active");
  }

  if (gameScreen) {
    gameScreen.classList.add("active");
  }

  player.x = 0;
  player.y = 0;

  player.health = 100;

  player.ammo = 30;
  player.reserve = 120;

  player.kills = 0;
  player.score = 0;

  player.angle = 0;

  player.fireCooldown = 0;
  player.reloadTimer = 0;
  player.jumpTimer = 0;

  world.zoneRadius = 1050;

  bullets = [];

  createBots();

  gameOver = false;
  running = true;

  lastTime = performance.now();

  updateHUD();
}

/* =========================
   CREATE BOTS
========================= */

function createBots() {

  bots = [];

  for (let i = 0; i < 9; i++) {

    const angle =
      Math.random() * Math.PI * 2;

    const distance =
      350 + Math.random() * 850;

    bots.push({

      x: Math.cos(angle) * distance,

      y: Math.sin(angle) * distance,

      radius: 17,

      health: 100,

      maxHealth: 100,

      speed:
        0.55 + Math.random() * 0.35,

      angle:
        Math.random() * Math.PI * 2,

      cooldown:
        Math.random() * 120,

      alive: true

    });

  }

}

/* =========================
   PLAYER MOVEMENT
========================= */

function updatePlayer() {

  let dx = 0;
  let dy = 0;

  if (keys["w"] || keys["arrowup"]) {
    dy -= 1;
  }

  if (keys["s"] || keys["arrowdown"]) {
    dy += 1;
  }

  if (keys["a"] || keys["arrowleft"]) {
    dx -= 1;
  }

  if (keys["d"] || keys["arrowright"]) {
    dx += 1;
  }

  if (joystickActive) {

    dx = joyX;
    dy = joyY;

  }

  const length =
    Math.sqrt(dx * dx + dy * dy);

  player.sprinting =
    !!keys["shift"] && length > 0;

  if (length > 0) {

    dx /= length;
    dy /= length;

    const speed =
      player.sprinting
        ? player.sprintSpeed
        : player.speed;

    player.x += dx * speed;
    player.y += dy * speed;

    player.moving = true;

  } else {

    player.moving = false;
  }

  const limit =
    world.size / 2;

  player.x =
    Math.max(
      -limit,
      Math.min(limit, player.x)
    );

  player.y =
    Math.max(
      -limit,
      Math.min(limit, player.y)
    );

  if (player.jumpTimer > 0) {

    player.jumpTimer -= 1;

  }

}

/* =========================
   JUMP
========================= */

function jump() {

  if (!running) return;

  if (player.jumpTimer <= 0) {

    player.jumpTimer = 25;

  }

}

/* =========================
   BOT AI
========================= */

function updateBots() {

  for (const bot of bots) {

    if (!bot.alive) continue;

    const dx =
      player.x - bot.x;

    const dy =
      player.y - bot.y;

    const distance =
      Math.sqrt(dx * dx + dy * dy);

    if (distance < 750) {

      bot.angle =
        Math.atan2(dy, dx);

      if (distance > 230) {

        bot.x +=
          Math.cos(bot.angle) *
          bot.speed;

        bot.y +=
          Math.sin(bot.angle) *
          bot.speed;

      }

      bot.cooldown--;

      if (
        distance < 500 &&
        bot.cooldown <= 0
      ) {

        bot.cooldown =
          100 + Math.random() * 80;

        if (Math.random() < 0.35) {

          player.health -=
            5 + Math.random() * 5;

          player.health =
            Math.max(
              0,
              player.health
            );

          playSound("hit");

          updateHUD();

          if (player.health <= 0) {

            endGame();

          }

        }

      }

    } else {

      bot.angle +=
        (Math.random() - 0.5) * 0.04;

      bot.x +=
        Math.cos(bot.angle) *
        bot.speed *
        0.3;

      bot.y +=
        Math.sin(bot.angle) *
        bot.speed *
        0.3;
    }

  }

}

/* =========================
   SHOOTING
========================= */

function shoot() {

  if (!running || gameOver) {
    return;
  }

  if (player.reloadTimer > 0) {
    return;
  }

  if (player.fireCooldown > 0) {
    return;
  }

  if (player.ammo <= 0) {

    reload();

    return;
  }

  player.ammo--;

  player.fireCooldown = 7;

  playSound("shoot");

  /*
    Bullet
  */

  const bulletSpeed = 15;

  bullets.push({

    x:
      player.x +
      Math.cos(player.angle) * 25,

    y:
      player.y +
      Math.sin(player.angle) * 25,

    vx:
      Math.cos(player.angle) *
      bulletSpeed,

    vy:
      Math.sin(player.angle) *
      bulletSpeed,

    life: 50,

    damage: 50

  });

  updateHUD();

}

/* =========================
   BULLET UPDATE
========================= */

function updateBullets() {

  for (
    let i = bullets.length - 1;
    i >= 0;
    i--
  ) {

    const bullet = bullets[i];

    bullet.x += bullet.vx;
    bullet.y += bullet.vy;

    bullet.life--;

    let remove = false;

    if (bullet.life <= 0) {
      remove = true;
    }

    if (
      Math.abs(bullet.x) >
        world.size / 2 ||
      Math.abs(bullet.y) >
        world.size / 2
    ) {

      remove = true;

    }

    /*
      Bot collision
    */

    if (!remove) {

      for (const bot of bots) {

        if (!bot.alive) continue;

        const dx =
          bullet.x - bot.x;

        const dy =
          bullet.y - bot.y;

        const distance =
          Math.sqrt(
            dx * dx +
            dy * dy
          );

        if (
          distance <
          bot.radius + 5
        ) {

          bot.health -=
            bullet.damage;

          playSound("hit");

          if (bot.health <= 0) {

            bot.health = 0;

            bot.alive = false;

            player.kills++;

            player.score += 100;

            checkWin();

          }

          remove = true;

          break;
        }

      }

    }

    if (remove) {

      bullets.splice(i, 1);

    }

  }

}

/* =========================
   RELOAD
========================= */

function reload() {

  if (!running) return;

  if (player.reloadTimer > 0) {
    return;
  }

  if (player.ammo >= player.magazine) {
    return;
  }

  if (player.reserve <= 0) {
    return;
  }

  player.reloadTimer = 60;

  playSound("reload");

}

/* =========================
   RELOAD UPDATE
========================= */

function updateReload() {

  if (player.reloadTimer <= 0) {
    return;
  }

  player.reloadTimer--;

  if (player.reloadTimer <= 0) {

    const needed =
      player.magazine -
      player.ammo;

    const amount =
      Math.min(
        needed,
        player.reserve
      );

    player.ammo += amount;

    player.reserve -= amount;

    updateHUD();
  }

}

/* =========================
   FIRE COOLDOWN
========================= */

function updateFireCooldown() {

  if (player.fireCooldown > 0) {

    player.fireCooldown--;

  }

  if (mouseDown && running) {

    shoot();

  }

}

/* =========================
   SAFE ZONE
========================= */

function updateZone() {

  if (world.zoneRadius > 350) {

    world.zoneRadius -= 0.035;

  }

  const dx =
    player.x -
    world.zoneX;

  const dy =
    player.y -
    world.zoneY;

  const distance =
    Math.sqrt(
      dx * dx +
      dy * dy
    );

  if (
    distance >
    world.zoneRadius
  ) {

    player.health -=
      world.zoneDamage;

    if (player.health <= 0) {

      player.health = 0;

      endGame();

    }

  }

}

/* =========================
   CAMERA
========================= */

function worldToScreen(x, y) {

  return {

    x:
      W / 2 +
      (x - player.x),

    y:
      H / 2 +
      (y - player.y)

  };

}

/* =========================
   WORLD
========================= */

function drawWorld() {

  ctx.clearRect(
    0,
    0,
    W,
    H
  );

  /*
    Ground
  */

  ctx.fillStyle =
    "#25352b";

  ctx.fillRect(
    0,
    0,
    W,
    H
  );

  /*
    Grid
  */

  let grid = 80;

  if (graphicsSelect) {

    if (
      graphicsSelect.value ===
      "high"
    ) {

      grid = 55;

    }

    if (
      graphicsSelect.value ===
      "low"
    ) {

      grid = 110;

    }

  }

  ctx.strokeStyle =
    "rgba(255,255,255,.045)";

  ctx.lineWidth = 1;

  const startX =
    Math.floor(
      (player.x - W / 2) /
      grid
    ) * grid;

  const startY =
    Math.floor(
      (player.y - H / 2) /
      grid
    ) * grid;

  for (
    let x = startX;
    x < player.x + W / 2 + grid;
    x += grid
  ) {

    const sx =
      W / 2 +
      (x - player.x);

    ctx.beginPath();

    ctx.moveTo(
      sx,
      0
    );

    ctx.lineTo(
      sx,
      H
    );

    ctx.stroke();

  }

  for (
    let y = startY;
    y < player.y + H / 2 + grid;
    y += grid
  ) {

    const sy =
      H / 2 +
      (y - player.y);

    ctx.beginPath();

    ctx.moveTo(
      0,
      sy
    );

    ctx.lineTo(
      W,
      sy
    );

    ctx.stroke();

  }

  /*
    Buildings
  */

  drawBuilding(
    -500,
    -350,
    170,
    120
  );

  drawBuilding(
    420,
    -300,
    190,
    140
  );

  drawBuilding(
    -600,
    350,
    150,
    150
  );

  drawBuilding(
    500,
    350,
    210,
    130
  );

}

/* =========================
   BUILDINGS
========================= */

function drawBuilding(
  x,
  y,
  width,
  height
) {

  const p =
    worldToScreen(x, y);

  ctx.fillStyle =
    "#4b514c";

  ctx.fillRect(
    p.x,
    p.y,
    width,
    height
  );

  ctx.strokeStyle =
    "#1a201d";

  ctx.lineWidth = 4;

  ctx.strokeRect(
    p.x,
    p.y,
    width,
    height
  );

  ctx.fillStyle =
    "#252b28";

  for (
    let wx = 20;
    wx < width - 20;
    wx += 45
  ) {

    for (
      let wy = 20;
      wy < height - 20;
      wy += 40
    ) {

      ctx.fillRect(
        p.x + wx,
        p.y + wy,
        18,
        15
      );

    }

  }

}

/* =========================
   DRAW SAFE ZONE
========================= */

function drawZone() {

  const center =
    worldToScreen(
      world.zoneX,
      world.zoneY
    );

  ctx.save();

  /*
    Outside zone overlay
  */

  ctx.fillStyle =
    "rgba(70,90,180,.16)";

  ctx.fillRect(
    0,
    0,
    W,
    H
  );

  /*
    Clear inside zone
  */

  ctx.globalCompositeOperation =
    "destination-out";

  ctx.beginPath();

  ctx.arc(
    center.x,
    center.y,
    world.zoneRadius,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.restore();

  /*
    Zone border
  */

  ctx.strokeStyle =
    "rgba(90,180,255,.75)";

  ctx.lineWidth = 5;

  ctx.beginPath();

  ctx.arc(
    center.x,
    center.y,
    world.zoneRadius,
    0,
    Math.PI * 2
  );

  ctx.stroke();

}

/* =========================
   DRAW BOTS
========================= */

function drawBots() {

  for (const bot of bots) {

    if (!bot.alive) continue;

    const p =
      worldToScreen(
        bot.x,
        bot.y
      );

    if (
      p.x < -50 ||
      p.x > W + 50 ||
      p.y < -50 ||
      p.y > H + 50
    ) {

      continue;
    }

    /*
      Shadow
    */

    ctx.fillStyle =
      "rgba(0,0,0,.3)";

    ctx.beginPath();

    ctx.ellipse(
      p.x,
      p.y + 15,
      19,
      7,
      0,
      0,
      Math.PI * 2
    );

    ctx.fill();

    /*
      Body
    */

    ctx.fillStyle =
      "#a84a45";

    ctx.beginPath();

    ctx.arc(
      p.x,
      p.y,
      bot.radius,
      0,
      Math.PI * 2
    );

    ctx.fill();

    /*
      Head
    */

    ctx.fillStyle =
      "#d58c72";

    ctx.beginPath();

    ctx.arc(
      p.x,
      p.y - 11,
      7,
      0,
      Math.PI * 2
    );

    ctx.fill();

    /*
      Weapon direction
    */

    ctx.strokeStyle =
      "#ffffff";

    ctx.lineWidth = 3;

    ctx.beginPath();

    ctx.moveTo(
      p.x,
      p.y
    );

    ctx.lineTo(
      p.x +
        Math.cos(bot.angle) * 27,

      p.y +
        Math.sin(bot.angle) * 27
    );

    ctx.stroke();

    /*
      Health bar background
    */

    ctx.fillStyle =
      "rgba(0,0,0,.65)";

    ctx.fillRect(
      p.x - 22,
      p.y - 32,
      44,
      6
    );

    /*
      Health
    */

    ctx.fillStyle =
      "#55df87";

    ctx.fillRect(
      p.x - 22,
      p.y - 32,
      44 *
        (bot.health /
          bot.maxHealth),
      6
    );

  }

}

/* =========================
   DRAW BULLETS
========================= */

function draw
