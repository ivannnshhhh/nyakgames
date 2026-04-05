const rulesButton = document.getElementById("rules-btn");
const closeButton = document.getElementById("close-btn");
const rulesOverlay = document.getElementById("rules");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const scoreDisplay = document.getElementById("score-display");
const livesDisplay = document.getElementById("lives-display");
const flashOverlay = document.getElementById("flash-overlay");
const replayBtn = document.getElementById("replay-btn");

// Game state
let score = 0;
let lives = 3;
let gameOver = false;
let gameStarted = false;
let isTouching = false;

// Canvas sizing
const baseWidth = 800;
const baseHeight = 600;
const heightRatio = 0.75;

function resizeCanvas() {
  const maxWidth = Math.min(800, window.innerWidth * 0.95 - 40);
  canvas.width = maxWidth;
  canvas.height = maxWidth * heightRatio;
  
  // Scale factor for game elements
  const scale = canvas.width / baseWidth;
  
  // Update ball
  ball.x = ball.x * scale;
  ball.y = ball.y * scale;
  ball.size = 10 * scale;
  ball.speed = 4 * scale;
  ball.dx = ball.dx > 0 ? ball.speed : -ball.speed;
  ball.dy = ball.dy > 0 ? ball.speed : -ball.speed;
  
  // Update paddle
  paddle.w = 80 * scale;
  paddle.h = 10 * scale;
  paddle.y = canvas.height - 20 * scale;
  paddle.speed = 8 * scale;
  
  // Update brick info
  brickInfo.w = 70 * scale;
  brickInfo.h = 20 * scale;
  brickInfo.padding = 10 * scale;
  brickInfo.offsetX = 45 * scale;
  brickInfo.offsetY = 60 * scale;
  
  // Recalculate bricks
  initBricks();
}

function initBricks() {
  bricks.length = 0;
  for (let i = 0; i < brickRowCount; i++) {
    bricks[i] = [];
    for (let j = 0; j < brickColumnCount; j++) {
      const x = i * (brickInfo.w + brickInfo.padding) + brickInfo.offsetX;
      const y = j * (brickInfo.h + brickInfo.padding) + brickInfo.offsetY;
      bricks[i][j] = { x, y, ...brickInfo, visible: true };
    }
  }
}

// Game constants
const brickRowCount = 9;
const brickColumnCount = 5;

// Elements
const ball = {
  x: baseWidth / 2,
  y: baseHeight / 2,
  size: 10,
  speed: 4,
  dx: 4,
  dy: -4,
};

const paddle = {
  x: baseWidth / 2 - 40,
  y: baseHeight - 20,
  w: 80,
  h: 10,
  speed: 8,
  dx: 0,
};

const brickInfo = {
  w: 70,
  h: 20,
  padding: 10,
  offsetX: 45,
  offsetY: 60,
  visible: true,
};

const bricks = [];
initBricks();

// Get colors from CSS
const getColor = (varName) => getComputedStyle(document.documentElement).getPropertyValue(varName).trim();

// Create Elements
function drawBall() {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2);
  ctx.fillStyle = "#e85d04";
  ctx.fill();
  ctx.closePath();
}

function drawPaddle() {
  ctx.beginPath();
  ctx.rect(paddle.x, paddle.y, paddle.w, paddle.h);
  ctx.fillStyle = "#ffd93d";
  ctx.fill();
  ctx.closePath();
}

function drawScore() {
  ctx.font = 'bold 20px "Pacifico", cursive';
  ctx.fillStyle = "#ffd93d";
  ctx.textAlign = "center";
  ctx.fillText(`Score: ${score}`, canvas.width / 2, 30);
  ctx.textAlign = "left";
}

function drawBricks() {
  const colors = ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#9b59b6"];
  bricks.forEach((column, colIndex) => {
    column.forEach((brick, rowIndex) => {
      if (brick.visible) {
        ctx.beginPath();
        ctx.rect(brick.x, brick.y, brick.w, brick.h);
        
        // Gradient effect for bricks
        const gradient = ctx.createLinearGradient(brick.x, brick.y, brick.x, brick.y + brick.h);
        const colorIndex = (colIndex + rowIndex) % colors.length;
        gradient.addColorStop(0, colors[colorIndex]);
        gradient.addColorStop(1, adjustColor(colors[colorIndex], -30));
        
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.closePath();
        
        // Add shine effect
        ctx.beginPath();
        ctx.rect(brick.x + 2, brick.y + 2, brick.w - 4, brick.h / 3);
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.fill();
        ctx.closePath();
      }
    });
  });
}

function adjustColor(color, amount) {
  const hex = color.replace("#", "");
  const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function draw() {
  // clear
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // draw background pattern
  drawBackground();
  
  // draw
  drawBricks();
  drawBall();
  drawPaddle();
  drawScore();
}

// Draw a subtle background grid
function drawBackground() {
  ctx.fillStyle = "#f0f0f0";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Subtle grid pattern
  ctx.strokeStyle = "rgba(0, 0, 0, 0.05)";
  ctx.lineWidth = 1;
  const gridSize = 30;
  
  for (let x = 0; x < canvas.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  
  for (let y = 0; y < canvas.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

// Animate Elements
function movePaddle() {
  paddle.x += paddle.dx;
  if (paddle.x + paddle.w > canvas.width) paddle.x = canvas.width - paddle.w;
  if (paddle.x < 0) paddle.x = 0;
}

function moveBall() {
  if (!gameStarted) return;
  
  ball.x += ball.dx;
  ball.y += ball.dy;
  
  // wall collision
  if (ball.x + ball.size > canvas.width || ball.x - ball.size < 0) {
    ball.dx *= -1;
  }
  if (ball.y - ball.size < 0) {
    ball.dy *= -1;
  }
  
  // paddle collision
  if (
    ball.dy > 0 &&
    ball.x + ball.size > paddle.x &&
    ball.x - ball.size < paddle.x + paddle.w &&
    ball.y + ball.size >= paddle.y &&
    ball.y + ball.size <= paddle.y + paddle.h + ball.speed
  ) {
    ball.y = paddle.y - ball.size;
    const hitPos = (ball.x - paddle.x) / paddle.w;
    const angle = (hitPos - 0.5) * Math.PI * 0.7;
    const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
    ball.dx = Math.sin(angle) * speed;
    ball.dy = -Math.abs(Math.cos(angle) * speed);
  }
  
  // bricks collision
  bricks.forEach((column) => {
    column.forEach((brick) => {
      if (brick.visible) {
        const closestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.w));
        const closestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.h));
        const distX = ball.x - closestX;
        const distY = ball.y - closestY;
        const dist = Math.sqrt(distX * distX + distY * distY);
        
        if (dist < ball.size) {
          const overlapX = ball.size - Math.abs(distX);
          const overlapY = ball.size - Math.abs(distY);
          
          if (overlapX < overlapY) {
            ball.dx *= -1;
            ball.x += distX > 0 ? overlapX : -overlapX;
          } else {
            ball.dy *= -1;
            ball.y += distY > 0 ? overlapY : -overlapY;
          }
          
          brick.visible = false;
          increaseScore();
          createParticles(brick.x + brick.w / 2, brick.y + brick.h / 2);
        }
      }
    });
  });
  
  // game over - ball falls
  if (ball.y + ball.size > canvas.height) {
    lives--;
    updateLives();
    
    if (lives <= 0) {
      endGame();
    } else {
      resetBall();
      triggerFlash();
    }
  }
}

function increaseScore() {
  score++;
  scoreDisplay.textContent = score;
  if (score % (brickRowCount * brickColumnCount) === 0) {
    showAllBricks();
  }
}

function updateLives() {
  livesDisplay.textContent = lives;
}

function showAllBricks() {
  bricks.forEach((column) => {
    column.forEach((brick) => (brick.visible = true));
  });
}

function resetBall() {
  ball.x = canvas.width / 2;
  ball.y = canvas.height / 2;
  const scale = canvas.width / baseWidth;
  ball.dx = (Math.random() > 0.5 ? 1 : -1) * 4 * scale;
  ball.dy = -4 * scale;
}

function triggerFlash() {
  flashOverlay.classList.add("active");
  setTimeout(() => flashOverlay.classList.remove("active"), 300);
}

function endGame() {
  gameOver = true;
  replayBtn.style.display = "block";
}

function resetGame() {
  score = 0;
  lives = 3;
  gameOver = false;
  gameStarted = false;
  scoreDisplay.textContent = score;
  livesDisplay.textContent = lives;
  replayBtn.style.display = "none";
  showAllBricks();
  resetBall();
}

// Particle system
const particles = [];

function createParticles(x, y) {
  for (let i = 0; i < 8; i++) {
    particles.push({
      x,
      y,
      dx: (Math.random() - 0.5) * 8,
      dy: (Math.random() - 0.5) * 8,
      life: 1,
      size: Math.random() * 4 + 2,
      color: ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff"][Math.floor(Math.random() * 4)],
    });
  }
}

function updateParticles() {
  particles.forEach((p, i) => {
    p.x += p.dx;
    p.y += p.dy;
    p.life -= 0.02;
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  });
}

function drawParticles() {
  particles.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.closePath();
  });
}

// Handle Key Events
function keyDown(e) {
  if (e.key === "Right" || e.key === "ArrowRight") {
    paddle.dx = paddle.speed;
    if (!gameStarted && !gameOver) gameStarted = true;
  } else if (e.key === "Left" || e.key === "ArrowLeft") {
    paddle.dx = -paddle.speed;
    if (!gameStarted && !gameOver) gameStarted = true;
  } else if (e.key === " " || e.key === "Space") {
    if (gameOver) {
      resetGame();
    } else if (!gameStarted) {
      gameStarted = true;
    }
  }
}

function keyUp(e) {
  if (
    e.key === "Right" ||
    e.key === "ArrowRight" ||
    e.key === "Left" ||
    e.key === "ArrowLeft"
  ) {
    paddle.dx = 0;
  }
}

// Mouse control
function handleMouseMove(e) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  paddle.x = mouseX - paddle.w / 2;
  
  // Keep paddle in bounds
  if (paddle.x < 0) paddle.x = 0;
  if (paddle.x + paddle.w > canvas.width) paddle.x = canvas.width - paddle.w;
  
  if (!gameStarted && !gameOver) gameStarted = true;
}

// Touch controls - hold to control paddle
function handleTouchStart(e) {
  e.preventDefault();
  isTouching = true;
  
  const rect = canvas.getBoundingClientRect();
  const touchX = e.touches[0].clientX - rect.left;
  paddle.x = touchX - paddle.w / 2;
  
  // Keep paddle in bounds
  if (paddle.x < 0) paddle.x = 0;
  if (paddle.x + paddle.w > canvas.width) paddle.x = canvas.width - paddle.w;
  
  if (!gameStarted && !gameOver) gameStarted = true;
}

function handleTouchMove(e) {
  e.preventDefault();
  if (!isTouching) return;
  
  const rect = canvas.getBoundingClientRect();
  const touchX = e.touches[0].clientX - rect.left;
  paddle.x = touchX - paddle.w / 2;
  
  // Keep paddle in bounds
  if (paddle.x < 0) paddle.x = 0;
  if (paddle.x + paddle.w > canvas.width) paddle.x = canvas.width - paddle.w;
}

function handleTouchEnd(e) {
  e.preventDefault();
  isTouching = false;
}

function handleClick() {
  if (!gameStarted && !gameOver) gameStarted = true;
}

// Update Canvas
function update() {
  movePaddle();
  if (!gameOver) moveBall();
  updateParticles();
  draw();
  drawParticles();
  requestAnimationFrame(update);
}

// Event Listeners
document.addEventListener("keydown", keyDown);
document.addEventListener("keyup", keyUp);
canvas.addEventListener("mousemove", handleMouseMove);
canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
canvas.addEventListener("touchend", handleTouchEnd, { passive: false });
canvas.addEventListener("click", handleClick);
rulesButton.addEventListener("click", () => rulesOverlay.classList.add("show"));
closeButton.addEventListener("click", () => rulesOverlay.classList.remove("show"));
replayBtn.addEventListener("click", resetGame);
window.addEventListener("resize", resizeCanvas);

// Close rules when clicking outside
rulesOverlay.addEventListener("click", (e) => {
  if (e.target === rulesOverlay) {
    rulesOverlay.classList.remove("show");
  }
});

// Init
resizeCanvas();
update();
