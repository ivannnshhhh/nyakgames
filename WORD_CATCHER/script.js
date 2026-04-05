const levelWords = {
    1: ['apple', 'brave', 'cloud', 'dance', 'eagle', 'flame', 'grape', 'house', 'image', 'jelly'],
    2: ['kite', 'lemon', 'music', 'night', 'ocean', 'piano', 'queen', 'river', 'snow', 'tiger'],
    3: ['unity', 'voice', 'water', 'xenon', 'yacht', 'zebra', 'bread', 'chair', 'dream', 'earth'],
    4: ['fire', 'green', 'heart', 'light', 'money', 'peace', 'quiet', 'rain', 'stone', 'train'],
    5: ['wave', 'youth', 'amber', 'bloom', 'coral', 'dawn', 'echo', 'frost', 'glass', 'honey']
};

const levels = {
    1: { wordsPerSpawn: 2, speed: 1.0, spawnInterval: 3000 },
    2: { wordsPerSpawn: 2, speed: 1.3, spawnInterval: 2800 },
    3: { wordsPerSpawn: 3, speed: 1.6, spawnInterval: 2500 },
    4: { wordsPerSpawn: 3, speed: 2.0, spawnInterval: 2200 },
    5: { wordsPerSpawn: 4, speed: 2.5, spawnInterval: 2000 }
};

let currentLevel = 1;
let score = 0;
let lives = 3;
let gameActive = true;
let isPaused = false;
let fallingWords = [];
let typedText = '';
let usedWords = [];
let levelWordsCompleted = 0;
let animationId;
let spawnInterval;

const scoreEl = document.getElementById('score-value');
const livesEl = document.getElementById('lives-value');
const levelEl = document.getElementById('level-value');
const wordInput = document.getElementById('word-input');
const gameOverEl = document.getElementById('game-over');
const finalScoreEl = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');
const gameArea = document.querySelector('.game-area');
const levelCompleteEl = document.getElementById('level-complete');
const nextLevelBtn = document.getElementById('next-level-btn');
const pauseBtn = document.getElementById('pause-btn');
const pausedEl = document.getElementById('paused');
const resumeBtn = document.getElementById('resume-btn');
const startScreenEl = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');

function playSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
}

function getLevelSpeed() {
    return levels[currentLevel].speed + (score / 50) * 0.3;
}

function getRandomWord() {
    const wordList = levelWords[currentLevel];
    const available = wordList.filter(w => !usedWords.includes(w));
    if (available.length === 0 && fallingWords.length === 0) {
        showLevelComplete();
        return null;
    }
    if (available.length === 0) {
        return null;
    }
    const word = available[Math.floor(Math.random() * available.length)];
    usedWords.push(word);
    return word;
}

function createWordElement(text) {
    const container = document.createElement('div');
    container.className = 'falling-word';
    container.style.position = 'absolute';
    container.style.top = '-50px';
    container.style.left = Math.random() * (gameArea.offsetWidth - 120) + 'px';
    container.style.fontSize = '24px';
    container.style.fontWeight = '700';
    container.style.whiteSpace = 'nowrap';
    container.style.transform = 'rotate(' + (Math.random() * 20 - 10) + 'deg)';
    
    for (let i = 0; i < text.length; i++) {
        const letterSpan = document.createElement('span');
        letterSpan.textContent = text[i];
        letterSpan.style.color = '#fff';
        container.appendChild(letterSpan);
    }
    
    gameArea.appendChild(container);
    return container;
}

function updateWordDisplay(wordObj, typed) {
    const letters = wordObj.el.querySelectorAll('span');
    const wordText = wordObj.text;
    const matchIndex = wordText.indexOf(typed);
    
    if (matchIndex === 0 && typed.length <= wordText.length) {
        for (let i = 0; i < letters.length; i++) {
            if (i < typed.length) {
                letters[i].style.color = '#4facfe';
            } else {
                letters[i].style.color = '#fff';
            }
        }
    }
}

function spawnWord() {
    const text = getRandomWord();
    if (text === null) return;
    const el = createWordElement(text);
    fallingWords.push({ text: text, el: el, y: -40 });
}

function update() {
    if (!gameActive) return;
    
    const maxPosition = gameArea.offsetHeight - 20;
    const speed = getLevelSpeed();
    
    fallingWords = fallingWords.filter(word => {
        word.y += speed;
        word.el.style.top = word.y + 'px';
        
        if (word.y > maxPosition) {
            word.el.remove();
            lives--;
            livesEl.textContent = lives;
            
            if (lives <= 0) {
                endGame();
                return false;
            }
            return false;
        }
        return true;
    });
    
    animationId = requestAnimationFrame(update);
}

function showLevelComplete() {
    gameActive = false;
    cancelAnimationFrame(animationId);
    clearInterval(spawnInterval);
    
    fallingWords.forEach(w => w.el.remove());
    fallingWords = [];
    
    const levelCompleteEl = document.getElementById('level-complete');
    const titleEl = levelCompleteEl.querySelector('h2');
    const scoreEl2 = levelCompleteEl.querySelector('p span');
    const nextBtn = document.getElementById('next-level-btn');
    
    if (currentLevel >= 5) {
        titleEl.textContent = 'You Win!';
        nextBtn.textContent = 'Play Again';
    } else {
        titleEl.textContent = 'Level ' + currentLevel + ' Complete!';
        nextBtn.textContent = 'Next Level';
    }
    scoreEl2.textContent = score;
    
    document.getElementById('level-complete').classList.remove('hidden');
}

function togglePause() {
    if (isPaused) {
        isPaused = false;
        gameActive = true;
        pausedEl.classList.add('hidden');
        pauseBtn.textContent = '❚❚';
        update();
        startSpawning();
        setTimeout(() => wordInput.focus(), 100);
    } else {
        isPaused = true;
        gameActive = false;
        pausedEl.classList.remove('hidden');
        pauseBtn.textContent = '▶';
        cancelAnimationFrame(animationId);
        clearInterval(spawnInterval);
    }
}

function nextLevel() {
    if (currentLevel >= 5) {
        restartGame();
        return;
    }
    
    currentLevel++;
    levelEl.textContent = currentLevel;
    usedWords = [];
    typedText = '';
    
    fallingWords.forEach(w => w.el.remove());
    fallingWords = [];
    
    document.getElementById('level-complete').classList.add('hidden');
    wordInput.value = '';
    gameActive = true;
    
    const config = levels[currentLevel];
    for (let i = 0; i < config.wordsPerSpawn; i++) {
        setTimeout(spawnWord, i * 300);
    }
    update();
    startSpawning();
}

function startSpawning() {
    const config = levels[currentLevel];
    clearInterval(spawnInterval);
    spawnInterval = setInterval(() => {
        if (gameActive) {
            const maxWords = currentLevel + 2;
            if (fallingWords.length < maxWords) {
                for (let i = 0; i < config.wordsPerSpawn; i++) {
                    setTimeout(() => { if (gameActive) spawnWord(); }, i * 200);
                }
            }
        }
    }, config.spawnInterval);
}

function updateAllWordDisplays() {
    fallingWords.forEach(word => updateWordDisplay(word, typedText));
}

function endGame() {
    gameActive = false;
    cancelAnimationFrame(animationId);
    clearInterval(spawnInterval);
    fallingWords.forEach(w => w.el.remove());
    fallingWords = [];
    finalScoreEl.textContent = score;
    gameOverEl.classList.remove('hidden');
}

function restartGame() {
    currentLevel = 1;
    score = 0;
    lives = 3;
    gameActive = true;
    isPaused = false;
    fallingWords = [];
    usedWords = [];
    typedText = '';
    
    scoreEl.textContent = score;
    livesEl.textContent = lives;
    levelEl.textContent = currentLevel;
    wordInput.value = '';
    gameOverEl.classList.add('hidden');
    document.getElementById('level-complete').classList.add('hidden');
    pausedEl.classList.add('hidden');
    pauseBtn.textContent = '❚❚';
    startScreenEl.classList.add('hidden');
    
    const config = levels[1];
    for (let i = 0; i < config.wordsPerSpawn; i++) {
        setTimeout(spawnWord, i * 300);
    }
    update();
    startSpawning();
}

wordInput.addEventListener('input', (e) => {
    typedText = e.target.value.toLowerCase();
    updateAllWordDisplays();
    
    const completeIndex = fallingWords.findIndex(w => w.text === typedText);
    if (completeIndex !== -1) {
        const word = fallingWords[completeIndex];
        word.el.remove();
        fallingWords.splice(completeIndex, 1);
        score++;
        scoreEl.textContent = score;
        playSound();
        wordInput.value = '';
        typedText = '';
        
        checkLevelComplete();
    }
});

function checkLevelComplete() {
    const wordList = levelWords[currentLevel];
    const available = wordList.filter(w => !usedWords.includes(w));
    if (available.length === 0 && fallingWords.length === 0) {
        showLevelComplete();
    }
}

restartBtn.addEventListener('click', restartGame);
nextLevelBtn.addEventListener('click', nextLevel);
pauseBtn.addEventListener('click', togglePause);
resumeBtn.addEventListener('click', togglePause);
startBtn.addEventListener('click', startGame);

function startGame() {
    startScreenEl.classList.add('hidden');
    restartGame();
    setTimeout(() => wordInput.focus(), 100);
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        
        if (!startScreenEl.classList.contains('hidden')) {
            startBtn.click();
        } else if (!levelCompleteEl.classList.contains('hidden')) {
            nextLevelBtn.click();
        } else if (!gameOverEl.classList.contains('hidden')) {
            restartBtn.click();
        } else if (!pausedEl.classList.contains('hidden')) {
            resumeBtn.click();
        } else if (gameActive) {
            pauseBtn.click();
        }
    }
});

document.querySelector('.game-area').addEventListener('click', () => {
    wordInput.focus();
});