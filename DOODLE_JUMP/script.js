(function () {
  "use strict";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  if (!ctx.roundRect) {
    ctx.roundRect = function (x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      this.beginPath();
      this.moveTo(x + r, y);
      this.lineTo(x + w - r, y);
      this.quadraticCurveTo(x + w, y, x + w, y + r);
      this.lineTo(x + w, y + h - r);
      this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      this.lineTo(x + r, y + h);
      this.quadraticCurveTo(x, y + h, x, y + h - r);
      this.lineTo(x, y + r);
      this.quadraticCurveTo(x, y, x + r, y);
    };
  }
  
  const scoreEl = document.getElementById("scoreEl");
  const highScoreEl = document.getElementById("highScoreEl");
  const startOverlay = document.getElementById("startOverlay");
  const gameOverOverlay = document.getElementById("gameOverOverlay");
  const startBtn = document.getElementById("startBtn");
  const restartBtn = document.getElementById("restartBtn");
  const finalScoreEl = document.getElementById("finalScoreEl");
  const btnLeft = document.getElementById("btnLeft");
  const btnRight = document.getElementById("btnRight");
  const gameWrapper = document.querySelector(".game-wrapper");

  const CANVAS_WIDTH = 480;
  const CANVAS_HEIGHT = 600;
  const GRAVITY = 0.45;
  const JUMP_FORCE = -12;
  const MOVE_SPEED = 5.5;
  const PLATFORM_MIN_WIDTH = 60;
  const PLATFORM_MAX_WIDTH = 120;
  const PLATFORM_HEIGHT = 14;
  const PLATFORM_GAP_MIN = 50;
  const PLATFORM_GAP_MAX = 120;
  const PLAYER_WIDTH = 36;
  const PLAYER_HEIGHT = 40;
  const CAMERA_LEAD = 0.4;

  let animationId = null;
  let player = null;
  let platforms = [];
  let cameraY = 0;
  let startCameraY = 0;
  let score = 0;
  let highScore = parseInt(localStorage.getItem("doodle-high-score") || "0", 10);
  let gameRunning = false;
  let keys = { left: false, right: false };
  let time = 0;
  
  // Visual effects
  let particles = [];
  let trailParticles = [];
  let clouds = [];

  // Initialize clouds
  function initClouds() {
    clouds = [];
    for (let i = 0; i < 5; i++) {
      clouds.push({
        x: Math.random() * CANVAS_WIDTH,
        y: -Math.random() * 500 - 50,
        width: 40 + Math.random() * 60,
        height: 15 + Math.random() * 20,
        speed: 0.2 + Math.random() * 0.3,
        opacity: 0.3 + Math.random() * 0.4
      });
    }
  }

  function setPixelRatio() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = CANVAS_WIDTH * dpr;
    canvas.height = CANVAS_HEIGHT * dpr;
    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";
    ctx.scale(dpr, dpr);
  }

  function createPlatform(x, y, width, type) {
    return {
      x,
      y,
      width,
      height: PLATFORM_HEIGHT,
      type: type || "normal",
      moveDir: type === "moving" ? (Math.random() > 0.5 ? 1 : -1) : 0,
      moveRange: type === "moving" ? 40 + Math.random() * 40 : 0,
      startX: x,
      pulsePhase: Math.random() * Math.PI * 2,
    };
  }

  function initPlatforms() {
    platforms = [];
    let y = CANVAS_HEIGHT - 80;
    for (let i = 0; i < 10; i++) {
      const width =
        PLATFORM_MIN_WIDTH + Math.random() * (PLATFORM_MAX_WIDTH - PLATFORM_MIN_WIDTH);
      let x = Math.random() * (CANVAS_WIDTH - width);
      let type = "normal";
      if (i === 0) {
        x = (CANVAS_WIDTH - width) / 2;
      } else {
        const typeRand = Math.random();
        if (typeRand < 0.15) type = "break";
        else if (typeRand < 0.35) type = "moving";
      }
      platforms.push(createPlatform(x, y, width, type));
      y -= PLATFORM_GAP_MIN + Math.random() * (PLATFORM_GAP_MAX - PLATFORM_GAP_MIN);
    }
  }

  function addPlatformsAbove(topY) {
    let lastY = platforms.length ? Math.min(...platforms.map((p) => p.y)) : topY;
    while (lastY > topY - CANVAS_HEIGHT - 200) {
      lastY -= PLATFORM_GAP_MIN + Math.random() * (PLATFORM_GAP_MAX - PLATFORM_GAP_MIN);
      const width =
        PLATFORM_MIN_WIDTH + Math.random() * (PLATFORM_MAX_WIDTH - PLATFORM_MIN_WIDTH);
      const x = Math.random() * (CANVAS_WIDTH - width);
      const typeRand = Math.random();
      let type = "normal";
      if (typeRand < 0.12) type = "break";
      else if (typeRand < 0.32) type = "moving";
      platforms.push(createPlatform(x, lastY, width, type));
    }
  }

  function resetGame() {
    cameraY = 0;
    score = 0;
    time = 0;
    keys.left = false;
    keys.right = false;
    particles = [];
    trailParticles = [];
    if (btnLeft) btnLeft.classList.remove("active");
    if (btnRight) btnRight.classList.remove("active");
    initClouds();
    initPlatforms();
    const firstPlatform = platforms[0];
    player = {
      x: (CANVAS_WIDTH - PLAYER_WIDTH) / 2,
      y: firstPlatform.y - PLAYER_HEIGHT - 2,
      vx: 0,
      vy: 0,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      facingRight: true,
      jumpTimer: 0,
    };
    startCameraY = player.y - CANVAS_HEIGHT * CAMERA_LEAD;
    gameRunning = true;
    scoreEl.textContent = "0";
    highScoreEl.textContent = highScore;
    
    // Remove shake effect
    gameWrapper.classList.remove("shake");
  }

  // Particle system for jump effects
  function createJumpParticles(x, y, type) {
    const count = type === "break" ? 12 : 8;
    const colors = type === "break" 
      ? ["#c9a959", "#b8860b", "#8b7355", "#d4b86a"]
      : ["#6bcb77", "#4ade80", "#2d8a3e", "#a8e6b3"];
    
    for (let i = 0; i < count; i++) {
      particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * -4 - 1,
        size: 3 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
        decay: 0.02 + Math.random() * 0.02,
      });
    }
  }

  // Trail particles for player movement
  function createTrailParticle() {
    if (!player || Math.abs(player.vx) < 2) return;
    trailParticles.push({
      x: player.x + PLAYER_WIDTH / 2,
      y: player.y + PLAYER_HEIGHT,
      size: 6,
      life: 1,
      decay: 0.08,
    });
  }

  function updateParticles() {
    // Update jump particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.life -= p.decay;
      p.size *= 0.97;
      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }
    
    // Update trail particles
    for (let i = trailParticles.length - 1; i >= 0; i--) {
      const p = trailParticles[i];
      p.life -= p.decay;
      p.size *= 0.95;
      if (p.life <= 0) {
        trailParticles.splice(i, 1);
      }
    }
    
    // Update clouds
    clouds.forEach(cloud => {
      cloud.x += cloud.speed;
      if (cloud.x > CANVAS_WIDTH + cloud.width) {
        cloud.x = -cloud.width;
        cloud.y = cameraY + Math.random() * CANVAS_HEIGHT * 0.6 - 50;
      }
    });
  }

  function drawParticles() {
    // Draw trail particles
    trailParticles.forEach(p => {
      const screenY = p.y - cameraY;
      if (screenY < -20 || screenY > CANVAS_HEIGHT + 20) return;
      
      ctx.save();
      ctx.globalAlpha = p.life * 0.5;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(p.x, screenY, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    
    // Draw jump particles
    particles.forEach(p => {
      const screenY = p.y - cameraY;
      if (screenY < -20 || screenY > CANVAS_HEIGHT + 20) return;
      
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, screenY, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawClouds() {
    clouds.forEach(cloud => {
      const screenY = cloud.y - cameraY;
      if (screenY < -50 || screenY > CANVAS_HEIGHT + 50) return;
      
      ctx.save();
      ctx.globalAlpha = cloud.opacity;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(cloud.x, screenY, cloud.width / 2, cloud.height / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawPlayer(screenY) {
    const x = player.x;
    const y = player.y - cameraY;
    if (y < -PLAYER_HEIGHT - 20 || y > CANVAS_HEIGHT + 20) return;

    ctx.save();
    ctx.translate(x + PLAYER_WIDTH / 2, y + PLAYER_HEIGHT / 2);
    
    // Flip based on direction
    if (!player.facingRight) ctx.scale(-1, 1);
    
    ctx.translate(-(x + PLAYER_WIDTH / 2), -(y + PLAYER_HEIGHT / 2));

    // Body
    ctx.fillStyle = "#2d3436";
    ctx.beginPath();
    ctx.roundRect(x, y, PLAYER_WIDTH, PLAYER_HEIGHT, 10);
    ctx.fill();
    
    // Body highlight
    ctx.fillStyle = "#3d4848";
    ctx.beginPath();
    ctx.roundRect(x + 4, y + 4, PLAYER_WIDTH - 8, PLAYER_HEIGHT - 16, 6);
    ctx.fill();

    // Eyes - white part
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(x + 11, y + 14, 7, 8, 0, 0, Math.PI * 2);
    ctx.ellipse(x + PLAYER_WIDTH - 11, y + 14, 7, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pupils - looking in movement direction
    const pupilOffsetX = player.vx * 0.3;
    ctx.fillStyle = "#2d3436";
    ctx.beginPath();
    ctx.arc(x + 11 + Math.max(-2, Math.min(2, pupilOffsetX)), y + 15, 3.5, 0, Math.PI * 2);
    ctx.arc(x + PLAYER_WIDTH - 11 + Math.max(-2, Math.min(2, pupilOffsetX)), y + 15, 3.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye shine
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x + 9, y + 12, 1.5, 0, Math.PI * 2);
    ctx.arc(x + PLAYER_WIDTH - 9, y + 12, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    const legOffset = Math.sin(time * 0.3) * 3;
    ctx.fillStyle = "#2d3436";
    ctx.beginPath();
    ctx.roundRect(x + 6, y + PLAYER_HEIGHT - 6, 8, 10, 3);
    ctx.roundRect(x + PLAYER_WIDTH - 14, y + PLAYER_HEIGHT - 6, 8, 10, 3);
    ctx.fill();

    // Jump squish effect
    if (player.jumpTimer > 0) {
      ctx.fillStyle = "rgba(107, 203, 119, 0.3)";
      ctx.beginPath();
      ctx.ellipse(x + PLAYER_WIDTH / 2, y + PLAYER_HEIGHT + 5, PLAYER_WIDTH / 2, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawPlatform(p) {
    const y = p.y - cameraY;
    if (y < -PLATFORM_HEIGHT - 20 || y > CANVAS_HEIGHT + 50) return;

    const x = p.x;
    const w = p.width;
    const h = p.height;
    
    // Pulsing effect for moving platforms
    const pulse = p.type === "moving" ? Math.sin(time * 0.1 + p.pulsePhase) * 0.1 + 1 : 1;

    if (p.type === "normal") {
      // Gradient for normal platform
      const gradient = ctx.createLinearGradient(x, y, x, y + h);
      gradient.addColorStop(0, "#6bcb77");
      gradient.addColorStop(1, "#4a9e5a");
      ctx.fillStyle = gradient;
      ctx.strokeStyle = "#4ade80";
    } else if (p.type === "break") {
      // Gradient for breakable platform
      const gradient = ctx.createLinearGradient(x, y, x, y + h);
      gradient.addColorStop(0, "#c9a959");
      gradient.addColorStop(1, "#a68a45");
      ctx.fillStyle = gradient;
      ctx.strokeStyle = "#d4b86a";
    } else {
      // Gradient for moving platform
      const gradient = ctx.createLinearGradient(x, y, x, y + h);
      gradient.addColorStop(0, "#4d96ff");
      gradient.addColorStop(1, "#3a7bd5");
      ctx.fillStyle = gradient;
      ctx.strokeStyle = "#6eb5ff";
    }

    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, w * pulse, h, 6);
    ctx.fill();
    ctx.stroke();
    
    // Add shine effect
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    ctx.beginPath();
    ctx.roundRect(x + 4, y + 2, w * pulse - 8, 4, 2);
    ctx.fill();
  }

  function showScorePopup(points, x, y) {
    const popup = document.createElement("div");
    popup.className = "score-popup";
    popup.textContent = "+" + points;
    popup.style.left = x + "px";
    popup.style.top = y + "px";
    gameWrapper.appendChild(popup);
    
    setTimeout(() => popup.remove(), 1000);
  }

  function bumpScore() {
    scoreEl.classList.add("bump");
    setTimeout(() => scoreEl.classList.remove("bump"), 200);
  }

  function triggerScreenShake() {
    gameWrapper.classList.add("shake");
    setTimeout(() => gameWrapper.classList.remove("shake"), 500);
  }

  function gameOver() {
    gameRunning = false;
    if (animationId) cancelAnimationFrame(animationId);
    
    // Show game over overlay with animation
    finalScoreEl.textContent = score;
    
    // Check for new high score
    const isNewHighScore = score > highScore && score > 0;
    if (isNewHighScore) {
      // Add new high score message
      let hsMsg = document.querySelector(".new-high-score");
      if (!hsMsg) {
        hsMsg = document.createElement("div");
        hsMsg.className = "new-high-score";
        hsMsg.textContent = "🎉 New High Score! 🎉";
        gameOverOverlay.insertBefore(hsMsg, restartBtn);
      }
    }
    
    // Screen shake effect
    triggerScreenShake();
    
    gameOverOverlay.classList.remove("hidden");
    setTimeout(() => gameOverOverlay.classList.add("visible"), 10);
  }

  function gameLoop() {
    if (!gameRunning) return;

    time++;
    const dt = 1;

    if (keys.left) {
      player.vx = -MOVE_SPEED;
      player.facingRight = false;
    }
    else if (keys.right) {
      player.vx = MOVE_SPEED;
      player.facingRight = true;
    }
    else player.vx *= 0.85;
    
    player.x += player.vx;
    player.x = Math.max(0, Math.min(CANVAS_WIDTH - player.width, player.x));
    player.vy += GRAVITY;
    player.y += player.vy;
    
    // Update jump timer for visual effects
    if (player.vy < 0) {
      player.jumpTimer = 5;
    } else {
      player.jumpTimer = Math.max(0, player.jumpTimer - 1);
    }
    
    // Create trail particles when moving fast
    if (time % 3 === 0) {
      createTrailParticle();
    }

    for (let i = platforms.length - 1; i >= 0; i--) {
      const p = platforms[i];
      if (p.type === "moving") {
        p.x = p.startX + Math.sin((time + p.startX) * 0.03) * p.moveRange * p.moveDir;
        p.x = Math.max(0, Math.min(CANVAS_WIDTH - p.width, p.x));
      }

      const py = p.y - cameraY;
      if (py > CANVAS_HEIGHT + 100) {
        platforms.splice(i, 1);
        continue;
      }

      const playerBottom = player.y + player.height;
      const platformTop = p.y;
      const overlapX =
        player.x + player.width > p.x && player.x < p.x + p.width;
      if (
        overlapX &&
        playerBottom >= platformTop - 2 &&
        playerBottom <= platformTop + 12 &&
        player.vy >= 0
      ) {
        // Jump!
        const prevVy = player.vy;
        player.vy = JUMP_FORCE;
        player.y = platformTop - player.height - 1;
        
        // Create jump particles
        createJumpParticles(player.x + player.width / 2, platformTop, p.type);
        
        // Bump score animation
        bumpScore();
        
        if (p.type === "break") {
          platforms.splice(i, 1);
          // Extra particles for breaking
          createJumpParticles(p.x + p.width / 2, p.y, "break");
        }
      }
    }

    const targetCameraY = player.y - CANVAS_HEIGHT * CAMERA_LEAD;
    if (targetCameraY < cameraY) {
      const oldCameraY = cameraY;
      cameraY = targetCameraY;
      const newScore = Math.max(0, Math.floor((startCameraY - cameraY) / 8));
      if (newScore > score) {
        const pointsGained = newScore - score;
        score = newScore;
        scoreEl.textContent = score;
        
        // Show score popup occasionally
        if (pointsGained > 5 && Math.random() > 0.5) {
          showScorePopup(pointsGained, CANVAS_WIDTH / 2 - 20, 100);
        }
        
        if (score > highScore) {
          highScore = score;
          highScoreEl.textContent = highScore;
          localStorage.setItem("doodle-high-score", String(highScore));
        }
      }
      addPlatformsAbove(cameraY);
    }

    // Update particles
    updateParticles();

    if (player.y - cameraY > CANVAS_HEIGHT + 50) {
      gameOver();
      return;
    }

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw clouds
    drawClouds();
    
    // Draw platforms
    platforms.forEach(drawPlatform);
    
    // Draw particles
    drawParticles();
    
    // Draw player
    drawPlayer();

    animationId = requestAnimationFrame(gameLoop);
  }

  function startGame() {
    startOverlay.classList.remove("visible");
    startOverlay.classList.add("hidden");
    gameOverOverlay.classList.remove("visible");
    gameOverOverlay.classList.add("hidden");
    
    // Remove any existing high score message
    const hsMsg = document.querySelector(".new-high-score");
    if (hsMsg) hsMsg.remove();
    
    resetGame();
    gameLoop();
  }

  startBtn.addEventListener("click", startGame);
  restartBtn.addEventListener("click", startGame);

  document.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.left = true;
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.right = true;
    if (e.key === " ") e.preventDefault();
  });

  document.addEventListener("keyup", function (e) {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.left = false;
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.right = false;
    
    // Space key to start/restart game
    if (e.key === " ") {
      e.preventDefault();
      if (!gameRunning) {
        if (!startOverlay.classList.contains("hidden")) {
          startGame();
        } else if (!gameOverOverlay.classList.contains("hidden")) {
          startGame();
        }
      }
    }
  });

  function setKeyLeft(value) {
    keys.left = value;
    if (btnLeft) btnLeft.classList.toggle("active", value);
  }
  function setKeyRight(value) {
    keys.right = value;
    if (btnRight) btnRight.classList.toggle("active", value);
  }
  if (btnLeft) {
    btnLeft.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      setKeyLeft(true);
    });
    btnLeft.addEventListener("pointerup", function () { setKeyLeft(false); });
    btnLeft.addEventListener("pointerleave", function () { setKeyLeft(false); });
  }
  if (btnRight) {
    btnRight.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      setKeyRight(true);
    });
    btnRight.addEventListener("pointerup", function () { setKeyRight(false); });
    btnRight.addEventListener("pointerleave", function () { setKeyRight(false); });
  }

  canvas.addEventListener("click", function () {
    if (gameRunning) return;
    if (!startOverlay.classList.contains("hidden")) startGame();
  });

  window.addEventListener("resize", setPixelRatio);
  setPixelRatio();
  highScoreEl.textContent = highScore;
  
  // Initialize clouds for start screen
  initClouds();
  
  // Add initial animation class to overlays
  startOverlay.classList.add("visible");
})();
