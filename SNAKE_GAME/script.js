const playBoard = document.querySelector(".play-board");
const scoreElement = document.querySelector(".score");
const highScoreElement = document.querySelector(".high-score");
const controls = document.querySelectorAll(".control-btn");
const pauseBtn = document.querySelector(".pause-btn");

// Overlay elements
const startScreen = document.querySelector(".start-screen");
const gameOverScreen = document.querySelector(".game-over-screen");
const pauseScreen = document.querySelector(".pause-screen");
const startBtn = document.querySelector(".start-btn");
const restartBtn = document.querySelector(".restart-btn");
const resumeBtn = document.querySelector(".resume-btn");
const restartFromPauseBtn = document.querySelector(".restart-from-pause-btn");
const finalScoreValue = document.querySelector(".final-score-value");
const bestScoreValue = document.querySelector(".best-score-value");

let gameOver = false;
let gameRunning = false;
let gamePaused = false;
let foodX, foodY;
let snakeX = 5, snakeY = 5;
let velocityX = 0, velocityY = 0;
let snakeBody = [];
let setIntervalId = null;
let score = 0;
let gameSpeed = 120;

// Getting high score from the local storage
let highScore = localStorage.getItem("high-score") || 0;
highScoreElement.innerText = `High Score: ${highScore}`;

const updateFoodPosition = () => {
    // Passing a random 1 - 30 value as food position
    foodX = Math.floor(Math.random() * 30) + 1;
    foodY = Math.floor(Math.random() * 30) + 1;
    
    // Make sure food doesn't spawn on snake body
    for (let segment of snakeBody) {
        if (segment[0] === foodY && segment[1] === foodX) {
            updateFoodPosition();
            break;
        }
    }
}

const handleGameOver = () => {
    // Clearing the timer
    if (setIntervalId) {
        clearInterval(setIntervalId);
        setIntervalId = null;
    }
    gameRunning = false;
    gameOver = true;
    
    // Update game over screen
    finalScoreValue.textContent = score;
    bestScoreValue.textContent = highScore;
    
    // Show game over screen
    gameOverScreen.classList.remove("hidden");
}

const resetGame = () => {
    // Reset all game variables
    gameOver = false;
    gameRunning = false;
    gamePaused = false;
    snakeX = 5;
    snakeY = 5;
    velocityX = 0;
    velocityY = 0;
    snakeBody = [];
    score = 0;
    gameSpeed = 120;
    
    // Clear any existing interval
    if (setIntervalId) {
        clearInterval(setIntervalId);
        setIntervalId = null;
    }
    
    // Reset score display
    scoreElement.innerText = `Score: 0`;
    highScoreElement.innerText = `High Score: ${highScore}`;
    
    // Clear the board
    playBoard.innerHTML = '';
    
    // Reset food
    updateFoodPosition();
}

const startGame = () => {
    // Hide all overlays
    startScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");
    pauseScreen.classList.add("hidden");
    
    // Reset game
    resetGame();
    
    // Start the game
    gameRunning = true;
    setIntervalId = setInterval(initGame, gameSpeed);
}

const changeDirection = e => {
    // Prevent default arrow key scrolling
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.key)) {
        e.preventDefault();
    }
    
    // Don't change direction if game is not running
    if (!gameRunning || gamePaused || gameOver) return;
    
    // Changing velocity value based on key press
    if (e.key === "ArrowUp" && velocityY != 1) {
        velocityX = 0;
        velocityY = -1;
    } else if (e.key === "ArrowDown" && velocityY != -1) {
        velocityX = 0;
        velocityY = 1;
    } else if (e.key === "ArrowLeft" && velocityX != 1) {
        velocityX = -1;
        velocityY = 0;
    } else if (e.key === "ArrowRight" && velocityX != -1) {
        velocityX = 1;
        velocityY = 0;
    }
}

const togglePause = () => {
    if (!gameRunning || gameOver) return;
    
    gamePaused = !gamePaused;
    
    if (gamePaused) {
        if (setIntervalId) {
            clearInterval(setIntervalId);
            setIntervalId = null;
        }
        pauseScreen.classList.remove("hidden");
    } else {
        pauseScreen.classList.add("hidden");
        setIntervalId = setInterval(initGame, gameSpeed);
    }
}

const handleScoreUpdate = () => {
    score++;
    highScore = score >= highScore ? score : highScore;
    localStorage.setItem("high-score", highScore);
    scoreElement.innerText = `Score: ${score}`;
    highScoreElement.innerText = `High Score: ${highScore}`;
    
    // Add score pop animation
    scoreElement.classList.add("score-pop");
    setTimeout(() => scoreElement.classList.remove("score-pop"), 300);
    
    // Increase difficulty every 5 points
    if (score % 5 === 0 && gameSpeed > 50) {
        if (setIntervalId) {
            clearInterval(setIntervalId);
        }
        gameSpeed -= 5;
        setIntervalId = setInterval(initGame, gameSpeed);
    }
}

// Calling changeDirection on each key click and passing key dataset value as an object
// Add both click and touchstart events for better mobile responsiveness
controls.forEach(button => {
  button.addEventListener("click", (e) => {
    e.preventDefault();
    changeDirection({ key: button.dataset.key });
  });
  
  // Add touch support for mobile
  button.addEventListener("touchstart", (e) => {
    e.preventDefault();
    changeDirection({ key: button.dataset.key });
    button.style.background = 'rgba(0, 255, 200, 0.3)';
    button.style.color = '#fff';
    setTimeout(() => {
      button.style.background = '';
      button.style.color = '';
    }, 100);
  });
});

// Event listeners for buttons
startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);
resumeBtn.addEventListener("click", togglePause);
restartFromPauseBtn.addEventListener("click", startGame);
pauseBtn.addEventListener("click", togglePause);

// Keyboard controls
document.addEventListener("keydown", (e) => {
    // Handle pause with P key
    if (e.key === "p" || e.key === "P") {
        togglePause();
    }
    // Handle restart with R key when game is over
    if ((e.key === "r" || e.key === "R") && (gameOver || gamePaused)) {
        startGame();
    }
    // Handle start with Enter key
    if (e.key === "Enter" && !gameRunning && !gameOver) {
        startGame();
    }
    // Regular direction keys
    changeDirection(e);
});

const initGame = () => {
    // Don't run if game is not running or paused
    if (!gameRunning || gamePaused) return;
    
    let html = `<div class="food" style="grid-area: ${foodY} / ${foodX}"></div>`;

    // Checking if the snake hit the food
    if(snakeX === foodX && snakeY === foodY) {
        updateFoodPosition();
        snakeBody.push([foodY, foodX]); // Pushing food position to snake body array
        handleScoreUpdate();
    }
    
    // Updating the snake's head position based on the current velocity
    snakeX += velocityX;
    snakeY += velocityY;
    
    // Shifting forward the values of the elements in the snake body by one
    for (let i = snakeBody.length - 1; i > 0; i--) {
        snakeBody[i] = snakeBody[i - 1];
    }
    snakeBody[0] = [snakeX, snakeY]; // Setting first element of snake body to current snake position

    // Checking if the snake's head is out of wall, if so setting gameOver to true
    if(snakeX <= 0 || snakeX > 30 || snakeY <= 0 || snakeY > 30) {
        // Render one last time before game over
        for (let i = 0; i < snakeBody.length; i++) {
            html += `<div class="head" style="grid-area: ${snakeBody[i][1]} / ${snakeBody[i][0]}"></div>`;
        }
        playBoard.innerHTML = html;
        handleGameOver();
        return;
    }

    for (let i = 0; i < snakeBody.length; i++) {
        // Adding a div for each part of the snake's body
        html += `<div class="head" style="grid-area: ${snakeBody[i][1]} / ${snakeBody[i][0]}"></div>`;
        // Checking if the snake head hit the body, if so set gameOver to true
        if (i !== 0 && snakeBody[0][1] === snakeBody[i][1] && snakeBody[0][0] === snakeBody[i][0]) {
            // Render one last time before game over
            playBoard.innerHTML = html;
            handleGameOver();
            return;
        }
    }
    
    playBoard.innerHTML = html;
}

// Initialize food position on load
updateFoodPosition();
