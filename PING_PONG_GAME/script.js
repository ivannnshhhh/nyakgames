// ========================================
// PING PONG ARCADE - Game Script
// ========================================

// Initialize canvas
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// UI Elements
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const resumeBtn = document.getElementById("resume-btn");
const restartBtn = document.getElementById("restart-btn");
const playAgainBtn = document.getElementById("play-again-btn");
const modalPlayAgainBtn = document.getElementById("modal-play-again");

// Overlays
const startOverlay = document.getElementById("start-overlay");
const pauseOverlay = document.getElementById("pause-overlay");
const gameoverOverlay = document.getElementById("gameover-overlay");
const winModal = document.getElementById("win-modal");

// Score elements
const scoreLeftEl = document.getElementById("score-left");
const scoreRightEl = document.getElementById("score-right");

// Status elements
const statusIndicator = document.querySelector(".status-indicator");
const statusText = document.querySelector(".status-text");

// Game state
let animationId;
let gameRunning = false;
let gamePaused = false;
let gameStarted = false;

// Ball properties
let ballRadius = 10;
let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
let ballSpeedX = 5;
let ballSpeedY = 5;

// Paddle properties
const paddleHeight = 80;
const paddleWidth = 10;
let leftPaddleY = canvas.height / 2 - paddleHeight / 2;
let rightPaddleY = canvas.height / 2 - paddleHeight / 2;
const paddleSpeed = 8;

// Score properties
let leftPlayerScore = 0;
let rightPlayerScore = 0;
const maxScore = 10;

// Keyboard state
let upPressed = false;
let downPressed = false;
let wPressed = false;
let sPressed = false;

// Mobile button elements
const p1UpBtn = document.getElementById("p1-up-btn");
const p1DownBtn = document.getElementById("p1-down-btn");
const p2UpBtn = document.getElementById("p2-up-btn");
const p2DownBtn = document.getElementById("p2-down-btn");

// ========================================
// Game State Management
// ========================================

function showOverlay(overlay) {
  overlay.classList.remove("hidden");
}

function hideOverlay(overlay) {
  overlay.classList.add("hidden");
}

function updateStatus(status, text) {
  statusIndicator.className = "status-indicator " + status;
  statusText.textContent = text;
}

function enablePauseButton() {
  pauseBtn.disabled = false;
}

function disablePauseButton() {
  pauseBtn.disabled = true;
}

// ========================================
// Button Event Listeners
// ========================================

startBtn.addEventListener("click", function () {
  if (!gameRunning && !gameStarted) {
    gameRunning = true;
    gameStarted = true;
    hideOverlay(startOverlay);
    enablePauseButton();
    updateStatus("active", "Game in progress");
    loop();
  }
});

pauseBtn.addEventListener("click", function () {
  if (gameRunning && !gamePaused) {
    gamePaused = true;
    gameRunning = false;
    cancelAnimationFrame(animationId);
    showOverlay(pauseOverlay);
    updateStatus("paused", "Game paused");
  }
});

resumeBtn.addEventListener("click", function () {
  if (gamePaused) {
    gamePaused = false;
    gameRunning = true;
    hideOverlay(pauseOverlay);
    updateStatus("active", "Game in progress");
    loop();
  }
});

restartBtn.addEventListener("click", function () {
  resetGame();
  hideOverlay(pauseOverlay);
  showOverlay(startOverlay);
});

playAgainBtn.addEventListener("click", function () {
  resetGame();
  hideOverlay(gameoverOverlay);
  showOverlay(startOverlay);
});

modalPlayAgainBtn.addEventListener("click", function () {
  resetGame();
  hideOverlay(winModal);
  showOverlay(startOverlay);
});

// Keyboard shortcuts
document.addEventListener("keydown", function(e) {
  // Prevent default scrolling for game control keys
  if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === " " || e.key === "Spacebar") {
    e.preventDefault();
  }
  
  if (e.key === " " || e.key === "Spacebar") {
    if (!gameStarted) {
      startBtn.click();
    } else if (gamePaused) {
      resumeBtn.click();
    } else if (gameRunning) {
      pauseBtn.click();
    }
  }
  
  if (e.key === "Enter") {
    if (!gameStarted) {
      startBtn.click();
    } else if (gamePaused) {
      resumeBtn.click();
    }
  }
  
  // Pass through game controls
  if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key.toLowerCase() === "w" || e.key.toLowerCase() === "s") {
    keyDownHandler(e);
  }
});

document.addEventListener("keyup", function(e) {
  // Prevent default for consistency
  if (e.key === "ArrowUp" || e.key === "ArrowDown") {
    e.preventDefault();
  }
  
  if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key.toLowerCase() === "w" || e.key.toLowerCase() === "s") {
    keyUpHandler(e);
  }
});

// ========================================
// Keyboard Handlers
// ========================================

function keyDownHandler(e) {
  if (e.key === "ArrowUp") {
    upPressed = true;
  } else if (e.key === "ArrowDown") {
    downPressed = true;
  } else if (e.key.toLowerCase() === "w") {
    wPressed = true;
  } else if (e.key.toLowerCase() === "s") {
    sPressed = true;
  }
}

function keyUpHandler(e) {
  if (e.key === "ArrowUp") {
    upPressed = false;
  } else if (e.key === "ArrowDown") {
    downPressed = false;
  } else if (e.key.toLowerCase() === "w") {
    wPressed = false;
  } else if (e.key.toLowerCase() === "s") {
    sPressed = false;
  }
}

// ========================================
// Mobile Touch Button Handlers
// ========================================

function addMobileButtonEvents() {
  // Player 1 Up button
  p1UpBtn.addEventListener("touchstart", function(e) {
    e.preventDefault();
    wPressed = true;
    p1UpBtn.classList.add("pressed");
  });
  
  p1UpBtn.addEventListener("touchend", function(e) {
    e.preventDefault();
    wPressed = false;
    p1UpBtn.classList.remove("pressed");
  });
  
  // Player 1 Down button
  p1DownBtn.addEventListener("touchstart", function(e) {
    e.preventDefault();
    sPressed = true;
    p1DownBtn.classList.add("pressed");
  });
  
  p1DownBtn.addEventListener("touchend", function(e) {
    e.preventDefault();
    sPressed = false;
    p1DownBtn.classList.remove("pressed");
  });
  
  // Player 2 Up button
  p2UpBtn.addEventListener("touchstart", function(e) {
    e.preventDefault();
    upPressed = true;
    p2UpBtn.classList.add("pressed");
  });
  
  p2UpBtn.addEventListener("touchend", function(e) {
    e.preventDefault();
    upPressed = false;
    p2UpBtn.classList.remove("pressed");
  });
  
  // Player 2 Down button
  p2DownBtn.addEventListener("touchstart", function(e) {
    e.preventDefault();
    downPressed = true;
    p2DownBtn.classList.add("pressed");
  });
  
  p2DownBtn.addEventListener("touchend", function(e) {
    e.preventDefault();
    downPressed = false;
    p2DownBtn.classList.remove("pressed");
  });
  
  // Mouse events for desktop testing
  p1UpBtn.addEventListener("mousedown", function(e) {
    wPressed = true;
    p1UpBtn.classList.add("pressed");
  });
  
  p1UpBtn.addEventListener("mouseup", function(e) {
    wPressed = false;
    p1UpBtn.classList.remove("pressed");
  });
  
  p1UpBtn.addEventListener("mouseleave", function(e) {
    wPressed = false;
    p1UpBtn.classList.remove("pressed");
  });
  
  p1DownBtn.addEventListener("mousedown", function(e) {
    sPressed = true;
    p1DownBtn.classList.add("pressed");
  });
  
  p1DownBtn.addEventListener("mouseup", function(e) {
    sPressed = false;
    p1DownBtn.classList.remove("pressed");
  });
  
  p1DownBtn.addEventListener("mouseleave", function(e) {
    sPressed = false;
    p1DownBtn.classList.remove("pressed");
  });
  
  p2UpBtn.addEventListener("mousedown", function(e) {
    upPressed = true;
    p2UpBtn.classList.add("pressed");
  });
  
  p2UpBtn.addEventListener("mouseup", function(e) {
    upPressed = false;
    p2UpBtn.classList.remove("pressed");
  });
  
  p2UpBtn.addEventListener("mouseleave", function(e) {
    upPressed = false;
    p2UpBtn.classList.remove("pressed");
  });
  
  p2DownBtn.addEventListener("mousedown", function(e) {
    downPressed = true;
    p2DownBtn.classList.add("pressed");
  });
  
  p2DownBtn.addEventListener("mouseup", function(e) {
    downPressed = false;
    p2DownBtn.classList.remove("pressed");
  });
  
  p2DownBtn.addEventListener("mouseleave", function(e) {
    downPressed = false;
    p2DownBtn.classList.remove("pressed");
  });
}

// Initialize mobile button events
addMobileButtonEvents();

// ========================================
// Game Logic
// ========================================

function update() {
  // Move right paddle (Player 2 - Arrow keys)
  if (upPressed && rightPaddleY > 0) {
    rightPaddleY -= paddleSpeed;
  } else if (downPressed && rightPaddleY + paddleHeight < canvas.height) {
    rightPaddleY += paddleSpeed;
  }

  // Move left paddle (Player 1 - W/S keys)
  if (wPressed && leftPaddleY > 0) {
    leftPaddleY -= paddleSpeed;
  } else if (sPressed && leftPaddleY + paddleHeight < canvas.height) {
    leftPaddleY += paddleSpeed;
  }

  // Move ball
  ballX += ballSpeedX;
  ballY += ballSpeedY;

  // Ball collision with top/bottom
  if (ballY - ballRadius < 0 || ballY + ballRadius > canvas.height) {
    ballSpeedY = -ballSpeedY;
  }

  // Ball collision with left paddle
  if (
    ballX - ballRadius < paddleWidth &&
    ballY > leftPaddleY &&
    ballY < leftPaddleY + paddleHeight
  ) {
    ballSpeedX = -ballSpeedX;
    // Add some spin based on where ball hits paddle
    let hitPos = (ballY - (leftPaddleY + paddleHeight / 2)) / (paddleHeight / 2);
    ballSpeedY = hitPos * 5;
  }

  // Ball collision with right paddle
  if (
    ballX + ballRadius > canvas.width - paddleWidth &&
    ballY > rightPaddleY &&
    ballY < rightPaddleY + paddleHeight
  ) {
    ballSpeedX = -ballSpeedX;
    // Add some spin based on where ball hits paddle
    let hitPos = (ballY - (rightPaddleY + paddleHeight / 2)) / (paddleHeight / 2);
    ballSpeedY = hitPos * 5;
  }

  // Ball out of bounds - Score
  if (ballX < 0) {
    rightPlayerScore++;
    updateScore("right");
    resetBall();
    flashScreen();
  } else if (ballX > canvas.width) {
    leftPlayerScore++;
    updateScore("left");
    resetBall();
    flashScreen();
  }

  // Check win condition
  if (leftPlayerScore >= maxScore) {
    playerWin("Player 1");
  } else if (rightPlayerScore >= maxScore) {
    playerWin("Player 2");
  }
}

function updateScore(player) {
  if (player === "left") {
    scoreLeftEl.textContent = leftPlayerScore;
    animateScore(scoreLeftEl);
  } else {
    scoreRightEl.textContent = rightPlayerScore;
    animateScore(scoreRightEl);
  }
}

function animateScore(element) {
  element.classList.remove("pulse");
  void element.offsetWidth; // Trigger reflow
  element.classList.add("pulse");
}

function flashScreen() {
  const container = document.querySelector(".canvas-container");
  container.classList.remove("flash");
  void container.offsetWidth; // Trigger reflow
  container.classList.add("flash");
}

function playerWin(winner) {
  gameRunning = false;
  gameStarted = false;
  cancelAnimationFrame(animationId);
  
  const winnerText = document.getElementById("winner-text");
  const finalScore = document.getElementById("final-score");
  const winnerIcon = document.getElementById("winner-icon");
  const modalWinner = document.getElementById("modal-winner");
  const modalFinalScore = document.getElementById("modal-final-score");
  
  const winnerName = winner === "Player 1" ? "PLAYER 1" : "PLAYER 2";
  const icon = winner === "Player 1" ? "🏆" : "🏆";
  
  winnerText.textContent = winnerName + " WINS!";
  winnerIcon.textContent = icon;
  finalScore.textContent = `Final Score: ${leftPlayerScore} - ${rightPlayerScore}`;
  
  modalWinner.textContent = winnerName + " WINS!";
  modalFinalScore.textContent = `${leftPlayerScore} - ${rightPlayerScore}`;
  
  showOverlay(gameoverOverlay);
  updateStatus("", "Game over");
  disablePauseButton();
}

function resetBall() {
  ballX = canvas.width / 2;
  ballY = canvas.height / 2;
  ballSpeedX = -ballSpeedX;
  // Randomize vertical direction
  ballSpeedY = (Math.random() > 0.5 ? 1 : -1) * (3 + Math.random() * 3);
}

function resetGame() {
  leftPlayerScore = 0;
  rightPlayerScore = 0;
  scoreLeftEl.textContent = "0";
  scoreRightEl.textContent = "0";
  
  leftPaddleY = canvas.height / 2 - paddleHeight / 2;
  rightPaddleY = canvas.height / 2 - paddleHeight / 2;
  
  resetBall();
  
  gameRunning = false;
  gamePaused = false;
  gameStarted = false;
  
  cancelAnimationFrame(animationId);
  
  draw();
  updateStatus("", "Press START to begin");
  disablePauseButton();
}

// ========================================
// Drawing
// ========================================

function draw() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw background gradient
  let gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#0d0d15");
  gradient.addColorStop(0.5, "#0a0a12");
  gradient.addColorStop(1, "#0d0d15");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw center line (dashed)
  ctx.beginPath();
  ctx.setLineDash([15, 10]);
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.strokeStyle = "rgba(0, 245, 255, 0.3)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.closePath();
  
  // Draw center circle
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, 50, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(0, 245, 255, 0.2)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.closePath();
  
  // Draw ball with glow effect
  ctx.shadowColor = "#00f5ff";
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#00f5ff";
  ctx.fill();
  ctx.closePath();
  
  // Draw ball inner highlight
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(ballX - 3, ballY - 3, ballRadius / 3, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.fill();
  ctx.closePath();
  
  // Draw left paddle with glow
  ctx.shadowColor = "#00f5ff";
  ctx.shadowBlur = 10;
  ctx.fillStyle = "#00f5ff";
  ctx.fillRect(0, leftPaddleY, paddleWidth, paddleHeight);
  
  // Draw right paddle with glow
  ctx.shadowColor = "#ff00ff";
  ctx.shadowBlur = 10;
  ctx.fillStyle = "#ff00ff";
  ctx.fillRect(canvas.width - paddleWidth, rightPaddleY, paddleWidth, paddleHeight);
  
  // Reset shadow
  ctx.shadowBlur = 0;
  
  // Draw paddle highlights
  ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
  ctx.fillRect(0, leftPaddleY + 5, 3, paddleHeight - 10);
  ctx.fillRect(canvas.width - paddleWidth, rightPaddleY + 5, 3, paddleHeight - 10);
}

// ========================================
// Game Loop
// ========================================

function loop() {
  if (gameRunning && !gamePaused) {
    update();
    draw();
    animationId = requestAnimationFrame(loop);
  }
}

// Initial draw
addEventListener("load", function() {
  draw();
  updateStatus("", "Press START to begin");
});
