const colors = ["green", "red", "yellow", "blue"];
let gamePattern = [];
let userPattern = [];
let level = 0;
let clickCount = 0;
let gameStarted = false;
let bestScore = parseInt(localStorage.getItem("simonBestScore")) || 0;
let isProcessing = false;

// Sound frequencies for each color
const soundFrequencies = {
  green: 329.63,  // E4
  red: 261.63,    // C4
  yellow: 392.00, // G4
  blue: 523.25    // C5
};

// Initialize the game
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("best-display").textContent = bestScore;
  document.getElementById("start-btn").addEventListener("click", startGame);
  
  // Add keyboard support
  document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && !gameStarted) {
      e.preventDefault();
      startGame();
    }
  });
  
  // Prevent double-tap zoom on mobile
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  }, false);
  
  // Prevent context menu on long press
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });
});

function playSound(color) {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = soundFrequencies[color];
    oscillator.type = "sine";
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (e) {
    // Fallback: audio not supported
    console.log("Audio not supported");
  }
}

function startGame() {
  if (!gameStarted && !isProcessing) {
    gameStarted = true;
    level = 0;
    gamePattern = [];
    userPattern = [];
    clickCount = 0;
    
    document.getElementById("level-display").textContent = level;
    document.getElementById("click-count").textContent = clickCount;
    document.getElementById("sequence-display").textContent = "-";
    
    // Update button state
    const startBtn = document.getElementById("start-btn");
    startBtn.disabled = true;
    startBtn.querySelector(".btn-text").textContent = "Playing...";
    
    showMyTexts();
    nextSequence();
  }
}

function nextSequence() {
  userPattern = [];
  clickCount = 0;
  document.getElementById("click-count").textContent = clickCount;
  level++;
  document.getElementById("level-display").textContent = level;
  
  // Clear the sequence display at the start of each level
  document.getElementById("sequence-display").textContent = "-";
  
  // Generate a random color and push it to the gamePattern
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  gamePattern.push(randomColor);
  
  animateSequence();
}

function animateSequence() {
  isProcessing = true;
  let i = 0;
  const interval = setInterval(() => {
    flashButton(gamePattern[i], true);
    i++;
    if (i === gamePattern.length) {
      clearInterval(interval);
      setTimeout(() => {
        isProcessing = false;
        enableUserInput();
      }, 300);
    }
  }, 600);
}

function flashButton(color, isSequence = false) {
  const button = document.getElementById(color);
  button.classList.add("active");
  
  // Play sound
  playSound(color);
  
  // Add particle effect
  if (isSequence) {
    createParticles(color);
  }
  
  setTimeout(() => {
    button.classList.remove("active");
  }, 300);
}

function createParticles(color) {
  const particlesContainer = document.getElementById("particles");
  const button = document.getElementById(color);
  const rect = button.getBoundingClientRect();
  
  for (let i = 0; i < 5; i++) {
    const particle = document.createElement("div");
    particle.className = "particle";
    particle.style.backgroundColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--" + color);
    particle.style.left = rect.left + rect.width / 2 + "px";
    particle.style.top = rect.top + rect.height / 2 + "px";
    particle.style.animationDelay = i * 0.1 + "s";
    particlesContainer.appendChild(particle);
    
    setTimeout(() => {
      particle.remove();
    }, 3000);
  }
}

function enableUserInput() {
  colors.forEach((color) => {
    const button = document.getElementById(color);
    button.addEventListener("click", handleUserClick);
    button.style.cursor = "pointer";
  });
}

function disableUserInput() {
  colors.forEach((color) => {
    const button = document.getElementById(color);
    button.removeEventListener("click", handleUserClick);
    button.style.cursor = "default";
  });
}

function handleUserClick(event) {
  if (isProcessing || !gameStarted) return;
  
  const clickedColor = event.target.closest(".color-btn").id;
  userPattern.push(clickedColor);
  flashButton(clickedColor);
  clickCount++;
  document.getElementById("click-count").textContent = clickCount;
  
  // Update the current sequence display
  updateSequenceDisplay();
  
  checkAnswer(userPattern.length - 1);
}

function updateSequenceDisplay() {
  const sequenceDisplay = document.getElementById("sequence-display");
  sequenceDisplay.innerHTML = "";
  
  userPattern.forEach((color) => {
    const span = document.createElement("span");
    span.style.color = "var(--" + color + ")";
    span.textContent = color.charAt(0).toUpperCase() + color.slice(1) + " ";
    sequenceDisplay.appendChild(span);
  });
}

function checkAnswer(currentLevel) {
  if (userPattern[currentLevel] === gamePattern[currentLevel]) {
    if (userPattern.length === gamePattern.length) {
      disableUserInput();
      
      // Update best score
      if (level > bestScore) {
        bestScore = level;
        localStorage.setItem("simonBestScore", bestScore);
        document.getElementById("best-display").textContent = bestScore;
      }
      
      // Add celebration animation
      document.querySelector(".game-wrapper").classList.add("celebrating");
      setTimeout(() => {
        document.querySelector(".game-wrapper").classList.remove("celebrating");
      }, 500);
      
      setTimeout(() => {
        showCongratsMessage();
        setTimeout(() => {
          hideCongratsMessage();
          setTimeout(() => {
            nextSequence();
          }, 500);
        }, 1500);
      }, 500);
    }
  } else {
    gameOver();
  }
}

function gameOver() {
  gameStarted = false;
  isProcessing = true;
  
  // Update status
  const statusDisplay = document.getElementById("level-display");
  statusDisplay.textContent = "0";
  
  // Flash the wrong button
  const wrongColor = userPattern[userPattern.length - 1];
  const button = document.getElementById(wrongColor);
  button.classList.add("active");
  
  // Play error sound
  playErrorSound();
  
  setTimeout(() => {
    button.classList.remove("active");
    showLoseMessage(wrongColor);
  }, 500);
  
  setTimeout(() => {
    hideLoseMessage();
  }, 2500);
  
  setTimeout(() => {
    hideMyTexts();
    resetGame();
  }, 3000);
}

function playErrorSound() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 150;
    oscillator.type = "sawtooth";
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (e) {
    console.log("Audio not supported");
  }
}

function showCongratsMessage() {
  const message = `Level ${level} Complete!`;
  const congratsMessageElement = document.getElementById("level-message");
  congratsMessageElement.textContent = message;
  congratsMessageElement.className = "show success";
}

function hideCongratsMessage() {
  const congratsMessageElement = document.getElementById("level-message");
  congratsMessageElement.className = "";
}

function showLoseMessage(wrongColor) {
  const message = `Game Over! Missed: ${wrongColor.charAt(0).toUpperCase() + wrongColor.slice(1)}`;
  const loseMessageElement = document.getElementById("level-message");
  loseMessageElement.textContent = message;
  loseMessageElement.className = "show error";
}

function hideLoseMessage() {
  const loseMessageElement = document.getElementById("level-message");
  loseMessageElement.className = "";
}

function showMyTexts() {
  const texts = document.getElementsByClassName("my-text");
  
  for (let i = 0; i < texts.length; i++) {
    texts[i].classList.add("show");
  }
}

function hideMyTexts() {
  const texts = document.getElementsByClassName("my-text");
  
  for (let i = 0; i < texts.length; i++) {
    texts[i].classList.remove("show");
  }
}

function resetGame() {
  level = 0;
  gamePattern = [];
  userPattern = [];
  clickCount = 0;
  isProcessing = false;
  
  document.getElementById("sequence-display").textContent = "-";
  document.getElementById("click-count").textContent = "0";
  document.getElementById("level-display").textContent = "0";
  
  // Reset start button
  const startBtn = document.getElementById("start-btn");
  startBtn.disabled = false;
  startBtn.querySelector(".btn-text").textContent = "Start Game";
}
