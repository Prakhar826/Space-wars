// --- Game Elements ---
var gameContainer = document.getElementById("game-container");
var gameDiv = document.getElementById("gameDiv");
var livesDiv = document.getElementById("livesDiv");
var pauseDiv = document.getElementById("pauseDiv");
var gameOver = document.getElementById("gameOver");
const revivalPopup1 = document.getElementById("revival-popup-1");
const revivalPopup2 = document.getElementById("revival-popup-2");
const revivalTimerLabel = document.getElementById("revival-timer-label");
const reviveDiamondBtn = document.getElementById("revive-diamond-btn");
const reviveAdBtn = document.getElementById("revive-ad-btn");
const bonusDiamondBtn = document.getElementById("bonus-diamond-btn");
const bonusAdBtn = document.getElementById("bonus-ad-btn");
const skipBonusBtn = document.getElementById("skip-bonus-btn");
const musicBtn = document.getElementById("musicBtn");
const soundBtn = document.getElementById("soundBtn");
const pauseBtn = document.getElementById("pauseBtn");
const scoreLabel = document.getElementById("scoreLabel");
const coinCountLabel = document.getElementById("coinCountLabel");
const diamondCountLabel = document.getElementById("diamondCountLabel");

// --- Audio Elements ---
const musicSound = new Audio('sounds/music.mp3');
const coinSound = new Audio('sounds/coin.mp3');
const bulletSound = new Audio('sounds/bullet.ogg');
const enemyBulletSound = new Audio('sounds/bullet.ogg');
const boosterSound = new Audio('sounds/booster.mp3');
const explodeSound = new Audio('sounds/explode.mp3');
const highScoreSound = new Audio('sounds/High_score.mp3');

// --- Sound State ---
var isMusicMuted = false;
var isSfxMuted = false;

function playSound(sound) {
    if (isSfxMuted) return;
    sound.currentTime = 0;
    sound.play().catch(e => console.error("Sound play failed:", e));
}

// --- Game State Variables ---
var spaceSelfPlan, set, isGameOver = false, planNumber = 0, scores = 0, highScores = 0;
var isMobileLayout = false;
var coinCount = 0, diamondCount = 0;
var playerLives = 3;
const MAX_LIVES = 3;
var isPlayerDead = false;
var isDragging = false;
var touchOffsetX = 0, touchOffsetY = 0;
var nextDiamondScore = 2000;
var isBossActive = false;
var bossSpawned = false;
var finalBossSpawned = false;
var postBossScoreThreshold = 0;
var revivalCountdownInterval = null;
var hasRevivedThisRound = false;

// --- Collections ---
var spaceEnemyPlans = [], planBullets = [], enemyBullets = [], activeExplosions = [], activeCoins = [], activeMagnets = [], activeShields = [], activeBolts = [], activeBoosters = [], activeDiamonds = [];
// --- Power-up State ---
var isMagnetActive = false, isShieldActive = false, isBoltActive = false, isSpeedBoostActive = false;
var magnetTimer = null, shieldTimer = null, boltTimer = null, coinGlowTimeout = null, speedBoostTimer = null, respawnTimeout = null, invincibilityTimeout = null;
var shieldBubbleNode;
// --- Background and Scaling ---
var bgLayer1, bgLayer2;
const backgrounds = ['background.png','background.png', 'background.png', 'background.png'];
let currentBgIndex1 = 0, currentBgIndex2 = 1;
var bgPos1 = 0, bgPos2 = 0;
var scaledBgHeight;
const scrollSpeed = 1.5;
const PORTRAIT_WIDTH = 320;
var scaleRatio = 1;
function scale(value) { return value * scaleRatio; }

// --- Game Object Constructors (No changes needed here) ---
function Explosion(centerX, centerY, displaySize) { const FRAME_WIDTH = 256; const FRAME_HEIGHT = 256; const COLS = 7; const TOTAL_FRAMES = 28; this.element = document.createElement("div"); this.currentFrame = 0; this.animationCounter = 0; this.init = function() { this.element.className = "explosion"; this.element.style.width = FRAME_WIDTH + "px"; this.element.style.height = FRAME_HEIGHT + "px"; this.element.style.left = (centerX - FRAME_WIDTH / 2) + "px"; this.element.style.top = (centerY - FRAME_HEIGHT / 2) + "px"; const scaleFactor = displaySize / FRAME_WIDTH; this.element.style.transform = `scale(${scaleFactor})`; gameDiv.appendChild(this.element); }; this.update = function() { this.animationCounter++; if (this.animationCounter % 2 === 0) { this.currentFrame++; } if (this.currentFrame >= TOTAL_FRAMES) { return false; } var row = Math.floor(this.currentFrame / COLS); var col = this.currentFrame % COLS; this.element.style.backgroundPosition = `-${col * FRAME_WIDTH}px -${row * FRAME_HEIGHT}px`; return true; }; this.init(); }
function PowerUp(sizeX, sizeY, speed, imageUrl) { const spawnX = random(scale(20), gameDiv.offsetWidth - scale(sizeX + 20)); this.x = spawnX; this.y = scale(-50); this.sizeX = scale(sizeX); this.sizeY = scale(sizeY); this.speed = scale(speed); this.imageNode = document.createElement("img"); this.move = function() { let currentScrollSpeed = isSpeedBoostActive ? scrollSpeed * 1.8 : scrollSpeed; this.imageNode.style.top = (this.imageNode.offsetTop + this.speed + currentScrollSpeed) + "px"; }; this.init = function() { this.imageNode.src = imageUrl; this.imageNode.style.left = this.x + "px"; this.imageNode.style.top = this.y + "px"; this.imageNode.style.width = this.sizeX + "px"; this.imageNode.style.height = this.sizeY + "px"; this.imageNode.classList.add('power-up-item'); gameDiv.appendChild(this.imageNode); }; this.init(); }
function Coin(x, y, sizeX, sizeY, score, speed, imageUrl) { this.x = x; this.y = y; this.sizeX = scale(sizeX); this.sizeY = scale(sizeY); this.score = score; this.speed = scale(speed); this.imageNode = document.createElement("img"); this.move = function() { if (isMagnetActive) { const playerCenterX = spaceSelfPlan.spaceImageNode.offsetLeft + spaceSelfPlan.sizeX / 2; const playerCenterY = spaceSelfPlan.spaceImageNode.offsetTop + spaceSelfPlan.sizeY / 2; const coinCenterX = this.imageNode.offsetLeft + this.sizeX / 2; const coinCenterY = this.imageNode.offsetTop + this.sizeY / 2; const deltaX = playerCenterX - coinCenterX; const deltaY = playerCenterY - coinCenterY; const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY); if (distance > 1) { const magnetSpeed = scale(8); this.imageNode.style.left = (this.imageNode.offsetLeft + (deltaX / distance) * magnetSpeed) + "px"; this.imageNode.style.top = (this.imageNode.offsetTop + (deltaY / distance) * magnetSpeed) + "px"; } } else { let currentScrollSpeed = isSpeedBoostActive ? scrollSpeed * 1.8 : scrollSpeed; this.imageNode.style.top = (this.imageNode.offsetTop + this.speed + currentScrollSpeed) + "px"; } }; this.init = function() { this.imageNode.src = imageUrl; this.imageNode.style.left = this.x + "px"; this.imageNode.style.top = this.y + "px"; this.imageNode.style.width = this.sizeX + "px"; this.imageNode.style.height = this.sizeY + "px"; gameDiv.appendChild(this.imageNode); }; this.init(); }
function spaceEnemyPlan(hp, sizeX, sizeY, score, speed, imageUrl, startY = -50) { const spawnX = random(0, gameDiv.offsetWidth - sizeX); spacePlan.call(this, hp, spawnX, startY, sizeX, sizeY, score, speed, imageUrl); }
function spacePlan(hp, X, Y, sizeX, sizeY, score, speed, imageUrl) { this.spacePlanhp = hp; this.scoreGameOver = score; this.sizeX = sizeX; this.sizeY = sizeY; this.spacePlanX = X; this.spacePlanY = Y; this.spacePlanSpeed = speed; this.spacePlanImageUrl = imageUrl; this.spaceImageNode = document.createElement("img"); this.isEntering = false; this.spacePlanMove = function() { if (this.isCrusher || this.isBoss) { if (isMobileLayout && this.mobileTargetY && this.spaceImageNode.offsetTop < this.mobileTargetY) { this.spaceImageNode.style.top = (this.spaceImageNode.offsetTop + scale(4)) + "px"; if (this.spaceImageNode.offsetTop >= this.mobileTargetY) { this.mobileTargetY = null; } return; } if (this.isEntering) { this.spaceImageNode.style.top = (this.spaceImageNode.offsetTop + 3) + "px"; if (this.spaceImageNode.offsetTop >= 10) { this.isEntering = false; } return; } if (this.isCrusher) { if (this.crusherState === 'patrolling') { this.spaceImageNode.style.left = (this.spaceImageNode.offsetLeft + this.bossSpeed * this.bossMoveDirection) + "px"; if (this.spaceImageNode.offsetLeft <= 0) { this.bossMoveDirection = 1; } if (this.spaceImageNode.offsetLeft >= gameDiv.offsetWidth - this.sizeX) { this.bossMoveDirection = -1; } this.attackTimer--; if (this.attackTimer <= 0 && spaceSelfPlan && !isPlayerDead) { this.crusherState = 'attacking'; } } else if (this.crusherState === 'attacking') { this.spaceImageNode.style.top = (this.spaceImageNode.offsetTop + scale(15)) + "px"; if (this.spaceImageNode.offsetTop >= gameDiv.offsetHeight - this.sizeY) { this.crusherState = 'returning'; } } else if (this.crusherState === 'returning') { this.spaceImageNode.style.top = (this.spaceImageNode.offsetTop - scale(10)) + "px"; if (this.spaceImageNode.offsetTop <= this.initialY) { this.spaceImageNode.style.top = this.initialY + "px"; this.crusherState = 'patrolling'; this.attackTimer = random(100, 250); } } } else if (this.isBoss) { this.bossMoveTimer--; if (this.bossMoveTimer <= 0) { this.bossMoveDirection = (Math.random() < 0.5) ? 1 : -1; this.bossMoveTimer = random(100, 200); } this.spaceImageNode.style.left = (this.spaceImageNode.offsetLeft + this.bossSpeed * this.bossMoveDirection) + "px"; if (this.spaceImageNode.offsetLeft <= 0) { this.bossMoveDirection = 1; } if (this.spaceImageNode.offsetLeft >= gameDiv.offsetWidth - this.sizeX) { this.bossMoveDirection = -1; } } return; } if (this.isBouncingMinion) { this.spaceImageNode.style.top = (this.spaceImageNode.offsetTop + this.speedY) + "px"; this.spaceImageNode.style.left = (this.spaceImageNode.offsetLeft + this.speedX) + "px"; if (this.spaceImageNode.offsetLeft <= 0) { this.speedX *= -1; this.spaceImageNode.style.left = "1px"; } if (this.spaceImageNode.offsetLeft >= gameDiv.offsetWidth - this.sizeX) { this.speedX *= -1; this.spaceImageNode.style.left = (gameDiv.offsetWidth - this.sizeX - 1) + "px"; } if (this.spaceImageNode.offsetTop <= 0) { this.speedY *= -1; this.spaceImageNode.style.top = "1px"; } if (this.spaceImageNode.offsetTop >= gameDiv.offsetHeight - this.sizeY) { this.speedY *= -1; this.spaceImageNode.style.top = (gameDiv.offsetHeight - this.sizeY - 1) + "px"; } return; } if (this.isHoming && spaceSelfPlan && !isPlayerDead && !spaceSelfPlan.spaceImageNode.classList.contains('invincible-flash')) { const playerCenterX = spaceSelfPlan.spaceImageNode.offsetLeft + spaceSelfPlan.sizeX / 2; const playerCenterY = spaceSelfPlan.spaceImageNode.offsetTop + spaceSelfPlan.sizeY / 2; const enemyCenterX = this.spaceImageNode.offsetLeft + this.sizeX / 2; const enemyCenterY = this.spaceImageNode.offsetTop + this.sizeY / 2; const deltaX = playerCenterX - enemyCenterX; const deltaY = playerCenterY - enemyCenterY; const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI - 90; this.spaceImageNode.style.transform = 'rotate(' + angle + 'deg)'; const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY); if (distance > 1) { const homingSpeed = scale(8.5); this.spaceImageNode.style.left = (this.spaceImageNode.offsetLeft + (deltaX / distance) * homingSpeed) + "px"; this.spaceImageNode.style.top = (this.spaceImageNode.offsetTop + (deltaY / distance) * homingSpeed) + "px"; } } else { if (this.isHoming) { this.spaceImageNode.style.top = (this.spaceImageNode.offsetTop + scale(1.5)) + "px"; } let currentScrollSpeed = isSpeedBoostActive ? scrollSpeed * 1.8 : scrollSpeed; if (this.isEntering) { this.spaceImageNode.style.top = (this.spaceImageNode.offsetTop + 3 + currentScrollSpeed) + "px"; if (this.spaceImageNode.offsetTop >= 10) { this.isEntering = false; } } else { var speedMultiplier = 1; if (scores > 2000) speedMultiplier = 1.8; else if (scores > 1000) speedMultiplier = 1.4; else if (scores > 500) speedMultiplier = 1.2; let totalSpeed = (scale(this.spacePlanSpeed) * speedMultiplier) + currentScrollSpeed; this.spaceImageNode.style.top = this.spaceImageNode.offsetTop + totalSpeed + "px"; } if (this.isZigzag) { this.spaceImageNode.style.left = (this.spaceImageNode.offsetLeft + this.zigzagSpeed * this.zigzagDirection) + "px"; if (this.spaceImageNode.offsetLeft <= 0) { this.zigzagDirection = 1; } if (this.spaceImageNode.offsetLeft >= gameDiv.offsetWidth - this.sizeX) { this.zigzagDirection = -1; } } } }; this.init = function() { this.spaceImageNode.style.left = this.spacePlanX + "px"; this.spaceImageNode.style.top = this.spacePlanY + "px"; this.spaceImageNode.style.width = this.sizeX + "px"; this.spaceImageNode.style.height = this.sizeY + "px"; this.spaceImageNode.src = imageUrl; gameDiv.appendChild(this.spaceImageNode); }; this.init(); }
function planBullet(X, Y, sizeX, sizeY, imageUrl) { this.planBulletX = X; this.planBulletY = Y; this.planBulletAttach = 1; this.planBulletsizeX = scale(sizeX); this.planBulletsizeY = scale(sizeY); this.planBulletimageUrl = imageUrl; this.planBulletimage = document.createElement("img"); this.planBulletMove = function() { let speed = isBoltActive ? scale(25) : scale(20); if(isSpeedBoostActive) { speed *= 1.5; } this.planBulletimage.style.top = this.planBulletimage.offsetTop - speed + "px"; }; this.init = function() { this.planBulletimage.style.left = this.planBulletX + "px"; this.planBulletimage.style.top = this.planBulletY + "px"; this.planBulletimage.style.width = this.planBulletsizeX + "px"; this.planBulletimage.style.height = this.planBulletsizeY + "px"; this.planBulletimage.src = imageUrl; gameDiv.appendChild(this.planBulletimage); }; this.init(); }
function spaceOddBullet(X, Y) { const width = isBoltActive ? 10 : 6; const height = isBoltActive ? 22 : 14; planBullet.call(this, X, Y, width, height, "images/bullet.png"); }
function EnemyBullet(X, Y) { this.bullet = document.createElement("img"); this.move = function() { this.bullet.style.top = (this.bullet.offsetTop + scale(8)) + "px"; }; this.init = function() { this.bullet.src = "images/bullet_enemy.png"; this.bullet.style.left = X + "px"; this.bullet.style.top = Y + "px"; this.bullet.style.width = scale(15) + "px"; this.bullet.style.height = scale(32) + "px"; gameDiv.appendChild(this.bullet); }; this.init(); }
function spaceOurPlan(imageUrl, width, height) { const planeWidth = width || 120; const planeHeight = height || 144; const initialX = (gameDiv.offsetWidth / 2) - (scale(planeWidth) / 2); const initialY = gameDiv.offsetHeight - scale(planeHeight + 20); const finalImageUrl = imageUrl || "images/plane-c.png"; spacePlan.call(this, 1, initialX, initialY, scale(planeWidth), scale(planeHeight), 0, 0, finalImageUrl); this.spaceImageNode.setAttribute('id', 'spaceOurPlan'); }

function random(min, max) { return Math.floor(min + Math.random() * (max - min)); }
function spawnCoinTrail() { const startX = random(scale(20), gameDiv.offsetWidth - scale(68)); const startY = scale(-50); const gap = scale(60); for (let i = 0; i < 5; i++) { activeCoins.push(new Coin(startX, startY - (i * gap), 48, 48, 5, 2.5, "images/coin.png")); } }
var planShift = function(clientX, clientY) { if (isGameOver || isPlayerDead) return; const rect = gameDiv.getBoundingClientRect(); const mouseX = clientX - rect.left; const mouseY = clientY - rect.top; var newX = mouseX - touchOffsetX; var newY = mouseY - touchOffsetY; newX = Math.max(0, Math.min(newX, gameDiv.offsetWidth - spaceSelfPlan.sizeX)); newY = Math.max(0, Math.min(newY, gameDiv.offsetHeight - spaceSelfPlan.sizeY)); spaceSelfPlan.spaceImageNode.style.left = newX + "px"; spaceSelfPlan.spaceImageNode.style.top = newY + "px"; }
var gameSuspend = function() {
    if (isGameOver || revivalPopup1.style.display !== 'none' || revivalPopup2.style.display !== 'none') return;
    if (planNumber == 0) {
        clearInterval(set);
        planNumber = 1;
        pauseBtn.classList.add("paused");
    } else {
        set = setInterval(beginGame, 20);
        planNumber = 0;
        pauseBtn.classList.remove("paused");
    }
}

function updateLivesDisplay() {
    livesDiv.innerHTML = '';
    for (let i = 0; i < MAX_LIVES; i++) {
        let heart = document.createElement('img');
        if (i < playerLives) {
            heart.src = 'Ui/heart_full.png';
        } else {
            heart.src = 'Ui/heart_empty.png';
        }
        livesDiv.appendChild(heart);
    }
}

// --- Main Game Loop ---
var mark = 0, mark1 = 0;
function beginGame() {
    scoreLabel.innerHTML = scores;
    coinCountLabel.innerHTML = coinCount;
    diamondCountLabel.innerHTML = diamondCount;
    let currentScrollSpeed = isSpeedBoostActive ? scrollSpeed * 1.8 : scrollSpeed;
    bgPos1 += currentScrollSpeed; bgPos2 += currentScrollSpeed; if (bgPos1 >= gameDiv.offsetHeight) { currentBgIndex1 = (currentBgIndex1 + 2) % backgrounds.length; bgLayer1.style.backgroundImage = `url(images/${backgrounds[currentBgIndex1]})`; bgPos1 = bgPos2 - scaledBgHeight; } if (bgPos2 >= gameDiv.offsetHeight) { currentBgIndex2 = (currentBgIndex2 + 2) % backgrounds.length; bgLayer2.style.backgroundImage = `url(images/${backgrounds[currentBgIndex2]})`; bgPos2 = bgPos1 - scaledBgHeight; } bgLayer1.style.top = bgPos1 + 'px'; bgLayer2.style.top = bgPos2 + 'px';
    mark++;
    
    // Your existing spawning logic... (no changes needed)
    if (scores >= 6200 && !bossSpawned) { for (let i = spaceEnemyPlans.length - 1; i >= 0; i--) { gameDiv.removeChild(spaceEnemyPlans[i].spaceImageNode); } spaceEnemyPlans = []; isBossActive = true; bossSpawned = true; let bossSizeX, bossSizeY; if (isMobileLayout) { bossSizeX = scale(160); bossSizeY = scale(96); } else { bossSizeX = scale(200); bossSizeY = scale(120); } let boss = new spaceEnemyPlan(1200, bossSizeX, bossSizeY, 5000, 0, 'images/enemy-5.png', scale(-300)); if (isMobileLayout) { boss.mobileTargetY = scale(100); boss.isEntering = false; } boss.isBoss = true; boss.bossSpeed = scale(2.5); boss.bossMoveTimer = 100; boss.bossMoveDirection = 1; boss.fireCooldown = 100; boss.fireTimer = 0; boss.isEntering = true; spaceEnemyPlans.push(boss); }
    if (postBossScoreThreshold > 0 && scores >= postBossScoreThreshold && !finalBossSpawned) { for (let i = spaceEnemyPlans.length - 1; i >= 0; i--) { gameDiv.removeChild(spaceEnemyPlans[i].spaceImageNode); } spaceEnemyPlans = []; isBossActive = true; finalBossSpawned = true; const initialBossY = scale(-300); let crusherSizeX, crusherSizeY; if (isMobileLayout) { crusherSizeX = scale(113); crusherSizeY = scale(70); } else { crusherSizeX = scale(200); crusherSizeY = scale(125); } let crusher = new spaceEnemyPlan(1500, crusherSizeX, crusherSizeY, 10000, 0, 'images/enemy-7.png', initialBossY); if (isMobileLayout) { crusher.mobileTargetY = scale(100); crusher.initialY = scale(100); crusher.isEntering = false; } else { crusher.initialY = 10; } crusher.isCrusher = true; crusher.initialY = 10; crusher.bossSpeed = scale(4); crusher.bossMoveDirection = 1; crusher.crusherState = 'patrolling'; crusher.attackTimer = 150; crusher.isEntering = true; spaceEnemyPlans.push(crusher); }
    if (!isBossActive && mark >= 20) { mark1++; const isLandscape = gameDiv.offsetWidth > gameDiv.offsetHeight; const enemySizeMultiplier = isLandscape ? 2.0 : 1.5; let healthBonus = 0; if (scores > 2500) { healthBonus = 2; } else if (scores > 1000) { healthBonus = 1; } let spawnData = null; if (bossSpawned) { if (mark1 % 15 === 0) { spawnData = { type: 'homing', hp: 4, w: 58, h: 58, score: 100, speed: 7, img: "images/enemy-4.png" }; } if (mark1 % 20 === 0) { spawnData = { type: 'large', hp: 12, w: 80, h: 120, score: 300, speed: 1.5, img: "images/enemy-2.png" }; } if (mark1 % 4 === 0) { spawnData = { type: 'small', hp: 1, w: 34, h: 24, score: 10, speed: random(2, 5), img: "images/enemy-1.png" }; } } else { if (mark1 % 6 === 0) { spawnData = { type: 'medium', hp: 6, w: 60, h: 60, score: 50, speed: random(2, 4), img: "images/enemy-3.png" }; } if (mark1 % 25 === 0 && mark1 > 0) { spawnData = { type: 'large', hp: 12, w: 110, h: 164, score: 300, speed: 1.5, img: "images/enemy-2.png" }; } else if (mark1 % 3 === 0) { if (scores >= 3286 && scores < 5786) { spawnData = { type: 'homing', hp: 4, w: 58, h: 58, score: 100, speed: 3, img: "images/enemy-4.png" }; } else if (scores >= 786 && scores < 2786) { let zigzagCount = 0; for (const enemy of spaceEnemyPlans) { if (enemy.isZigzag) { zigzagCount++; } } if (zigzagCount < 2) { spawnData = { type: 'zigzag', hp: 2, w: 60, h: 60, score: 75, speed: 2, img: "images/enemy-3.png" }; } } else { spawnData = { type: 'small', hp: 1, w: 34, h: 24, score: 10, speed: random(2, 5), img: "images/enemy-1.png" }; } } } if (spawnData) { let finalW = scale(spawnData.w * enemySizeMultiplier); let finalH = scale(spawnData.h * enemySizeMultiplier); let spawnX = random(0, gameDiv.offsetWidth - finalW); let canSpawn = true; for (const enemy of spaceEnemyPlans) { if (Math.abs((spawnX + finalW / 2) - (enemy.spaceImageNode.offsetLeft + enemy.sizeX / 2)) < (finalW / 2 + enemy.sizeX / 2) && Math.abs(-finalH - (enemy.spaceImageNode.offsetTop + enemy.sizeY / 2)) < 100) { canSpawn = false; break; } } if (canSpawn) { let startY = spawnData.type === 'large' ? -finalH : scale(-50); let newEnemy = new spaceEnemyPlan(spawnData.hp + healthBonus, finalW, finalH, spawnData.score, spawnData.speed, spawnData.img, startY); if (spawnData.type === 'large') { newEnemy.isEntering = true; } if (spawnData.type === 'zigzag') { newEnemy.isZigzag = true; newEnemy.zigzagSpeed = scale(3); newEnemy.zigzagDirection = (Math.random() < 0.5) ? 1 : -1; newEnemy.fireCooldown = 100; newEnemy.fireTimer = random(0, 100); } if (spawnData.type === 'homing') { newEnemy.isHoming = true; } spaceEnemyPlans.push(newEnemy); } } if (mark1 % 5 === 2) { spawnCoinTrail(); } const powerUpSize = 64; if (mark1 % 150 === 50) { activeMagnets.push(new PowerUp(powerUpSize, powerUpSize, 2.0, "images/magnet.png")); } if (mark1 % 250 === 100) { activeShields.push(new PowerUp(powerUpSize, powerUpSize, 2.0, "images/shield.png")); } if (mark1 % 90 === 30) { activeBolts.push(new PowerUp(powerUpSize, powerUpSize, 2.0, "images/bolt.png")); } if (mark1 % 499 === 150) { activeBoosters.push(new PowerUp(powerUpSize, powerUpSize, 2.5, "images/booster.png")); } if (scores >= nextDiamondScore) { activeDiamonds.push(new PowerUp(70, 70, 2.0, "images/diamond.png")); nextDiamondScore += 2000; } if (mark1 >= 500) { mark1 = 0; } }
    
    // Your existing move and collision logic... (no changes needed)
    if (mark >= 20) { mark = 0; } if (isShieldActive) { const player = spaceSelfPlan.spaceImageNode; shieldBubbleNode.style.left = (player.offsetLeft + player.offsetWidth / 2 - shieldBubbleNode.offsetWidth / 2) + 'px'; shieldBubbleNode.style.top = (player.offsetTop + player.offsetHeight / 2 - shieldBubbleNode.offsetHeight / 2) + 'px'; } for (let i = spaceEnemyPlans.length - 1; i >= 0; i--) { let enemy = spaceEnemyPlans[i]; enemy.spacePlanMove(); if (enemy.isBoss && !enemy.isEntering) { enemy.fireTimer++; if (enemy.fireTimer >= enemy.fireCooldown && !isPlayerDead && spaceSelfPlan && !spaceSelfPlan.spaceImageNode.classList.contains('invincible-flash')) { const minionSize = scale(35); const spawnX = enemy.spaceImageNode.offsetLeft + (enemy.sizeX / 2) - (minionSize / 2); const spawnY = enemy.spaceImageNode.offsetTop + enemy.sizeY; let minion1 = new spacePlan(2, spawnX, spawnY, minionSize, minionSize, 20, 0, 'images/enemy-6.png'); minion1.isBouncingMinion = true; minion1.speedX = scale(-5); minion1.speedY = scale(6.5); spaceEnemyPlans.push(minion1); let minion2 = new spacePlan(2, spawnX, spawnY, minionSize, minionSize, 20, 0, 'images/enemy-6.png'); minion2.isBouncingMinion = true; minion2.speedX = 0; minion2.speedY = scale(4.5); spaceEnemyPlans.push(minion2); let minion3 = new spacePlan(2, spawnX, spawnY, minionSize, minionSize, 20, 0, 'images/enemy-6.png'); minion3.isBouncingMinion = true; minion3.speedX = scale(5); minion3.speedY = scale(6.5); spaceEnemyPlans.push(minion3); enemy.fireTimer = 0; } } if (enemy.isZigzag && !enemy.isEntering) { enemy.fireTimer++; if (enemy.fireTimer >= enemy.fireCooldown) { let bulletY = enemy.spaceImageNode.offsetTop + enemy.sizeY; let bulletLeftX = enemy.spaceImageNode.offsetLeft + enemy.sizeX * 0.1; let bulletRightX = enemy.spaceImageNode.offsetLeft + enemy.sizeX * 0.8; enemyBullets.push(new EnemyBullet(bulletLeftX, bulletY)); enemyBullets.push(new EnemyBullet(bulletRightX, bulletY)); playSound(enemyBulletSound); enemy.fireTimer = 0; } } if (enemy.spaceImageNode.offsetTop > gameDiv.offsetHeight && !enemy.isBouncingMinion && !enemy.isBoss && !enemy.isCrusher) { gameDiv.removeChild(enemy.spaceImageNode); spaceEnemyPlans.splice(i, 1); } } let fireInterval = isBoltActive ? 4 : 5; if (mark % fireInterval == 0 && !isPlayerDead) { const myPlanNode = spaceSelfPlan.spaceImageNode; const centerX = myPlanNode.offsetLeft + myPlanNode.offsetWidth / 2; const selectedPlane = localStorage.getItem('selectedPlane') || 'plane-c'; if (isBoltActive) { planBullets.push(new spaceOddBullet(centerX - scale(30), myPlanNode.offsetTop)); planBullets.push(new spaceOddBullet(centerX - scale(3), myPlanNode.offsetTop)); planBullets.push(new spaceOddBullet(centerX + scale(24), myPlanNode.offsetTop)); } else { switch (selectedPlane) { case 'plane-c1': planBullets.push(new spaceOddBullet(centerX - scale(15), myPlanNode.offsetTop)); planBullets.push(new spaceOddBullet(centerX + scale(12), myPlanNode.offsetTop)); break; case 'plane-c2': planBullets.push(new spaceOddBullet(centerX - scale(25), myPlanNode.offsetTop)); planBullets.push(new spaceOddBullet(centerX - scale(3), myPlanNode.offsetTop)); planBullets.push(new spaceOddBullet(centerX + scale(19), myPlanNode.offsetTop)); break; case 'plane-c3': planBullets.push(new spaceOddBullet(centerX - scale(30), myPlanNode.offsetTop - scale(10))); planBullets.push(new spaceOddBullet(centerX - scale(10), myPlanNode.offsetTop)); planBullets.push(new spaceOddBullet(centerX + scale(8), myPlanNode.offsetTop)); planBullets.push(new spaceOddBullet(centerX + scale(28), myPlanNode.offsetTop - scale(10))); break; default: planBullets.push(new spaceOddBullet(centerX - scale(3), myPlanNode.offsetTop)); break; } } playSound(bulletSound); } for (let i = planBullets.length - 1; i >= 0; i--) { planBullets[i].planBulletMove(); if (planBullets[i].planBulletimage.offsetTop < -planBullets[i].planBulletsizeY) { gameDiv.removeChild(planBullets[i].planBulletimage); planBullets.splice(i, 1); } } for (let i = enemyBullets.length - 1; i >= 0; i--) { enemyBullets[i].move(); if (enemyBullets[i].bullet.offsetTop > gameDiv.offsetHeight) { gameDiv.removeChild(enemyBullets[i].bullet); enemyBullets.splice(i, 1); } } for (let i = activeCoins.length - 1; i >= 0; i--) { activeCoins[i].move(); if (activeCoins[i].imageNode.offsetTop > gameDiv.offsetHeight) { gameDiv.removeChild(activeCoins[i].imageNode); activeCoins.splice(i, 1); } } for (let i = activeMagnets.length - 1; i >= 0; i--) { activeMagnets[i].move(); if (activeMagnets[i].imageNode.offsetTop > gameDiv.offsetHeight) { gameDiv.removeChild(activeMagnets[i].imageNode); activeMagnets.splice(i, 1); } } for (let i = activeShields.length - 1; i >= 0; i--) { activeShields[i].move(); if (activeShields[i].imageNode.offsetTop > gameDiv.offsetHeight) { gameDiv.removeChild(activeShields[i].imageNode); activeShields.splice(i, 1); } } for (let i = activeBolts.length - 1; i >= 0; i--) { activeBolts[i].move(); if (activeBolts[i].imageNode.offsetTop > gameDiv.offsetHeight) { gameDiv.removeChild(activeBolts[i].imageNode); activeBolts.splice(i, 1); } } for (let i = activeBoosters.length - 1; i >= 0; i--) { activeBoosters[i].move(); if (activeBoosters[i].imageNode.offsetTop > gameDiv.offsetHeight) { gameDiv.removeChild(activeBoosters[i].imageNode); activeBoosters.splice(i, 1); } } for (let i = activeDiamonds.length - 1; i >= 0; i--) { activeDiamonds[i].move(); if (activeDiamonds[i].imageNode.offsetTop > gameDiv.offsetHeight) { gameDiv.removeChild(activeDiamonds[i].imageNode); activeDiamonds.splice(i, 1); } } for (let k = planBullets.length - 1; k >= 0; k--) { for (let j = spaceEnemyPlans.length - 1; j >= 0; j--) { const bullet = planBullets[k]; const enemy = spaceEnemyPlans[j]; if (bullet && enemy && bullet.planBulletimage.offsetLeft < enemy.spaceImageNode.offsetLeft + enemy.sizeX && bullet.planBulletimage.offsetLeft + bullet.planBulletsizeX > enemy.spaceImageNode.offsetLeft && bullet.planBulletimage.offsetTop < enemy.spaceImageNode.offsetTop + enemy.sizeY && bullet.planBulletimage.offsetTop + bullet.planBulletsizeY > enemy.spaceImageNode.offsetTop) { enemy.spacePlanhp -= bullet.planBulletAttach; gameDiv.removeChild(bullet.planBulletimage); planBullets.splice(k, 1); if (enemy.spacePlanhp <= 0) { scores += enemy.scoreGameOver; const centerX = enemy.spaceImageNode.offsetLeft + enemy.sizeX / 2; const centerY = enemy.spaceImageNode.offsetTop + enemy.sizeY / 2; activeExplosions.push(new Explosion(centerX, centerY, enemy.sizeX * 1.5)); playSound(explodeSound); if (enemy.isBoss) { isBossActive = false; postBossScoreThreshold = scores + 1000; spawnCoinTrail(); spawnCoinTrail(); spawnCoinTrail(); } else if (enemy.isCrusher) { isBossActive = false; } gameDiv.removeChild(enemy.spaceImageNode); spaceEnemyPlans.splice(j, 1); } break; } } } if (!isPlayerDead) { for (let j = spaceEnemyPlans.length - 1; j >= 0; j--) { const enemy = spaceEnemyPlans[j]; const player = spaceSelfPlan.spaceImageNode; const playerHitboxOffsetY = player.offsetHeight * 0.2; if (enemy.spaceImageNode.offsetLeft < player.offsetLeft + player.offsetWidth && enemy.spaceImageNode.offsetLeft + enemy.sizeX > player.offsetLeft && enemy.spaceImageNode.offsetTop < player.offsetTop + player.offsetHeight - playerHitboxOffsetY && enemy.spaceImageNode.offsetTop + enemy.sizeY > player.offsetTop) { if (player.classList.contains('invincible-flash')) continue; if (isShieldActive) { playSound(explodeSound); const centerX = enemy.spaceImageNode.offsetLeft + enemy.sizeX / 2; const centerY = enemy.spaceImageNode.offsetTop + enemy.sizeY / 2; activeExplosions.push(new Explosion(centerX, centerY, enemy.sizeX * 1.5)); gameDiv.removeChild(enemy.spaceImageNode); spaceEnemyPlans.splice(j, 1); } else { handlePlayerDeath(); } } } for (let i = enemyBullets.length - 1; i >= 0; i--) { const bullet = enemyBullets[i].bullet; const player = spaceSelfPlan.spaceImageNode; if (bullet.offsetLeft < player.offsetLeft + player.offsetWidth && bullet.offsetLeft + bullet.offsetWidth > player.offsetLeft && bullet.offsetTop < player.offsetTop + player.offsetHeight && bullet.offsetTop + bullet.offsetHeight > player.offsetTop) { if (player.classList.contains('invincible-flash')) continue; if (isShieldActive) { gameDiv.removeChild(bullet); enemyBullets.splice(i, 1); } else { handlePlayerDeath(); } } } for (let i = activeCoins.length - 1; i >= 0; i--) { const coin = activeCoins[i]; const player = spaceSelfPlan.spaceImageNode; if (coin.imageNode.offsetLeft < player.offsetLeft + player.offsetWidth && coin.imageNode.offsetLeft + coin.sizeX > player.offsetLeft && coin.imageNode.offsetTop < player.offsetTop + player.offsetHeight && coin.imageNode.offsetTop + coin.sizeY > player.offsetTop) { playSound(coinSound); scores += coin.score; coinCount++; clearTimeout(coinGlowTimeout); player.classList.add('plane-glow'); coinGlowTimeout = setTimeout(() => { player.classList.remove('plane-glow'); }, 200); gameDiv.removeChild(coin.imageNode); activeCoins.splice(i, 1); } } for (let i = activeMagnets.length - 1; i >= 0; i--) { const magnet = activeMagnets[i]; const player = spaceSelfPlan.spaceImageNode; if (magnet.imageNode.offsetLeft < player.offsetLeft + player.offsetWidth && magnet.imageNode.offsetLeft + magnet.sizeX > player.offsetLeft && magnet.imageNode.offsetTop < player.offsetTop + player.offsetHeight && magnet.imageNode.offsetTop + magnet.sizeY > player.offsetTop) { playSound(boosterSound); isMagnetActive = true; clearTimeout(magnetTimer); const magnetDuration = (parseInt(localStorage.getItem('magnetTime') || '8')) * 1000; magnetTimer = setTimeout(() => { isMagnetActive = false; }, magnetDuration); gameDiv.removeChild(magnet.imageNode); activeMagnets.splice(i, 1); } } for (let i = activeShields.length - 1; i >= 0; i--) { const shield = activeShields[i]; const player = spaceSelfPlan.spaceImageNode; if (shield.imageNode.offsetLeft < player.offsetLeft + player.offsetWidth && shield.imageNode.offsetLeft + shield.sizeX > player.offsetLeft && shield.imageNode.offsetTop < player.offsetTop + player.offsetHeight && shield.imageNode.offsetTop + shield.sizeY > player.offsetTop) { playSound(boosterSound); isShieldActive = true; shieldBubbleNode.style.display = 'block'; clearTimeout(shieldTimer); const shieldDuration = (parseInt(localStorage.getItem('shieldTime') || '10')) * 1000; shieldTimer = setTimeout(() => { isShieldActive = false; shieldBubbleNode.style.display = 'none'; }, shieldDuration); gameDiv.removeChild(shield.imageNode); activeShields.splice(i, 1); } } for (let i = activeBolts.length - 1; i >= 0; i--) { const bolt = activeBolts[i]; const player = spaceSelfPlan.spaceImageNode; if (bolt.imageNode.offsetLeft < player.offsetLeft + player.offsetWidth && bolt.imageNode.offsetLeft + bolt.sizeX > player.offsetLeft && bolt.imageNode.offsetTop < player.offsetTop + player.offsetHeight && bolt.imageNode.offsetTop + bolt.sizeY > player.offsetTop) { playSound(boosterSound); isBoltActive = true; clearTimeout(boltTimer); const boltDuration = (parseInt(localStorage.getItem('boltTime') || '10')) * 1000; boltTimer = setTimeout(() => { isBoltActive = false; }, boltDuration); gameDiv.removeChild(bolt.imageNode); activeBolts.splice(i, 1); } } for (let i = activeBoosters.length - 1; i >= 0; i--) { const booster = activeBoosters[i]; const player = spaceSelfPlan.spaceImageNode; if (booster.imageNode.offsetLeft < player.offsetLeft + player.offsetWidth && booster.imageNode.offsetLeft + booster.sizeX > player.offsetLeft && booster.imageNode.offsetTop < player.offsetTop + player.offsetHeight && booster.imageNode.offsetTop + booster.sizeY > player.offsetTop) { playSound(boosterSound); const magnetDuration = (parseInt(localStorage.getItem('magnetTime') || '8')) * 1000; const boltDuration = (parseInt(localStorage.getItem('boltTime') || '10')) * 1000; const speedDuration = (parseInt(localStorage.getItem('speedTime') || '6')) * 1000; const shieldDuration = (parseInt(localStorage.getItem('shieldTime') || '10')) * 1000; isMagnetActive = true; clearTimeout(magnetTimer); magnetTimer = setTimeout(() => { isMagnetActive = false; }, magnetDuration); isBoltActive = true; clearTimeout(boltTimer); boltTimer = setTimeout(() => { isBoltActive = false; }, boltDuration); isSpeedBoostActive = true; clearTimeout(speedBoostTimer); speedBoostTimer = setTimeout(() => { isSpeedBoostActive = false; }, speedDuration); isShieldActive = true; shieldBubbleNode.style.display = 'block'; clearTimeout(shieldTimer); shieldTimer = setTimeout(() => { isShieldActive = false; shieldBubbleNode.style.display = 'none'; }, shieldDuration); gameDiv.removeChild(booster.imageNode); activeBoosters.splice(i, 1); } } for (let i = activeDiamonds.length - 1; i >= 0; i--) { const diamond = activeDiamonds[i]; const player = spaceSelfPlan.spaceImageNode; if (diamond.imageNode.offsetLeft < player.offsetLeft + player.offsetWidth && diamond.imageNode.offsetLeft + diamond.sizeX > player.offsetLeft && diamond.imageNode.offsetTop < player.offsetTop + player.offsetHeight && diamond.imageNode.offsetTop + diamond.sizeY > player.offsetTop) { playSound(coinSound); diamondCount++; gameDiv.removeChild(diamond.imageNode); activeDiamonds.splice(i, 1); } } } for (let i = activeExplosions.length - 1; i >= 0; i--) { if (!activeExplosions[i].update()) { gameDiv.removeChild(activeExplosions[i].element); activeExplosions.splice(i, 1); } }
}

function handlePlayerDeath() {
    playSound(explodeSound);
    playerLives--;
    updateLivesDisplay();
    isPlayerDead = true;
    activeExplosions.push(new Explosion(spaceSelfPlan.spaceImageNode.offsetLeft + spaceSelfPlan.sizeX / 2, spaceSelfPlan.spaceImageNode.offsetTop + spaceSelfPlan.sizeY / 2, spaceSelfPlan.sizeX * 1.5));
    spaceSelfPlan.spaceImageNode.style.display = 'none';
    if (playerLives <= 0 && !hasRevivedThisRound) {
        hasRevivedThisRound = true;
        setTimeout(() => {
            clearInterval(set);
            showFirstRevivalPopup();
        }, 800);
    } else if (playerLives <= 0 && hasRevivedThisRound) {
        setTimeout(triggerRealGameOver, 1000);
    } else {
        respawnTimeout = setTimeout(respawnPlayer, 2000);
    }
}

function showFirstRevivalPopup() {
    gameDiv.classList.add('cursor-visible'); 
    let timeLeft = 6;
    revivalTimerLabel.textContent = timeLeft;
    revivalPopup1.style.display = 'flex';
    revivalCountdownInterval = setInterval(() => {
        timeLeft--;
        revivalTimerLabel.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(revivalCountdownInterval);
            revivalPopup1.style.display = 'none';
            triggerRealGameOver();
        }
    }, 1000);
}

function triggerRealGameOver() {
    console.log("Game Over triggered.");
    localStorage.setItem('sessionScore', scores);
    localStorage.setItem('sessionCoins', coinCount);
    localStorage.setItem('sessionDiamonds', diamondCount);
    let currentTotalCoins = parseInt(localStorage.getItem('savedCoins') || '0');
    let currentTotalDiamonds = parseInt(localStorage.getItem('savedDiamonds') || '0');
    currentTotalCoins += coinCount;
    currentTotalDiamonds += diamondCount;
    localStorage.setItem('savedCoins', currentTotalCoins);
    localStorage.setItem('savedDiamonds', currentTotalDiamonds);

    adBreak({
        type: 'next',
        name: 'gameOver',
        beforeAd: () => { 
            console.log("Ad about to show. Pausing game.");
            musicSound.muted = true; 
        },
        afterAd: () => { 
            console.log("Ad finished. Resuming game logic.");
            musicSound.muted = isMusicMuted;
            if (scores > highScores) {
                localStorage.setItem('highScores', scores);
                window.location.replace('high_score.html');
            } else {
                window.location.replace('game_over.html');
            }
        }
    });
}

function respawnPlayer() {
    isPlayerDead = false;
    const planeWidth = 99; const initialX = (gameDiv.offsetWidth / 2) - (scale(planeWidth) / 2);
    const initialY = gameDiv.offsetHeight - scale(120 + 20);
    spaceSelfPlan.spaceImageNode.style.left = initialX + 'px';
    spaceSelfPlan.spaceImageNode.style.top = initialY + 'px';
    spaceSelfPlan.spaceImageNode.style.display = 'block';
    spaceSelfPlan.spaceImageNode.classList.add('invincible-flash');
    invincibilityTimeout = setTimeout(() => {
        spaceSelfPlan.spaceImageNode.classList.remove('invincible-flash');
    }, 3000);
}

function initGame() {
    set = setInterval(beginGame, 20);
}

function startGame() {
    bgLayer1 = document.getElementById('bgLayer1');
    bgLayer2 = document.getElementById('bgLayer2');
    shieldBubbleNode = document.getElementById('shieldBubble');
    const finalWidth = gameDiv.offsetWidth;
    const finalHeight = gameDiv.offsetHeight;
    if (finalWidth > finalHeight) { scaleRatio = 1; } else { scaleRatio = finalWidth / PORTRAIT_WIDTH; }
    isMobileLayout = finalHeight > finalWidth;    
    highScores = localStorage.getItem('highScores') || 0;
    updateLivesDisplay(); 
    const bgAspectRatio = 7488 / 1200;
    scaledBgHeight = gameDiv.offsetWidth * bgAspectRatio;
    bgLayer1.style.height = scaledBgHeight + 'px';
    bgLayer2.style.height = scaledBgHeight + 'px';
    bgLayer1.style.backgroundImage = `url(images/${backgrounds[currentBgIndex1]})`;
    bgLayer2.style.backgroundImage = `url(images/${backgrounds[currentBgIndex2]})`;
    bgPos1 = gameDiv.offsetHeight - scaledBgHeight;
    bgPos2 = bgPos1 - scaledBgHeight;
    bgLayer1.style.top = bgPos1 + 'px';
    bgLayer2.style.top = bgPos2 + 'px';
    let playerPlaneWidth, playerPlaneHeight;
    if (isMobileLayout) {
        playerPlaneWidth = 99;
        playerPlaneHeight = 120;
    } else {
        playerPlaneWidth = 120;
        playerPlaneHeight = 144;
    }
    const selectedPlane = localStorage.getItem('selectedPlane') || 'plane-c';
    spaceSelfPlan = new spaceOurPlan(`images/${selectedPlane}.png`, playerPlaneWidth, playerPlaneHeight);
    spaceSelfPlan.spaceImageNode.style.display = "block";
    shieldBubbleNode.style.width = (spaceSelfPlan.sizeX * 1.5) + 'px';
    shieldBubbleNode.style.height = (spaceSelfPlan.sizeY * 1.5) + 'px';

    isMusicMuted = localStorage.getItem('isMusicMuted') === 'true';
    isSfxMuted = localStorage.getItem('isSfxMuted') === 'true';
    const savedTime = parseFloat(localStorage.getItem('musicTime') || '0');
    musicSound.currentTime = savedTime;
    musicSound.muted = isMusicMuted;
    musicSound.loop = true;
    if (!isMusicMuted) {
        musicSound.play().catch(e => console.log("Music autoplay failed."));
    }
    musicBtn.classList.toggle('muted', isMusicMuted);
    soundBtn.classList.toggle('muted', isSfxMuted);
    
    pauseBtn.addEventListener('click', gameSuspend);
    musicBtn.addEventListener('click', () => {
        isMusicMuted = !isMusicMuted;
        musicSound.muted = isMusicMuted;
        localStorage.setItem('isMusicMuted', isMusicMuted);
        musicBtn.classList.toggle('muted', isMusicMuted);
    });
    soundBtn.addEventListener('click', () => {
        isSfxMuted = !isSfxMuted;
        localStorage.setItem('isSfxMuted', isSfxMuted);
        soundBtn.classList.toggle('muted', isSfxMuted);
    });
    
    document.onkeydown = event => { if (isGameOver) return; var e = event || window.event; if (e.keyCode === 32) { e.preventDefault(); gameSuspend(); } };
    gameDiv.addEventListener("mousemove", (e) => { if(isDragging) return; touchOffsetX = spaceSelfPlan.sizeX / 2; touchOffsetY = spaceSelfPlan.sizeY / 2; planShift(e.clientX, e.clientY); });
    gameDiv.addEventListener('touchstart', (e) => { e.preventDefault(); isDragging = true; const touch = e.touches[0]; const rect = gameDiv.getBoundingClientRect(); touchOffsetX = touch.clientX - rect.left - spaceSelfPlan.spaceImageNode.offsetLeft; touchOffsetY = touch.clientY - rect.top - spaceSelfPlan.spaceImageNode.offsetTop; }, { passive: false });
    gameDiv.addEventListener('touchmove', (e) => { e.preventDefault(); if (isDragging) { const touch = e.touches[0]; planShift(touch.clientX, touch.clientY); } }, { passive: false });
    gameDiv.addEventListener('touchend', (e) => { e.preventDefault(); isDragging = false; }, { passive: false });
   
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            musicSound.pause();
            if (planNumber == 0 && !isGameOver) {
                clearInterval(set);
                planNumber = 1;
                pauseBtn.classList.add("paused");
            }
        } else {
            if (localStorage.getItem('isMusicMuted') !== 'true') {
                musicSound.play();
            }
            if (planNumber == 1 && !isGameOver) {
                set = setInterval(beginGame, 20);
                planNumber = 0;
                pauseBtn.classList.remove("paused");
            }
        }
    });
    initGame();
    document.getElementById('loading-overlay').style.display = 'none';
}

function resumeGameAfterRevive() {
    gameDiv.classList.remove('cursor-visible');
    revivalPopup1.style.display = 'none';
    revivalPopup2.style.display = 'none';
    clearInterval(revivalCountdownInterval);
    updateLivesDisplay();
    respawnPlayer();
    if (!isGameOver) {
        set = setInterval(beginGame, 20);
    }
}

function attemptReviveWithDiamonds() {
    let totalSavedDiamonds = parseInt(localStorage.getItem('savedDiamonds') || '0');
    const cost = 2;
    if (totalSavedDiamonds >= cost) {
        totalSavedDiamonds -= cost;
        localStorage.setItem('savedDiamonds', totalSavedDiamonds);
        diamondCountLabel.innerHTML = totalSavedDiamonds;
        playerLives += 1;
        revivalPopup1.style.display = 'none';
        clearInterval(revivalCountdownInterval);
        revivalPopup2.style.display = 'flex';
    } else {
        reviveDiamondBtn.classList.add('shake-error');
        setTimeout(() => { reviveDiamondBtn.classList.remove('shake-error'); }, 500);
    }
}

function attemptReviveWithAd() {
    console.log("Google H5: Requesting Rewarded Ad for Revive...");
    adReward({
        beforeReward: (showAdFn) => {
            console.log("Rewarded ad is ready. Showing now.");
            showAdFn();
        },
        adViewed: () => {
            console.log("Ad has been viewed.");
        },
        rewardGranted: () => {
            console.log("Reward granted by Google!");
            playerLives += 1;
        },
        afterReward: () => {
            console.log("Rewarded ad flow finished. Resuming game.");
            resumeGameAfterRevive();
        }
    });
}

reviveDiamondBtn.addEventListener('click', attemptReviveWithDiamonds);
reviveDiamondBtn.addEventListener('touchstart', (e) => { e.preventDefault(); attemptReviveWithDiamonds(); });
reviveAdBtn.addEventListener('click', attemptReviveWithAd);
reviveAdBtn.addEventListener('touchstart', (e) => { e.preventDefault(); attemptReviveWithAd(); });

function attemptBonusWithDiamonds() {
    let totalSavedDiamonds = parseInt(localStorage.getItem('savedDiamonds') || '0');
    const cost = 5;
    if (totalSavedDiamonds >= cost) {
        totalSavedDiamonds -= cost;
        localStorage.setItem('savedDiamonds', totalSavedDiamonds);
        diamondCountLabel.innerHTML = totalSavedDiamonds;
        playerLives += 2;
        resumeGameAfterRevive();
    } else {
        bonusDiamondBtn.classList.add('shake-error');
        setTimeout(() => { bonusDiamondBtn.classList.remove('shake-error'); }, 500);
    }
}

function attemptBonusWithAd() {
    console.log("Google H5: Requesting Rewarded Ad for Bonus...");
    adReward({
        beforeReward: (showAdFn) => { showAdFn(); },
        rewardGranted: () => {
            console.log("Reward granted for Bonus!");
            playerLives += 2;
        },
        afterReward: () => {
            console.log("Bonus ad flow finished.");
            resumeGameAfterRevive();
        }
    });
}

bonusDiamondBtn.addEventListener('click', attemptBonusWithDiamonds);
bonusDiamondBtn.addEventListener('touchstart', (e) => { e.preventDefault(); attemptBonusWithDiamonds(); });
bonusAdBtn.addEventListener('click', attemptBonusWithAd);
bonusAdBtn.addEventListener('touchstart', (e) => { e.preventDefault(); attemptBonusWithAd(); });
skipBonusBtn.addEventListener('click', resumeGameAfterRevive);
skipBonusBtn.addEventListener('touchstart', (e) => { e.preventDefault(); resumeGameAfterRevive(); });
I have removed all the sdk files and added google adsense, please look at the updated files and correct them, please make them work
