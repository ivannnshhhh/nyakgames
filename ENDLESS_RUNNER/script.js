/* ==========================================
   NEON RUNNER - Arcade Endless Runner Game
   ========================================== */

// ==========================================
// GAME CONFIGURATION
// ==========================================
const CONFIG = {
    // Player settings
    player: {
        width: 50,
        height: 60,
        groundY: 0,          // Calculated based on canvas
        jumpForce: -15,
        gravity: 0.8,
        runFrameCount: 6,
        runFrameSpeed: 8
    },
    
    // Obstacle settings
    obstacle: {
        minWidth: 30,
        maxWidth: 50,
        minHeight: 40,
        maxHeight: 70,
        minGap: 250,        // Minimum gap between obstacles
        maxGap: 600,        // Maximum gap between obstacles
        colors: ['#ff1493', '#ff00ff', '#ff6600', '#ffff00']
    },
    
    // Game settings
    game: {
        initialSpeed: 6,
        maxSpeed: 12,
        scoreIncrement: 0.1,
        
        // Speed levels (like Chrome Dino)
        speedLevels: [
            { minScore: 0, maxScore: 499, speed: 8 },
            { minScore: 500, maxScore: 999, speed: 9 },
            { minScore: 1000, maxScore: 1499, speed: 10 },
            { minScore: 1500, maxScore: 1999, speed: 11 },
            { minScore: 2000, maxScore: 2499, speed: 12 },
            { minScore: 2500, maxScore: 2999, speed: 13 },
            { minScore: 3000, maxScore: 99999, speed: 15 }
        ],
        
        // Gap multiplier based on speed (higher speed = more gap)
        speedGapMultiplier: {
            6: 1.0,    // 100% of gap
            7: 1.1,     // 110% of gap
            8: 1.2,
            9: 1.3,
            10: 1.4,
            11: 1.5,
            12: 1.6
        },
        
        // Smooth speed transition
        speedTransitionSpeed: 0.05
    },
    
    // Visual settings
    colors: {
        background: '#0a0a1a',
        ground: '#00ffff',
        groundGlow: '#00ffff',
        player: '#39ff14',
        playerGlow: '#39ff14',
        particle: '#ffff00'
    }
};

// ==========================================
// GAME STATE
// ==========================================
const GameState = {
    START: 'start',
    PLAYING: 'playing',
    GAME_OVER: 'gameOver'
};

// ==========================================
// MAIN GAME CLASS
// ==========================================
class NeonRunner {
    constructor() {
        // Canvas setup
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.state = GameState.START;
        this.score = 0;
        this.highScore = this.loadHighScore();
        this.gameSpeed = CONFIG.game.initialSpeed;
        this.targetSpeed = CONFIG.game.initialSpeed;
        this.currentSpeedLevel = 0;
        
        // Time-based scoring
        this.lastScoreTime = 0;
        this.scoreRate = 100; // Points per second (like Chrome Dino)
        
        // Player
        this.player = {
            x: 80,
            y: 0,
            velocityY: 0,
            isJumping: false,
            frameIndex: 0,
            frameTimer: 0
        };
        
        // Obstacles
        this.obstacles = [];
        this.nextObstacleDistance = 0;
        
        // Particles
        this.particles = [];
        
        // Ground
        this.groundY = 0;
        
        // Animation
        this.animationId = null;
        this.lastTime = 0;
        
        // Initialize
        this.init();
    }
    
    // Initialize the game
    init() {
        this.resizeCanvas();
        this.bindEvents();
        
        // Display high score in game UI
        document.getElementById('highScoreDisplay').textContent = this.highScore;
        
        this.showStartScreen();
    }
    
    // Resize canvas to fit container
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.groundY = this.canvas.height - 60;
        this.player.y = this.groundY - CONFIG.player.height;
    }
    
    // Load high score from local storage
    loadHighScore() {
        const saved = localStorage.getItem('neonRunnerHighScore');
        return saved ? parseInt(saved) : 0;
    }
    
    // Save high score to local storage
    saveHighScore(score) {
        if (score > this.highScore) {
            this.highScore = score;
            localStorage.setItem('neonRunnerHighScore', score);
        }
    }
    
    // Bind input events
    bindEvents() {
        // Keyboard events
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.handleInput();
            }
        });
        
        // Touch/click events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleInput();
        });
        
        this.canvas.addEventListener('click', (e) => {
            this.handleInput();
        });
        
        // Start screen click
        document.getElementById('startScreen').addEventListener('click', () => {
            if (this.state === GameState.START) {
                this.startGame();
            }
        });
        
        // Play again button
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.restartGame();
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });
    }
    
    // Handle input based on game state
    handleInput() {
        switch (this.state) {
            case GameState.START:
                this.startGame();
                break;
            case GameState.PLAYING:
                this.jump();
                break;
            case GameState.GAME_OVER:
                this.restartGame();
                break;
        }
    }
    
    // Show start screen
    showStartScreen() {
        document.getElementById('startScreen').classList.remove('hidden');
        document.getElementById('gameUI').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
    }
    
    // Start the game
    startGame() {
        // Prevent starting if already playing
        if (this.state === GameState.PLAYING) {
            return;
        }
        
        this.state = GameState.PLAYING;
        this.score = 0;
        this.gameSpeed = CONFIG.game.initialSpeed;
        this.targetSpeed = CONFIG.game.initialSpeed;
        this.currentSpeedLevel = 0;
        this.lastScoreTime = performance.now();
        this.player.y = this.groundY - CONFIG.player.height;
        this.player.velocityY = 0;
        this.player.isJumping = false;
        this.obstacles = [];
        this.particles = [];
        
        // Set initial obstacle spawn distance (at 350px from start)
        this.nextObstacleDistance = 350;
        
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('gameUI').classList.remove('hidden');
        
        this.playJumpSound();
        this.lastTime = performance.now();
        this.gameLoop();
    }
    
    // Restart the game - complete reset
    restartGame() {
        // Cancel any existing animation frame to prevent stacking
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Full reset of all game values
        this.score = 0;
        this.gameSpeed = CONFIG.game.initialSpeed;
        this.targetSpeed = CONFIG.game.initialSpeed;
        this.currentSpeedLevel = 0;
        this.lastScoreTime = performance.now();
        
        // Reset player physics
        this.player.y = this.groundY - CONFIG.player.height;
        this.player.velocityY = 0;
        this.player.isJumping = false;
        this.player.frameIndex = 0;
        this.player.frameTimer = 0;
        
        // Clear all obstacles
        this.obstacles = [];
        
        // Clear all particles
        this.particles = [];
        
        // Reset obstacle spawn distance
        this.nextObstacleDistance = 350;
        
        // Reset animation timing
        this.lastTime = performance.now();
        
        // Update UI
        document.getElementById('currentScore').textContent = '0';
        document.getElementById('gameOverScreen').classList.add('hidden');
        
        // Start the game
        this.state = GameState.PLAYING;
        document.getElementById('gameUI').classList.remove('hidden');
        
        this.playJumpSound();
        this.gameLoop();
    }
    
    // Game over
    gameOver() {
        this.state = GameState.GAME_OVER;
        this.saveHighScore(Math.floor(this.score));
        
        // Update UI - both game over screen and in-game display
        document.getElementById('finalScore').textContent = Math.floor(this.score);
        document.getElementById('highScore').textContent = this.highScore;
        document.getElementById('highScoreDisplay').textContent = this.highScore;
        document.getElementById('gameOverScreen').classList.remove('hidden');
        
        // Play game over sound
        this.playGameOverSound();
        
        // Create death particles
        this.createDeathParticles();
        
        // Cancel animation
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
    
    // Player jump
    jump() {
        if (!this.player.isJumping) {
            this.player.velocityY = CONFIG.player.jumpForce;
            this.player.isJumping = true;
            
            // Create jump particles
            this.createJumpParticles();
            
            // Play jump sound
            this.playJumpSound();
        }
    }
    
    // Create jump particles
    createJumpParticles() {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: this.player.x + CONFIG.player.width / 2,
                y: this.groundY,
                vx: (Math.random() - 0.5) * 8,
                vy: -Math.random() * 5 - 2,
                life: 1,
                decay: 0.03,
                size: Math.random() * 6 + 2,
                color: CONFIG.colors.particle
            });
        }
    }
    
    // Create death particles
    createDeathParticles() {
        for (let i = 0; i < 30; i++) {
            const angle = (Math.PI * 2 / 30) * i;
            this.particles.push({
                x: this.player.x + CONFIG.player.width / 2,
                y: this.player.y + CONFIG.player.height / 2,
                vx: Math.cos(angle) * (Math.random() * 10 + 5),
                vy: Math.sin(angle) * (Math.random() * 10 + 5),
                life: 1,
                decay: 0.02,
                size: Math.random() * 8 + 3,
                color: '#ff1493'
            });
        }
    }
    
    // Spawn obstacle
    spawnObstacle() {
        const width = CONFIG.obstacle.minWidth + Math.random() * (CONFIG.obstacle.maxWidth - CONFIG.obstacle.minWidth);
        const height = CONFIG.obstacle.minHeight + Math.random() * (CONFIG.obstacle.maxHeight - CONFIG.obstacle.minHeight);
        const color = CONFIG.obstacle.colors[Math.floor(Math.random() * CONFIG.obstacle.colors.length)];
        
        this.obstacles.push({
            x: this.canvas.width + 50,
            y: this.groundY - height,
            width: width,
            height: height,
            color: color,
            passed: false
        });
    }
    
    // Update game logic
    update(deltaTime) {
        if (this.state !== GameState.PLAYING) return;
        
        // Update speed based on score milestones (like Chrome Dino)
        this.updateSpeedByScore();
        
        // Time-based scoring (independent of game speed)
        // Score increases based on real time elapsed, not game speed
        const currentTime = performance.now();
        const timeElapsed = (currentTime - this.lastScoreTime) / 1000; // Convert to seconds
        this.score += timeElapsed * this.scoreRate;
        this.lastScoreTime = currentTime;
        
        // Update score display
        document.getElementById('currentScore').textContent = Math.floor(this.score);
        
        // Update player
        this.updatePlayer();
        
        // Update obstacles
        this.updateObstacles();
        
        // Update particles
        this.updateParticles();
        
        // Check collisions
        this.checkCollisions();
    }
    
    // Update speed based on score milestones
    updateSpeedByScore() {
        const score = Math.floor(this.score);
        
        // Find the appropriate speed level
        let newLevel = 0;
        for (let i = 0; i < CONFIG.game.speedLevels.length; i++) {
            if (score >= CONFIG.game.speedLevels[i].minScore && 
                score <= CONFIG.game.speedLevels[i].maxScore) {
                newLevel = i;
                break;
            }
            if (score > CONFIG.game.speedLevels[i].maxScore) {
                newLevel = i;
            }
        }
        
        // Get target speed for this level
        this.targetSpeed = CONFIG.game.speedLevels[newLevel].speed;
        
        // Smooth transition to target speed
        if (this.gameSpeed < this.targetSpeed) {
            this.gameSpeed += CONFIG.game.speedTransitionSpeed;
            if (this.gameSpeed > this.targetSpeed) {
                this.gameSpeed = this.targetSpeed;
            }
        } else if (this.gameSpeed > this.targetSpeed) {
            this.gameSpeed -= CONFIG.game.speedTransitionSpeed;
            if (this.gameSpeed < this.targetSpeed) {
                this.gameSpeed = this.targetSpeed;
            }
        }
        
        // Update current level for gap calculation
        this.currentSpeedLevel = newLevel;
    }
    
    // Get gap multiplier based on current speed
    getGapMultiplier() {
        const speed = Math.floor(this.gameSpeed);
        return CONFIG.game.speedGapMultiplier[speed] || 1.0;
    }
    
    // Update player
    updatePlayer() {
        // Apply gravity
        this.player.velocityY += CONFIG.player.gravity;
        this.player.y += this.player.velocityY;
        
        // Ground collision
        if (this.player.y >= this.groundY - CONFIG.player.height) {
            this.player.y = this.groundY - CONFIG.player.height;
            this.player.velocityY = 0;
            this.player.isJumping = false;
        }
        
        // Update animation frame
        this.player.frameTimer++;
        if (this.player.frameTimer >= CONFIG.player.runFrameSpeed) {
            this.player.frameTimer = 0;
            this.player.frameIndex = (this.player.frameIndex + 1) % CONFIG.player.runFrameCount;
        }
    }
    
    // Update obstacles
    updateObstacles() {
        // Move obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            this.obstacles[i].x -= this.gameSpeed;
            
            // Remove off-screen obstacles
            if (this.obstacles[i].x + this.obstacles[i].width < 0) {
                this.obstacles.splice(i, 1);
            }
        }
        
        // Spawn new obstacles based on distance (not timer)
        this.nextObstacleDistance -= this.gameSpeed;
        if (this.nextObstacleDistance <= 0) {
            this.spawnObstacle();
            
            // Get base random gap
            const minGap = CONFIG.obstacle.minGap;
            const maxGap = CONFIG.obstacle.maxGap;
            let gap = minGap + Math.random() * (maxGap - minGap);
            
            // Apply speed-based gap multiplier (higher speed = more gap for fairness)
            const gapMultiplier = this.getGapMultiplier();
            gap *= gapMultiplier;
            
            this.nextObstacleDistance = gap;
        }
    }
    
    // Update particles
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2;
            p.life -= p.decay;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    // Check collisions
    checkCollisions() {
        const playerBox = {
            x: this.player.x + 10,
            y: this.player.y + 5,
            width: CONFIG.player.width - 20,
            height: CONFIG.player.height - 10
        };
        
        for (const obstacle of this.obstacles) {
            const obstacleBox = {
                x: obstacle.x + 5,
                y: obstacle.y + 5,
                width: obstacle.width - 10,
                height: obstacle.height - 10
            };
            
            if (this.rectIntersect(playerBox, obstacleBox)) {
                this.gameOver();
                return;
            }
        }
    }
    
    // Rectangle intersection
    rectIntersect(r1, r2) {
        return !(r2.x > r1.x + r1.width ||
                 r2.x + r2.width < r1.x ||
                 r2.y > r1.y + r1.height ||
                 r2.y + r2.height < r1.y);
    }
    
    // Render game
    render() {
        // Clear canvas
        this.ctx.fillStyle = CONFIG.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background grid
        this.drawBackground();
        
        // Draw ground
        this.drawGround();
        
        // Draw obstacles
        this.drawObstacles();
        
        // Draw player
        if (this.state === GameState.PLAYING || this.state === GameState.GAME_OVER) {
            this.drawPlayer();
        }
        
        // Draw particles
        this.drawParticles();
    }
    
    // Draw background grid
    drawBackground() {
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        const gridSize = 40;
        const offset = (Date.now() / 50 * this.gameSpeed) % gridSize;
        
        // Vertical lines
        for (let x = -offset; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.groundY);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y < this.groundY; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    // Draw ground
    drawGround() {
        // Ground line glow
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = CONFIG.colors.groundGlow;
        this.ctx.strokeStyle = CONFIG.colors.ground;
        this.ctx.lineWidth = 3;
        
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.groundY);
        this.ctx.lineTo(this.canvas.width, this.groundY);
        this.ctx.stroke();
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
        
        // Ground fill
        this.ctx.fillStyle = 'rgba(0, 255, 255, 0.05)';
        this.ctx.fillRect(0, this.groundY, this.canvas.width, this.canvas.height - this.groundY);
    }
    
    // Draw player
    drawPlayer() {
        const x = this.player.x;
        const y = this.player.y;
        const w = CONFIG.player.width;
        const h = CONFIG.player.height;
        
        // Glow effect
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = CONFIG.colors.playerGlow;
        
        // Body
        this.ctx.fillStyle = CONFIG.colors.player;
        
        // Draw running animation (simple rectangle with leg animation)
        const legOffset = this.player.isJumping ? 0 : Math.sin(this.player.frameIndex * Math.PI / 3) * 10;
        
        // Main body
        this.ctx.fillRect(x + 10, y + 10, w - 20, h - 20);
        
        // Head
        this.ctx.fillRect(x + 12, y, w - 24, 15);
        
        // Legs
        if (!this.player.isJumping) {
            // Left leg
            this.ctx.fillRect(x + 12, y + h - 15 + legOffset, 10, 15 - legOffset);
            // Right leg
            this.ctx.fillRect(x + w - 22, y + h - 15 - legOffset, 10, 15 + legOffset);
        } else {
            // Tucked legs while jumping
            this.ctx.fillRect(x + 10, y + h - 12, 12, 12);
            this.ctx.fillRect(x + w - 22, y + h - 12, 12, 12);
        }
        
        // Eye
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(x + w - 18, y + 4, 6, 6);
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
    }
    
    // Draw obstacles
    drawObstacles() {
        for (const obstacle of this.obstacles) {
            // Glow effect
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = obstacle.color;
            
            // Main obstacle
            this.ctx.fillStyle = obstacle.color;
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            
            // Inner highlight
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.fillRect(obstacle.x + 5, obstacle.y + 5, obstacle.width - 10, obstacle.height - 10);
            
            // Reset shadow
            this.ctx.shadowBlur = 0;
        }
    }
    
    // Draw particles
    drawParticles() {
        for (const p of this.particles) {
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;
        this.ctx.shadowBlur = 0;
    }
    
    // Game loop
    gameLoop() {
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }
    
    // Play jump sound (generated)
    playJumpSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            // Audio not supported
        }
    }
    
    // Play game over sound (generated)
    playGameOverSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.3);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {
            // Audio not supported
        }
    }
}

// ==========================================
// INITIALIZE GAME
// ==========================================
window.addEventListener('load', () => {
    new NeonRunner();
});
