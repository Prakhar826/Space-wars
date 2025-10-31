// --- Game Elements ---
var gameContainer = document.getElementById("game-container");
var gameDiv = document.getElementById("gameDiv");
var livesDiv = document.getElementById("livesDiv");
var pauseDiv = document.getElementById("pauseDiv");
var gameOver = document.getElementById("gameOver");

// --- NEW: Revival Popup Elements ---
const revivalPopup1 = document.getElementById("revival-popup-1");
const revivalPopup2 = document.getElementById("revival-popup-2");
const revivalTimerLabel = document.getElementById("revival-timer-label");
const reviveDiamondBtn = document.getElementById("revive-diamond-btn");
const reviveAdBtn = document.getElementById("revive-ad-btn");
const bonusDiamondBtn = document.getElementById("bonus-diamond-btn");
const bonusAdBtn = document.getElementById("bonus-ad-btn");
const skipBonusBtn = document.getElementById("skip-bonus-btn");
// --- END NEW ---

const highScoreTitle = document.getElementById("highScoreTitle");

// --- NEW: Game Over Screen Elements ---
const gameOverScreen = document.getElementById("gameOverScreen");
const gameOverMusicBtn = document.getElementById("gameOverMusicBtn");
const gameOverSoundBtn = document.getElementById("gameOverSoundBtn");
const gameOverCloseBtn = document.getElementById("gameOverCloseBtn");
const gameOverScoreValue = document.getElementById("gameOverScoreValue");
const gameOverHighScoreValue = document.getElementById("gameOverHighScoreValue");
const gameOverMobileScoreValue = document.getElementById("gameOverMobileScoreValue");
const gameOverMobileHighScoreValue = document.getElementById("gameOverMobileHighScoreValue");
const gameOverDiamondValue = document.getElementById("gameOverDiamondValue");
const gameOverCoinValue = document.getElementById("gameOverCoinValue");
const doubleCoinsAdBtn = document.getElementById("doubleCoinsAdBtn");
//end of game over...

var startScreen = document.getElementById("start-screen");
var startButton = document.getElementById("startButton");
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

// --- Game State Variables (Your values preserved) ---
var spaceSelfPlan, set, isGameOver = false, planNumber = 0, scores = 0, highScores = 0;

// Add this with your other variables like 'isGameOver', 'scores', etc.
var isMobileLayout = false;

var coinCount = 0, diamondCount = 0;
var playerLives = 3;
const MAX_LIVES = 3; // NEW: A constant for total lives
var isPlayerDead = false;
var isDragging = false;
var touchOffsetX = 0, touchOffsetY = 0;
var nextDiamondScore = 2000;
var isBossActive = false;
var bossSpawned = false;
var finalBossSpawned = false;
var postBossScoreThreshold = 0;
// ... existing game state variables
var postBossScoreThreshold = 0;

// --- NEW: Revival State ---
var revivalCountdownInterval = null;
var hasRevivedThisRound = false; // Prevents multiple revivals
// --- END NEW ---

// (The rest of your file is preserved, with the key change highlighted below)

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
const DESKTOP_WIDTH = 1200;
const PORTRAIT_WIDTH = 320;
var scaleRatio = 1;
function scale(value) { return value * scaleRatio; }

// --- Game Object Constructors ---
function Explosion(centerX, centerY, displaySize) { const FRAME_WIDTH = 256; const FRAME_HEIGHT = 256; const COLS = 7; const TOTAL_FRAMES = 28; this.element = document.createElement("div"); this.currentFrame = 0; this.animationCounter = 0; this.init = function() { this.element.className = "explosion"; this.element.style.width = FRAME_WIDTH + "px"; this.element.style.height = FRAME_HEIGHT + "px"; this.element.style.left = (centerX - FRAME_WIDTH / 2) + "px"; this.element.style.top = (centerY - FRAME_HEIGHT / 2) + "px"; const scaleFactor = displaySize / FRAME_WIDTH; this.element.style.transform = `scale(${scaleFactor})`; gameDiv.appendChild(this.element); }; this.update = function() { this.animationCounter++; if (this.animationCounter % 2 === 0) { this.currentFrame++; } if (this.currentFrame >= TOTAL_FRAMES) { return false; } var row = Math.floor(this.currentFrame / COLS); var col = this.currentFrame % COLS; this.element.style.backgroundPosition = `-${col * FRAME_WIDTH}px -${row * FRAME_HEIGHT}px`; return true; }; this.init(); }
function PowerUp(sizeX, sizeY, speed, imageUrl) { const spawnX = random(scale(20), gameDiv.offsetWidth - scale(sizeX + 20)); this.x = spawnX; this.y = scale(-50); this.sizeX = scale(sizeX); this.sizeY = scale(sizeY); this.speed = scale(speed); this.imageNode = document.createElement("img"); this.move = function() { let currentScrollSpeed = isSpeedBoostActive ? scrollSpeed * 1.8 : scrollSpeed; this.imageNode.style.top = (this.imageNode.offsetTop + this.speed + currentScrollSpeed) + "px"; }; this.init = function() { this.imageNode.src = imageUrl; this.imageNode.style.left = this.x + "px"; this.imageNode.style.top = this.y + "px"; this.imageNode.style.width = this.sizeX + "px"; this.imageNode.style.height = this.sizeY + "px"; this.imageNode.classList.add('power-up-item'); gameDiv.appendChild(this.imageNode); }; this.init(); }
function Coin(x, y, sizeX, sizeY, score, speed, imageUrl) { this.x = x; this.y = y; this.sizeX = scale(sizeX); this.sizeY = scale(sizeY); this.score = score; this.speed = scale(speed); this.imageNode = document.createElement("img"); this.move = function() { if (isMagnetActive) { const playerCenterX = spaceSelfPlan.spaceImageNode.offsetLeft + spaceSelfPlan.sizeX / 2; const playerCenterY = spaceSelfPlan.spaceImageNode.offsetTop + spaceSelfPlan.sizeY / 2; const coinCenterX = this.imageNode.offsetLeft + this.sizeX / 2; const coinCenterY = this.imageNode.offsetTop + this.sizeY / 2; const deltaX = playerCenterX - coinCenterX; const deltaY = playerCenterY - coinCenterY; const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY); if (distance > 1) { const magnetSpeed = scale(8); this.imageNode.style.left = (this.imageNode.offsetLeft + (deltaX / distance) * magnetSpeed) + "px"; this.imageNode.style.top = (this.imageNode.offsetTop + (deltaY / distance) * magnetSpeed) + "px"; } } else { let currentScrollSpeed = isSpeedBoostActive ? scrollSpeed * 1.8 : scrollSpeed; this.imageNode.style.top = (this.imageNode.offsetTop + this.speed + currentScrollSpeed) + "px"; } }; this.init = function() { this.imageNode.src = imageUrl; this.imageNode.style.left = this.x + "px"; this.imageNode.style.top = this.y + "px"; this.imageNode.style.width = this.sizeX + "px"; this.imageNode.style.height = this.sizeY + "px"; gameDiv.appendChild(this.imageNode); }; this.init(); }
function spaceEnemyPlan(hp, sizeX, sizeY, score, speed, imageUrl, startY = -50) { const spawnX = random(0, gameDiv.offsetWidth - sizeX); spacePlan.call(this, hp, spawnX, startY, sizeX, sizeY, score, speed, imageUrl); }
function spacePlan(hp, X, Y, sizeX, sizeY, score, speed, imageUrl) {
    this.spacePlanhp = hp; this.scoreGameOver = score; this.sizeX = sizeX; this.sizeY = sizeY; this.spacePlanX = X; this.spacePlanY = Y; this.spacePlanSpeed = speed; this.spacePlanImageUrl = imageUrl; this.spaceImageNode = document.createElement("img"); this.isEntering = false;
    this.spacePlanMove = function() {
       
        // --- NEW, CORRECTED BOSS MOVEMENT LOGIC ---

if (this.isCrusher || this.isBoss) {
    // --- Step 1: Handle the initial descent on mobile (runs only once) ---
    if (isMobileLayout && this.mobileTargetY && this.spaceImageNode.offsetTop < this.mobileTargetY) {
        this.spaceImageNode.style.top = (this.spaceImageNode.offsetTop + scale(4)) + "px";
        
        // THIS IS THE FIX: When the boss reaches its line, disable this logic.
        if (this.spaceImageNode.offsetTop >= this.mobileTargetY) {
            this.mobileTargetY = null; // Setting this to null prevents the "stuck" loop.
        }
        return; // Don't do anything else until it's in position.
    }

    // --- Step 2: Handle desktop entry animation ---
    if (this.isEntering) {
        this.spaceImageNode.style.top = (this.spaceImageNode.offsetTop + 3) + "px";
        if (this.spaceImageNode.offsetTop >= 10) {
            this.isEntering = false;
        }
        return;
    }

    // --- Step 3: Run the normal attack patterns ---
    if (this.isCrusher) {
        // Crusher's attack pattern
        if (this.crusherState === 'patrolling') {
            this.spaceImageNode.style.left = (this.spaceImageNode.offsetLeft + this.bossSpeed * this.bossMoveDirection) + "px";
            if (this.spaceImageNode.offsetLeft <= 0) { this.bossMoveDirection = 1; }
            if (this.spaceImageNode.offsetLeft >= gameDiv.offsetWidth - this.sizeX) { this.bossMoveDirection = -1; }
            this.attackTimer--;
            if (this.attackTimer <= 0 && spaceSelfPlan && !isPlayerDead) { this.crusherState = 'attacking'; }
        } else if (this.crusherState === 'attacking') {
            this.spaceImageNode.style.top = (this.spaceImageNode.offsetTop + scale(15)) + "px";
            if (this.spaceImageNode.offsetTop >= gameDiv.offsetHeight - this.sizeY) { this.crusherState = 'returning'; }
        } else if (this.crusherState === 'returning') {
            this.spaceImageNode.style.top = (this.spaceImageNode.offsetTop - scale(10)) + "px";
            if (this.spaceImageNode.offsetTop <= this.initialY) {
                this.spaceImageNode.style.top = this.initialY + "px";
                this.crusherState = 'patrolling';
                this.attackTimer = random(100, 250);
            }
        }
    } else if (this.isBoss) {
        // First boss's attack pattern (patrolling)
        this.bossMoveTimer--;
        if (this.bossMoveTimer <= 0) {
            this.bossMoveDirection = (Math.random() < 0.5) ? 1 : -1;
            this.bossMoveTimer = random(100, 200);
        }
        this.spaceImageNode.style.left = (this.spaceImageNode.offsetLeft + this.bossSpeed * this.bossMoveDirection) + "px";
        if (this.spaceImageNode.offsetLeft <= 0) { this.bossMoveDirection = 1; }
        if (this.spaceImageNode.offsetLeft >= gameDiv.offsetWidth - this.sizeX) { this.bossMoveDirection = -1; }
    }
    return; // End boss logic
}
       
        if (this.isBouncingMinion) { this.spaceImageNode.style.top = (this.spaceImageNode.offsetTop + this.speedY) + "px"; this.spaceImageNode.style.left = (this.spaceImageNode.offsetLeft + this.speedX) + "px"; if (this.spaceImageNode.offsetLeft <= 0) { this.speedX *= -1; this.spaceImageNode.style.left = "1px"; } if (this.spaceImageNode.offsetLeft >= gameDiv.offsetWidth - this.sizeX) { this.speedX *= -1; this.spaceImageNode.style.left = (gameDiv.offsetWidth - this.sizeX - 1) + "px"; } if (this.spaceImageNode.offsetTop <= 0) { this.speedY *= -1; this.spaceImageNode.style.top = "1px"; } if (this.spaceImageNode.offsetTop >= gameDiv.offsetHeight - this.sizeY) { this.speedY *= -1; this.spaceImageNode.style.top = (gameDiv.offsetHeight - this.sizeY - 1) + "px"; } return; }
        if (this.isHoming && spaceSelfPlan && !isPlayerDead && !spaceSelfPlan.spaceImageNode.classList.contains('invincible-flash')) { const playerCenterX = spaceSelfPlan.spaceImageNode.offsetLeft + spaceSelfPlan.sizeX / 2; const playerCenterY = spaceSelfPlan.spaceImageNode.offsetTop + spaceSelfPlan.sizeY / 2; const enemyCenterX = this.spaceImageNode.offsetLeft + this.sizeX / 2; const enemyCenterY = this.spaceImageNode.offsetTop + this.sizeY / 2; const deltaX = playerCenterX - enemyCenterX; const deltaY = playerCenterY - enemyCenterY; const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI - 90; this.spaceImageNode.style.transform = 'rotate(' + angle + 'deg)'; const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY); if (distance > 1) { const homingSpeed = scale(8.5); this.spaceImageNode.style.left = (this.spaceImageNode.offsetLeft + (deltaX / distance) * homingSpeed) + "px"; this.spaceImageNode.style.top = (this.spaceImageNode.offsetTop + (deltaY / distance) * homingSpeed) + "px"; } }
        else { if (this.isHoming) { this.spaceImageNode.style.top = (this.spaceImageNode.offsetTop + scale(1.5)) + "px"; } let currentScrollSpeed = isSpeedBoostActive ? scrollSpeed * 1.8 : scrollSpeed; if (this.isEntering) { this.spaceImageNode.style.top = (this.spaceImageNode.offsetTop + 3 + currentScrollSpeed) + "px"; if (this.spaceImageNode.offsetTop >= 10) { this.isEntering = false; } } else { var speedMultiplier = 1; if (scores > 2000) speedMultiplier = 1.8; else if (scores > 1000) speedMultiplier = 1.4; else if (scores > 500) speedMultiplier = 1.2; let totalSpeed = (scale(this.spacePlanSpeed) * speedMultiplier) + currentScrollSpeed; this.spaceImageNode.style.top = this.spaceImageNode.offsetTop + totalSpeed + "px"; } if (this.isZigzag) { this.spaceImageNode.style.left = (this.spaceImageNode.offsetLeft + this.zigzagSpeed * this.zigzagDirection) + "px"; if (this.spaceImageNode.offsetLeft <= 0) { this.zigzagDirection = 1; } if (this.spaceImageNode.offsetLeft >= gameDiv.offsetWidth - this.sizeX) { this.zigzagDirection = -1; } } }
    };
    this.init = function() { this.spaceImageNode.style.left = this.spacePlanX + "px"; this.spaceImageNode.style.top = this.spacePlanY + "px"; this.spaceImageNode.style.width = this.sizeX + "px"; this.spaceImageNode.style.height = this.sizeY + "px"; this.spaceImageNode.src = imageUrl; gameDiv.appendChild(this.spaceImageNode); }; this.init();
}
function planBullet(X, Y, sizeX, sizeY, imageUrl) { this.planBulletX = X; this.planBulletY = Y; this.planBulletAttach = 1; this.planBulletsizeX = scale(sizeX); this.planBulletsizeY = scale(sizeY); this.planBulletimageUrl = imageUrl; this.planBulletimage = document.createElement("img"); this.planBulletMove = function() { let speed = isBoltActive ? scale(25) : scale(20); if(isSpeedBoostActive) { speed *= 1.5; } this.planBulletimage.style.top = this.planBulletimage.offsetTop - speed + "px"; }; this.init = function() { this.planBulletimage.style.left = this.planBulletX + "px"; this.planBulletimage.style.top = this.planBulletY + "px"; this.planBulletimage.style.width = this.planBulletsizeX + "px"; this.planBulletimage.style.height = this.planBulletsizeY + "px"; this.planBulletimage.src = imageUrl; gameDiv.appendChild(this.planBulletimage); }; this.init(); }
function spaceOddBullet(X, Y) { const width = isBoltActive ? 10 : 6; const height = isBoltActive ? 22 : 14; planBullet.call(this, X, Y, width, height, "images/bullet.png"); }
function EnemyBullet(X, Y) { this.bullet = document.createElement("img"); this.move = function() { this.bullet.style.top = (this.bullet.offsetTop + scale(8)) + "px"; }; this.init = function() { this.bullet.src = "images/bullet_enemy.png"; this.bullet.style.left = X + "px"; this.bullet.style.top = Y + "px"; this.bullet.style.width = scale(15) + "px"; this.bullet.style.height = scale(32) + "px"; gameDiv.appendChild(this.bullet); }; this.init(); }

function spaceOurPlan(imageUrl, width, height) { 
    // Use the provided width and height, or use the default desktop size
    const planeWidth = width || 120; 
    const planeHeight = height || 144; 
    
    const initialX = (gameDiv.offsetWidth / 2) - (scale(planeWidth) / 2); 
    const initialY = gameDiv.offsetHeight - scale(planeHeight + 20); 
    const finalImageUrl = imageUrl || "images/plane-c.png";
    
    // Pass the final scaled size to the spacePlan constructor
    spacePlan.call(this, 1, initialX, initialY, scale(planeWidth), scale(planeHeight), 0, 0, finalImageUrl); 
    this.spaceImageNode.setAttribute('id', 'spaceOurPlan'); 
}

function random(min, max) { return Math.floor(min + Math.random() * (max - min)); }
function spawnCoinTrail() { const startX = random(scale(20), gameDiv.offsetWidth - scale(68)); const startY = scale(-50); const gap = scale(60); for (let i = 0; i < 5; i++) { activeCoins.push(new Coin(startX, startY - (i * gap), 48, 48, 5, 2.5, "images/coin.png")); } }
var planShift = function(clientX, clientY) { if (isGameOver || isPlayerDead) return; const rect = gameDiv.getBoundingClientRect(); const mouseX = clientX - rect.left; const mouseY = clientY - rect.top; var newX = mouseX - touchOffsetX; var newY = mouseY - touchOffsetY; newX = Math.max(0, Math.min(newX, gameDiv.offsetWidth - spaceSelfPlan.sizeX)); newY = Math.max(0, Math.min(newY, gameDiv.offsetHeight - spaceSelfPlan.sizeY)); spaceSelfPlan.spaceImageNode.style.left = newX + "px"; spaceSelfPlan.spaceImageNode.style.top = newY + "px"; }
var gameSuspend = function() {
    // NEW: Prevent pausing if a revival popup is active
    if (isGameOver || revivalPopup1.style.display !== 'none' || revivalPopup2.style.display !== 'none') return;

    if (planNumber == 0) { // PAUSE THE GAME
        clearInterval(set);
        planNumber = 1;
        pauseBtn.classList.add("paused");
    } else { // RESUME THE GAME
        set = setInterval(beginGame, 20);
        planNumber = 0;
        pauseBtn.classList.remove("paused");
    }
}

// --- NEW: REWRITTEN LIVES DISPLAY FUNCTION ---
function updateLivesDisplay() {
    livesDiv.innerHTML = ''; // Clear existing hearts
    for (let i = 0; i < MAX_LIVES; i++) { // Always loop 3 times
        let heart = document.createElement('img');
        if (i < playerLives) {
            // If the loop index is less than current lives, show a full heart
            heart.src = 'Ui/heart_full.png';
        } else {
            // Otherwise, show an empty heart
            heart.src = 'Ui/heart_empty.png';
        }
        livesDiv.appendChild(heart);
    }
}

// --- Main Game Loop ---
var mark = 0, mark1 = 0;
function beginGame() {
    // NEW: Update all UI labels at once
    scoreLabel.innerHTML = scores;
    coinCountLabel.innerHTML = coinCount;
    diamondCountLabel.innerHTML = diamondCount;

    let currentScrollSpeed = isSpeedBoostActive ? scrollSpeed * 1.8 : scrollSpeed;
    bgPos1 += currentScrollSpeed; bgPos2 += currentScrollSpeed; if (bgPos1 >= gameDiv.offsetHeight) { currentBgIndex1 = (currentBgIndex1 + 2) % backgrounds.length; bgLayer1.style.backgroundImage = `url(images/${backgrounds[currentBgIndex1]})`; bgPos1 = bgPos2 - scaledBgHeight; } if (bgPos2 >= gameDiv.offsetHeight) { currentBgIndex2 = (currentBgIndex2 + 2) % backgrounds.length; bgLayer2.style.backgroundImage = `url(images/${backgrounds[currentBgIndex2]})`; bgPos2 = bgPos1 - scaledBgHeight; } bgLayer1.style.top = bgPos1 + 'px'; bgLayer2.style.top = bgPos2 + 'px';
    mark++;

    if (scores >= 6200 && !bossSpawned) {
        for (let i = spaceEnemyPlans.length - 1; i >= 0; i--) { gameDiv.removeChild(spaceEnemyPlans[i].spaceImageNode); }
        spaceEnemyPlans = []; isBossActive = true; bossSpawned = true;
        // --- NEW: Define boss size based on platform ---
let bossSizeX, bossSizeY;

if (isMobileLayout) {
    // --- MOBILE SIZES ---
    // These are smaller. You can change these numbers.
    bossSizeX = scale(160); 
    bossSizeY = scale(96);
} else {
    // --- DESKTOP SIZES (the original values) ---
    bossSizeX = scale(200);
    bossSizeY = scale(120);
}

// Now, create the boss using these new size variables
let boss = new spaceEnemyPlan(1200, bossSizeX, bossSizeY, 5000, 0, 'images/enemy-5.png', scale(-300));
        // --- NEW: Set the mobile descent target for the boss ---
        if (isMobileLayout) {
            boss.mobileTargetY = scale(100); // It will stop at 100px from the top
            boss.isEntering = false; // We will handle the entrance manually
        }


        boss.isBoss = true; boss.bossSpeed = scale(2.5); boss.bossMoveTimer = 100; boss.bossMoveDirection = 1; boss.fireCooldown = 100; boss.fireTimer = 0; boss.isEntering = true;
        spaceEnemyPlans.push(boss);
    }
    if (postBossScoreThreshold > 0 && scores >= postBossScoreThreshold && !finalBossSpawned) {
        for (let i = spaceEnemyPlans.length - 1; i >= 0; i--) { gameDiv.removeChild(spaceEnemyPlans[i].spaceImageNode); }
        spaceEnemyPlans = []; isBossActive = true; finalBossSpawned = true;
        const initialBossY = scale(-300);
     // --- NEW: Define crusher size based on platform ---
let crusherSizeX, crusherSizeY;

if (isMobileLayout) {
    // --- MOBILE SIZES ---
    // These are smaller. You can change these numbers.
    crusherSizeX = scale(113);
    crusherSizeY = scale(70);
} else {
    // --- DESKTOP SIZES (the original values) ---
    crusherSizeX = scale(200);
    crusherSizeY = scale(125);
}

// Now, create the crusher using these new size variables
let crusher = new spaceEnemyPlan(1500, crusherSizeX, crusherSizeY, 10000, 0, 'images/enemy-7.png', initialBossY);
        // --- NEW: Set the mobile descent target for the crusher ---
        if (isMobileLayout) {
            crusher.mobileTargetY = scale(100);
            crusher.initialY = scale(100); // Also update its "return" position for attacks
            crusher.isEntering = false;
        } else {
            crusher.initialY = 10; // Keep the original desktop return position
        }

        crusher.isCrusher = true; crusher.initialY = 10; crusher.bossSpeed = scale(4); crusher.bossMoveDirection = 1; crusher.crusherState = 'patrolling'; crusher.attackTimer = 150; crusher.isEntering = true;
        spaceEnemyPlans.push(crusher);
    }
    
    if (!isBossActive && mark >= 20) {
        mark1++; const isLandscape = gameDiv.offsetWidth > gameDiv.offsetHeight; const enemySizeMultiplier = isLandscape ? 2.0 : 1.5; let healthBonus = 0; if (scores > 2500) { healthBonus = 2; } else if (scores > 1000) { healthBonus = 1; } let spawnData = null;
        if (bossSpawned) {
             if (mark1 % 15 === 0) { spawnData = { type: 'homing', hp: 4, w: 58, h: 58, score: 100, speed: 7, img: "images/enemy-4.png" }; }
             if (mark1 % 20 === 0) { spawnData = { type: 'large', hp: 12, w: 80, h: 120, score: 300, speed: 1.5, img: "images/enemy-2.png" }; }
             if (mark1 % 4 === 0) { spawnData = { type: 'small', hp: 1, w: 34, h: 24, score: 10, speed: random(2, 5), img: "images/enemy-1.png" }; }
        } else {
            if (mark1 % 6 === 0) { spawnData = { type: 'medium', hp: 6, w: 60, h: 60, score: 50, speed: random(2, 4), img: "images/enemy-3.png" }; }
            if (mark1 % 25 === 0 && mark1 > 0) { spawnData = { type: 'large', hp: 12, w: 110, h: 164, score: 300, speed: 1.5, img: "images/enemy-2.png" }; }
            else if (mark1 % 3 === 0) {
                if (scores >= 3286 && scores < 5786) { spawnData = { type: 'homing', hp: 4, w: 58, h: 58, score: 100, speed: 3, img: "images/enemy-4.png" }; }
                else if (scores >= 786 && scores < 2786) { let zigzagCount = 0; for (const enemy of spaceEnemyPlans) { if (enemy.isZigzag) { zigzagCount++; } } if (zigzagCount < 2) { spawnData = { type: 'zigzag', hp: 2, w: 60, h: 60, score: 75, speed: 2, img: "images/enemy-3.png" }; } }
                else { spawnData = { type: 'small', hp: 1, w: 34, h: 24, score: 10, speed: random(2, 5), img: "images/enemy-1.png" }; }
            }
        }
        if (spawnData) { let finalW = scale(spawnData.w * enemySizeMultiplier); let finalH = scale(spawnData.h * enemySizeMultiplier); let spawnX = random(0, gameDiv.offsetWidth - finalW); let canSpawn = true; for (const enemy of spaceEnemyPlans) { if (Math.abs((spawnX + finalW / 2) - (enemy.spaceImageNode.offsetLeft + enemy.sizeX / 2)) < (finalW / 2 + enemy.sizeX / 2) && Math.abs(-finalH - (enemy.spaceImageNode.offsetTop + enemy.sizeY / 2)) < 100) { canSpawn = false; break; } } if (canSpawn) { let startY = spawnData.type === 'large' ? -finalH : scale(-50); let newEnemy = new spaceEnemyPlan(spawnData.hp + healthBonus, finalW, finalH, spawnData.score, spawnData.speed, spawnData.img, startY); if (spawnData.type === 'large') { newEnemy.isEntering = true; } if (spawnData.type === 'zigzag') { newEnemy.isZigzag = true; newEnemy.zigzagSpeed = scale(3); newEnemy.zigzagDirection = (Math.random() < 0.5) ? 1 : -1; newEnemy.fireCooldown = 100; newEnemy.fireTimer = random(0, 100); } if (spawnData.type === 'homing') { newEnemy.isHoming = true; } spaceEnemyPlans.push(newEnemy); } }
        if (mark1 % 5 === 2) { spawnCoinTrail(); }
        const powerUpSize = 64;
        if (mark1 % 150 === 50) { activeMagnets.push(new PowerUp(powerUpSize, powerUpSize, 2.0, "images/magnet.png")); }
        if (mark1 % 250 === 100) { activeShields.push(new PowerUp(powerUpSize, powerUpSize, 2.0, "images/shield.png")); }
        if (mark1 % 90 === 30) { activeBolts.push(new PowerUp(powerUpSize, powerUpSize, 2.0, "images/bolt.png")); }
        if (mark1 % 499 === 150) { activeBoosters.push(new PowerUp(powerUpSize, powerUpSize, 2.5, "images/booster.png")); }
        if (scores >= nextDiamondScore) { activeDiamonds.push(new PowerUp(70, 70, 2.0, "images/diamond.png")); nextDiamondScore += 2000; }
        if (mark1 >= 500) { mark1 = 0; }
    }
    if (mark >= 20) { mark = 0; }
    
    if (isShieldActive) { const player = spaceSelfPlan.spaceImageNode; shieldBubbleNode.style.left = (player.offsetLeft + player.offsetWidth / 2 - shieldBubbleNode.offsetWidth / 2) + 'px'; shieldBubbleNode.style.top = (player.offsetTop + player.offsetHeight / 2 - shieldBubbleNode.offsetHeight / 2) + 'px'; }
    for (let i = spaceEnemyPlans.length - 1; i >= 0; i--) { let enemy = spaceEnemyPlans[i]; enemy.spacePlanMove(); if (enemy.isBoss && !enemy.isEntering) { enemy.fireTimer++; if (enemy.fireTimer >= enemy.fireCooldown && !isPlayerDead && spaceSelfPlan && !spaceSelfPlan.spaceImageNode.classList.contains('invincible-flash')) { const minionSize = scale(35); const spawnX = enemy.spaceImageNode.offsetLeft + (enemy.sizeX / 2) - (minionSize / 2); const spawnY = enemy.spaceImageNode.offsetTop + enemy.sizeY; let minion1 = new spacePlan(2, spawnX, spawnY, minionSize, minionSize, 20, 0, 'images/enemy-6.png'); minion1.isBouncingMinion = true; minion1.speedX = scale(-5); minion1.speedY = scale(6.5); spaceEnemyPlans.push(minion1); let minion2 = new spacePlan(2, spawnX, spawnY, minionSize, minionSize, 20, 0, 'images/enemy-6.png'); minion2.isBouncingMinion = true; minion2.speedX = 0; minion2.speedY = scale(4.5); spaceEnemyPlans.push(minion2); let minion3 = new spacePlan(2, spawnX, spawnY, minionSize, minionSize, 20, 0, 'images/enemy-6.png'); minion3.isBouncingMinion = true; minion3.speedX = scale(5); minion3.speedY = scale(6.5); spaceEnemyPlans.push(minion3); enemy.fireTimer = 0; } } if (enemy.isZigzag && !enemy.isEntering) { enemy.fireTimer++; if (enemy.fireTimer >= enemy.fireCooldown) { let bulletY = enemy.spaceImageNode.offsetTop + enemy.sizeY; let bulletLeftX = enemy.spaceImageNode.offsetLeft + enemy.sizeX * 0.1; let bulletRightX = enemy.spaceImageNode.offsetLeft + enemy.sizeX * 0.8; enemyBullets.push(new EnemyBullet(bulletLeftX, bulletY)); enemyBullets.push(new EnemyBullet(bulletRightX, bulletY)); playSound(enemyBulletSound); enemy.fireTimer = 0; } } if (enemy.spaceImageNode.offsetTop > gameDiv.offsetHeight && !enemy.isBouncingMinion && !enemy.isBoss && !enemy.isCrusher) { gameDiv.removeChild(enemy.spaceImageNode); spaceEnemyPlans.splice(i, 1); } }


    let fireInterval = isBoltActive ? 4 : 5;
if (mark % fireInterval == 0 && !isPlayerDead) {
    const myPlanNode = spaceSelfPlan.spaceImageNode;
    const centerX = myPlanNode.offsetLeft + myPlanNode.offsetWidth / 2;
    const selectedPlane = localStorage.getItem('selectedPlane') || 'plane-c';

    // Base bullet firing logic
    if (isBoltActive) {
        // Bolt power-up always fires 3 bullets, overriding the plane's default
        planBullets.push(new spaceOddBullet(centerX - scale(30), myPlanNode.offsetTop));
        planBullets.push(new spaceOddBullet(centerX - scale(3), myPlanNode.offsetTop));
        planBullets.push(new spaceOddBullet(centerX + scale(24), myPlanNode.offsetTop));
    } else {
        // Fire based on the selected plane if bolt is not active
        switch (selectedPlane) {
            case 'plane-c1': // 2 bullets
                planBullets.push(new spaceOddBullet(centerX - scale(15), myPlanNode.offsetTop));
                planBullets.push(new spaceOddBullet(centerX + scale(12), myPlanNode.offsetTop));
                break;
            case 'plane-c2': // 3 bullets
                planBullets.push(new spaceOddBullet(centerX - scale(25), myPlanNode.offsetTop));
                planBullets.push(new spaceOddBullet(centerX - scale(3), myPlanNode.offsetTop));
                planBullets.push(new spaceOddBullet(centerX + scale(19), myPlanNode.offsetTop));
                break;
            case 'plane-c3': // 4 bullets
                planBullets.push(new spaceOddBullet(centerX - scale(30), myPlanNode.offsetTop - scale(10)));
                planBullets.push(new spaceOddBullet(centerX - scale(10), myPlanNode.offsetTop));
                planBullets.push(new spaceOddBullet(centerX + scale(8), myPlanNode.offsetTop));
                planBullets.push(new spaceOddBullet(centerX + scale(28), myPlanNode.offsetTop - scale(10)));
                break;
            case 'plane-c': // 1 bullet (default)
            default:
                planBullets.push(new spaceOddBullet(centerX - scale(3), myPlanNode.offsetTop));
                break;
        }
    }
    playSound(bulletSound);
}
    
    for (let i = planBullets.length - 1; i >= 0; i--) { planBullets[i].planBulletMove(); if (planBullets[i].planBulletimage.offsetTop < -planBullets[i].planBulletsizeY) { gameDiv.removeChild(planBullets[i].planBulletimage); planBullets.splice(i, 1); } }
    for (let i = enemyBullets.length - 1; i >= 0; i--) { enemyBullets[i].move(); if (enemyBullets[i].bullet.offsetTop > gameDiv.offsetHeight) { gameDiv.removeChild(enemyBullets[i].bullet); enemyBullets.splice(i, 1); } }
    for (let i = activeCoins.length - 1; i >= 0; i--) { activeCoins[i].move(); if (activeCoins[i].imageNode.offsetTop > gameDiv.offsetHeight) { gameDiv.removeChild(activeCoins[i].imageNode); activeCoins.splice(i, 1); } }
    for (let i = activeMagnets.length - 1; i >= 0; i--) { activeMagnets[i].move(); if (activeMagnets[i].imageNode.offsetTop > gameDiv.offsetHeight) { gameDiv.removeChild(activeMagnets[i].imageNode); activeMagnets.splice(i, 1); } }
    for (let i = activeShields.length - 1; i >= 0; i--) { activeShields[i].move(); if (activeShields[i].imageNode.offsetTop > gameDiv.offsetHeight) { gameDiv.removeChild(activeShields[i].imageNode); activeShields.splice(i, 1); } }
    for (let i = activeBolts.length - 1; i >= 0; i--) { activeBolts[i].move(); if (activeBolts[i].imageNode.offsetTop > gameDiv.offsetHeight) { gameDiv.removeChild(activeBolts[i].imageNode); activeBolts.splice(i, 1); } }
    for (let i = activeBoosters.length - 1; i >= 0; i--) { activeBoosters[i].move(); if (activeBoosters[i].imageNode.offsetTop > gameDiv.offsetHeight) { gameDiv.removeChild(activeBoosters[i].imageNode); activeBoosters.splice(i, 1); } }
    for (let i = activeDiamonds.length - 1; i >= 0; i--) { activeDiamonds[i].move(); if (activeDiamonds[i].imageNode.offsetTop > gameDiv.offsetHeight) { gameDiv.removeChild(activeDiamonds[i].imageNode); activeDiamonds.splice(i, 1); } }

    for (let k = planBullets.length - 1; k >= 0; k--) { for (let j = spaceEnemyPlans.length - 1; j >= 0; j--) { const bullet = planBullets[k]; const enemy = spaceEnemyPlans[j]; if (bullet && enemy && bullet.planBulletimage.offsetLeft < enemy.spaceImageNode.offsetLeft + enemy.sizeX && bullet.planBulletimage.offsetLeft + bullet.planBulletsizeX > enemy.spaceImageNode.offsetLeft && bullet.planBulletimage.offsetTop < enemy.spaceImageNode.offsetTop + enemy.sizeY && bullet.planBulletimage.offsetTop + bullet.planBulletsizeY > enemy.spaceImageNode.offsetTop) { enemy.spacePlanhp -= bullet.planBulletAttach; gameDiv.removeChild(bullet.planBulletimage); planBullets.splice(k, 1); if (enemy.spacePlanhp <= 0) { scores += enemy.scoreGameOver; const centerX = enemy.spaceImageNode.offsetLeft + enemy.sizeX / 2; const centerY = enemy.spaceImageNode.offsetTop + enemy.sizeY / 2; activeExplosions.push(new Explosion(centerX, centerY, enemy.sizeX * 1.5)); playSound(explodeSound); if (enemy.isBoss) { isBossActive = false; postBossScoreThreshold = scores + 1000; spawnCoinTrail(); spawnCoinTrail(); spawnCoinTrail(); } else if (enemy.isCrusher) { isBossActive = false; } gameDiv.removeChild(enemy.spaceImageNode); spaceEnemyPlans.splice(j, 1); } break; } } }
    if (!isPlayerDead) {
        for (let j = spaceEnemyPlans.length - 1; j >= 0; j--) { const enemy = spaceEnemyPlans[j]; const player = spaceSelfPlan.spaceImageNode; const playerHitboxOffsetY = player.offsetHeight * 0.2; if (enemy.spaceImageNode.offsetLeft < player.offsetLeft + player.offsetWidth && enemy.spaceImageNode.offsetLeft + enemy.sizeX > player.offsetLeft && enemy.spaceImageNode.offsetTop < player.offsetTop + player.offsetHeight - playerHitboxOffsetY && enemy.spaceImageNode.offsetTop + enemy.sizeY > player.offsetTop) { if (player.classList.contains('invincible-flash')) continue; if (isShieldActive) { playSound(explodeSound); const centerX = enemy.spaceImageNode.offsetLeft + enemy.sizeX / 2; const centerY = enemy.spaceImageNode.offsetTop + enemy.sizeY / 2; activeExplosions.push(new Explosion(centerX, centerY, enemy.sizeX * 1.5)); gameDiv.removeChild(enemy.spaceImageNode); spaceEnemyPlans.splice(j, 1); } else { handlePlayerDeath(); } } }
        for (let i = enemyBullets.length - 1; i >= 0; i--) { const bullet = enemyBullets[i].bullet; const player = spaceSelfPlan.spaceImageNode; if (bullet.offsetLeft < player.offsetLeft + player.offsetWidth && bullet.offsetLeft + bullet.offsetWidth > player.offsetLeft && bullet.offsetTop < player.offsetTop + player.offsetHeight && bullet.offsetTop + bullet.offsetHeight > player.offsetTop) { if (player.classList.contains('invincible-flash')) continue; if (isShieldActive) { gameDiv.removeChild(bullet); enemyBullets.splice(i, 1); } else { handlePlayerDeath(); } } }
        for (let i = activeCoins.length - 1; i >= 0; i--) { const coin = activeCoins[i]; const player = spaceSelfPlan.spaceImageNode; if (coin.imageNode.offsetLeft < player.offsetLeft + player.offsetWidth && coin.imageNode.offsetLeft + coin.sizeX > player.offsetLeft && coin.imageNode.offsetTop < player.offsetTop + player.offsetHeight && coin.imageNode.offsetTop + coin.sizeY > player.offsetTop) { playSound(coinSound); scores += coin.score; coinCount++; clearTimeout(coinGlowTimeout); player.classList.add('plane-glow'); coinGlowTimeout = setTimeout(() => { player.classList.remove('plane-glow'); }, 200); gameDiv.removeChild(coin.imageNode); activeCoins.splice(i, 1); } }
        
        // --- CHANGED: Power-up collection logic now reads from localStorage ---
        for (let i = activeMagnets.length - 1; i >= 0; i--) {
            const magnet = activeMagnets[i];
            const player = spaceSelfPlan.spaceImageNode;
            if (magnet.imageNode.offsetLeft < player.offsetLeft + player.offsetWidth && magnet.imageNode.offsetLeft + magnet.sizeX > player.offsetLeft && magnet.imageNode.offsetTop < player.offsetTop + player.offsetHeight && magnet.imageNode.offsetTop + magnet.sizeY > player.offsetTop) {
                playSound(boosterSound);
                isMagnetActive = true;
                clearTimeout(magnetTimer);
                const magnetDuration = (parseInt(localStorage.getItem('magnetTime') || '8')) * 1000; // Get duration from localStorage (default 8s)
                magnetTimer = setTimeout(() => {
                    isMagnetActive = false;
                }, magnetDuration);
                gameDiv.removeChild(magnet.imageNode);
                activeMagnets.splice(i, 1);
            }
        }
        for (let i = activeShields.length - 1; i >= 0; i--) {
            const shield = activeShields[i];
            const player = spaceSelfPlan.spaceImageNode;
            if (shield.imageNode.offsetLeft < player.offsetLeft + player.offsetWidth && shield.imageNode.offsetLeft + shield.sizeX > player.offsetLeft && shield.imageNode.offsetTop < player.offsetTop + player.offsetHeight && shield.imageNode.offsetTop + shield.sizeY > player.offsetTop) {
                playSound(boosterSound);
                isShieldActive = true;
                shieldBubbleNode.style.display = 'block';
                clearTimeout(shieldTimer);
                const shieldDuration = (parseInt(localStorage.getItem('shieldTime') || '10')) * 1000; // Get duration from localStorage (default 10s)
                shieldTimer = setTimeout(() => {
                    isShieldActive = false;
                    shieldBubbleNode.style.display = 'none';
                }, shieldDuration);
                gameDiv.removeChild(shield.imageNode);
                activeShields.splice(i, 1);
            }
        }
        for (let i = activeBolts.length - 1; i >= 0; i--) {
            const bolt = activeBolts[i];
            const player = spaceSelfPlan.spaceImageNode;
            if (bolt.imageNode.offsetLeft < player.offsetLeft + player.offsetWidth && bolt.imageNode.offsetLeft + bolt.sizeX > player.offsetLeft && bolt.imageNode.offsetTop < player.offsetTop + player.offsetHeight && bolt.imageNode.offsetTop + bolt.sizeY > player.offsetTop) {
                playSound(boosterSound);
                isBoltActive = true;
                clearTimeout(boltTimer);
                const boltDuration = (parseInt(localStorage.getItem('boltTime') || '10')) * 1000; // Get duration from localStorage (default 10s)
                boltTimer = setTimeout(() => {
                    isBoltActive = false;
                }, boltDuration);
                gameDiv.removeChild(bolt.imageNode);
                activeBolts.splice(i, 1);
            }
        }
        for (let i = activeBoosters.length - 1; i >= 0; i--) {
            const booster = activeBoosters[i];
            const player = spaceSelfPlan.spaceImageNode;
            if (booster.imageNode.offsetLeft < player.offsetLeft + player.offsetWidth && booster.imageNode.offsetLeft + booster.sizeX > player.offsetLeft && booster.imageNode.offsetTop < player.offsetTop + player.offsetHeight && booster.imageNode.offsetTop + booster.sizeY > player.offsetTop) {
                playSound(boosterSound);

                // Get all upgraded durations from localStorage
                const magnetDuration = (parseInt(localStorage.getItem('magnetTime') || '8')) * 1000;
                const boltDuration = (parseInt(localStorage.getItem('boltTime') || '10')) * 1000;
                const speedDuration = (parseInt(localStorage.getItem('speedTime') || '6')) * 1000;
                const shieldDuration = (parseInt(localStorage.getItem('shieldTime') || '10')) * 1000;

                // Activate Magnet
                isMagnetActive = true;
                clearTimeout(magnetTimer);
                magnetTimer = setTimeout(() => { isMagnetActive = false; }, magnetDuration);
                
                // Activate Bolt
                isBoltActive = true;
                clearTimeout(boltTimer);
                boltTimer = setTimeout(() => { isBoltActive = false; }, boltDuration);
                
                // Activate Speed Boost
                isSpeedBoostActive = true;
                clearTimeout(speedBoostTimer);
                speedBoostTimer = setTimeout(() => { isSpeedBoostActive = false; }, speedDuration);
                
                // Activate Shield
                isShieldActive = true;
                shieldBubbleNode.style.display = 'block';
                clearTimeout(shieldTimer);
                shieldTimer = setTimeout(() => { isShieldActive = false; shieldBubbleNode.style.display = 'none'; }, shieldDuration);

                gameDiv.removeChild(booster.imageNode);
                activeBoosters.splice(i, 1);
            }
        }
        // --- END OF CHANGED SECTION ---

        for (let i = activeDiamonds.length - 1; i >= 0; i--) { const diamond = activeDiamonds[i]; const player = spaceSelfPlan.spaceImageNode; if (diamond.imageNode.offsetLeft < player.offsetLeft + player.offsetWidth && diamond.imageNode.offsetLeft + diamond.sizeX > player.offsetLeft && diamond.imageNode.offsetTop < player.offsetTop + player.offsetHeight && diamond.imageNode.offsetTop + diamond.sizeY > player.offsetTop) { playSound(coinSound); diamondCount++; gameDiv.removeChild(diamond.imageNode); activeDiamonds.splice(i, 1); } }
    }
    for (let i = activeExplosions.length - 1; i >= 0; i--) { if (!activeExplosions[i].update()) { gameDiv.removeChild(activeExplosions[i].element); activeExplosions.splice(i, 1); } }
}

function handlePlayerDeath() {
    playSound(explodeSound);
    playerLives--;
    updateLivesDisplay();
    isPlayerDead = true;
    activeExplosions.push(new Explosion(spaceSelfPlan.spaceImageNode.offsetLeft + spaceSelfPlan.sizeX / 2, spaceSelfPlan.spaceImageNode.offsetTop + spaceSelfPlan.sizeY / 2, spaceSelfPlan.sizeX * 1.5));
    spaceSelfPlan.spaceImageNode.style.display = 'none';

    if (playerLives <= 0 && !hasRevivedThisRound) {
        // Player has no lives left, and hasn't used their revive yet
        hasRevivedThisRound = true; // Mark that they've used their chance
        // Wait a moment for the explosion animation, then show popup
        setTimeout(() => {
            clearInterval(set); // IMPORTANT: Pause the game loop
            showFirstRevivalPopup();
        }, 800);

    } else if (playerLives <= 0 && hasRevivedThisRound) {
        // Player has died AGAIN after reviving, trigger final game over
        setTimeout(triggerRealGameOver, 1000);

    } else {
        // Player still has lives left
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
    
    // --- Step 1: Tell the SDK that gameplay has stopped ---
    CrazyGames.SDK.game.gameplayStop();
    console.log("Gameplay Stop event sent.");

    // --- Step 2: Save all data to localStorage ---
    localStorage.setItem('sessionScore', scores);
    localStorage.setItem('sessionCoins', coinCount);
    localStorage.setItem('sessionDiamonds', diamondCount);

    let currentTotalCoins = parseInt(localStorage.getItem('savedCoins') || '0');
    let currentTotalDiamonds = parseInt(localStorage.getItem('savedDiamonds') || '0');
    currentTotalCoins += coinCount;
    currentTotalDiamonds += diamondCount;
    localStorage.setItem('savedCoins', currentTotalCoins);
    localStorage.setItem('savedDiamonds', currentTotalDiamonds);

    // --- Step 3: Call happytime() - The Recommended Method ---
    // The SDK will now decide if it's a good time to show an ad.
    // You do not need to handle callbacks.
    console.log("Calling happytime() for a potential mid-game ad...");
    CrazyGames.SDK.game.happytime();

    // --- Step 4: Navigate to the end screen immediately ---
    // The ad, if shown, will appear as an overlay on top of the game over screen.
    // This is the intended behavior.
    if (scores > highScores) {
        localStorage.setItem('highScores', scores);
        window.location.replace('high_score.html');
    } else {
        window.location.replace('game_over.html');
    }
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
    // This function no longer starts music, it just starts the game loop
    set = setInterval(beginGame, 20);
}


function startGame() {
    bgLayer1 = document.getElementById('bgLayer1');
    bgLayer2 = document.getElementById('bgLayer2');
    shieldBubbleNode = document.getElementById('shieldBubble');

    const finalWidth = gameDiv.offsetWidth;
    const finalHeight = gameDiv.offsetHeight;
    if (finalWidth > finalHeight) { scaleRatio = 1; } else { scaleRatio = finalWidth / PORTRAIT_WIDTH; }
    // --- NEW: Mobile Detection ---
    // A simple check to see if the screen is taller than it is wide.
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
    
    // --- NEW: Define Player Plane size based on platform ---
let playerPlaneWidth, playerPlaneHeight;

if (isMobileLayout) {
    // --- MOBILE SIZE ---
    // These numbers are smaller. You can adjust them.
    playerPlaneWidth = 99;
    playerPlaneHeight = 120;
} else {
    // --- DESKTOP SIZE (the original default) ---
    playerPlaneWidth = 120;
    playerPlaneHeight = 144;
}

// Get the selected plane from storage
const selectedPlane = localStorage.getItem('selectedPlane') || 'plane-c';

// Create the player with the correct image AND the correct size
spaceSelfPlan = new spaceOurPlan(`images/${selectedPlane}.png`, playerPlaneWidth, playerPlaneHeight);
    spaceSelfPlan.spaceImageNode.style.display = "block";
    shieldBubbleNode.style.width = (spaceSelfPlan.sizeX * 1.5) + 'px';
    shieldBubbleNode.style.height = (spaceSelfPlan.sizeY * 1.5) + 'px';

    // --- UPDATED MUSIC AND SOUND LOGIC ---
    // 1. Read the global mute state from localStorage
    isMusicMuted = localStorage.getItem('isMusicMuted') === 'true';
    isSfxMuted = localStorage.getItem('isSfxMuted') === 'true';

    // 2. Apply the state to the game's music and buttons
    const savedTime = parseFloat(localStorage.getItem('musicTime') || '0');
    musicSound.currentTime = savedTime;
    musicSound.muted = isMusicMuted;
    musicSound.loop = true;
    if (!isMusicMuted) {
        musicSound.play().catch(e => console.log("Music autoplay failed."));
    }
    musicBtn.classList.toggle('muted', isMusicMuted);
    soundBtn.classList.toggle('muted', isSfxMuted);
    
    // 3. Fix the button click handlers
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
   

    // --- Graceful Pausing with the Page Visibility API ---
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // --- Tab is hidden: PAUSE the game and music ---
        musicSound.pause(); // Always pause the music

        // Also pause the game loop if it's running
        if (planNumber == 0 && !isGameOver) {
            clearInterval(set);
            planNumber = 1;
            pauseBtn.classList.add("paused");
        }
    } else {
        // --- Tab is visible again: RESUME the game and music ---
        // Only resume music if it's not muted by the player
        if (localStorage.getItem('isMusicMuted') !== 'true') {
            musicSound.play();
        }

        // Also resume the game loop if it was paused by this feature
        if (planNumber == 1 && !isGameOver) {
            set = setInterval(beginGame, 20);
            planNumber = 0;
            pauseBtn.classList.remove("paused");
        }

        
    }

    
});
    initGame();
    // --- NEW: Tell the SDK that gameplay has started ---
    CrazyGames.SDK.game.gameplayStart();
    console.log("Gameplay Start event sent.");

    document.getElementById('loading-overlay').style.display = 'none'; // Hide our custom loader
    CrazyGames.SDK.game.loadingStop();
}



function restartNewGame() { window.location.reload(); }

// --- Start the game setup ---
startGame();

// --- NEW: REVIVAL POPUP EVENT LISTENERS ---

function resumeGameAfterRevive() {
    gameDiv.classList.remove('cursor-visible');
    revivalPopup1.style.display = 'none';
    revivalPopup2.style.display = 'none';
    clearInterval(revivalCountdownInterval);
    
    updateLivesDisplay();
    respawnPlayer();
    
    // Resume game loop
    if (!isGameOver) {
        set = setInterval(beginGame, 20);
    }
}


// ===================================================================
// --- NEW & COMPLETE: REVIVAL POPUP EVENT LISTENERS ---
// This block fixes ALL popup buttons for both desktop and mobile.
// ===================================================================

// --- First Popup Logic ---

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
    console.log("Requesting Rewarded Ad for Revive...");
    CrazyGames.SDK.ad.requestAd("rewarded", {
        adStarted: () => console.log("Ad Started"),
        adFinished: () => {
            // This is called ONLY if the player watches the whole ad.
            console.log("Ad Finished, granting revive reward.");
            playerLives += 1;
            resumeGameAfterRevive();
        },
        adError: (error) => {
            console.error("Ad Error:", error);
            // Optional: Tell the player the ad failed. For now, we just do nothing.
        },
    });
}

// Attach listeners for the first popup
reviveDiamondBtn.addEventListener('click', attemptReviveWithDiamonds);
reviveDiamondBtn.addEventListener('touchstart', (e) => { e.preventDefault(); attemptReviveWithDiamonds(); });

reviveAdBtn.addEventListener('click', attemptReviveWithAd);
reviveAdBtn.addEventListener('touchstart', (e) => { e.preventDefault(); attemptReviveWithAd(); });


// --- Second Popup Logic ---

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
    console.log("Requesting Rewarded Ad for Bonus...");
    CrazyGames.SDK.ad.requestAd("rewarded", {
        adStarted: () => console.log("Ad Started"),
        adFinished: () => {
            console.log("Ad Finished, granting bonus reward.");
            playerLives += 2; // The bonus is 2 lives
            resumeGameAfterRevive();
        },
        adError: (error) => console.error("Ad Error:", error),
    });
}

// Note: The skip button's logic is just to call resumeGameAfterRevive directly.

// Attach listeners for the second popup
bonusDiamondBtn.addEventListener('click', attemptBonusWithDiamonds);
bonusDiamondBtn.addEventListener('touchstart', (e) => { e.preventDefault(); attemptBonusWithDiamonds(); });

bonusAdBtn.addEventListener('click', attemptBonusWithAd);
bonusAdBtn.addEventListener('touchstart', (e) => { e.preventDefault(); attemptBonusWithAd(); });

skipBonusBtn.addEventListener('click', resumeGameAfterRevive);
skipBonusBtn.addEventListener('touchstart', (e) => { e.preventDefault(); resumeGameAfterRevive(); });

CrazyGames.SDK.game.loadingStop();


