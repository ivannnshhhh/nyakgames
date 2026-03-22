const wordElement = document.getElementById("word");
const wrongLettersElement = document.getElementById("wrong-letters");
const playAgainButton = document.getElementById("play-button");
const popup = document.getElementById("popup-container");
const notification = document.getElementById("notification-container");
const finalMessage = document.getElementById("final-message");
const finalMessageRevealWord = document.getElementById("final-message-reveal-word");
const figureParts = document.querySelectorAll(".figure-part");
const keyboardElement = document.getElementById("keyboard");
const wrongCountElement = document.getElementById("wrong-count");
const scoreElement = document.getElementById("score");
const hintBtn = document.getElementById("hint-btn");
const clueText = document.getElementById("clue-text");

const words = [
  "bridge",
  "castle",
  "compass",
  "culture",
  "desert",
  "eclipse",
  "energy",
  "festival",
  "freedom",
  "galaxy",
  "gravity",
  "history",
  "island",
  "journey",
  "justice",
  "language",
  "library",
  "movement",
  "museum",
  "nature",
  "ocean",
  "planet",
  "pyramid",
  "science",
  "shadow",
  "student",
  "teacher",
  "victory",
  "volcano",
  "weather"
];

// Track guessed words
let guessedWords = [];

// Clues for each word
const clues = {
  "bridge": "A structure that connects two places",
  "castle": "A large building where kings or nobles lived",
  "compass": "A tool used for navigation",
  "culture": "Traditions and beliefs of a group",
  "desert": "A very dry place with little rain",
  "eclipse": "When one object blocks another in space",
  "energy": "The ability to do work",
  "festival": "A celebration or special event",
  "freedom": "The power to act without restriction",
  "galaxy": "A system of stars, including solar Milky Way",
  "gravity": "Force that pulls objects toward Earth",
  "history": "The study of past events",
  "island": "Land surrounded by water",
  "journey": "An act of traveling",
  "justice": "Fair treatment and equality",
  "language": "A system used for communication",
  "library": "A place where books are kept",
  "movement": "The act of moving",
  "museum": "A place that displays historical objects",
  "nature": "Everything in the natural world",
  "ocean": "A vast body of salt water",
  "planet": "A large object that orbits a star",
  "pyramid": "An ancient triangular structure found in Egypt",
  "science": "Study of the natural world",
  "shadow": "A dark shape made when lights is blocked",
  "student": "A person who is learning",
  "teacher": "A person who educates students",
  "victory": "Winning a competition",
  "volcano": "A mountain that erupts with lava",
  "weather": "The condition of the atmosphere"
};

// Function to display the clue
function displayClue() {
  clueText.innerText = clues[selectedWord] || "Loading...";
}

let selectedWord = words[Math.floor(Math.random() * words.length)];
let playable = true;
let score = 0;
let hintsUsed = 0;
const maxHints = 1;
const maxWrongGuesses = 6; // Maximum wrong guesses before losing
const correctLetters = [];
const wrongLetters = [];
// Global wrong guesses tracker (persists across words)
let globalWrongGuesses = 0;

// Initialize keyboard with QWERTY layout in rows
function initKeyboard() {
  keyboardElement.innerHTML = '';
  
  // QWERTY layout in rows (like a real keyboard)
  const rows = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm']
  ];
  
  rows.forEach((row, rowIndex) => {
    const rowElement = document.createElement('div');
    rowElement.classList.add('keyboard-row');
    if (rowIndex === 1) rowElement.classList.add('middle-row');
    if (rowIndex === 2) rowElement.classList.add('bottom-row');
    
    row.forEach(letter => {
      const key = document.createElement('button');
      key.classList.add('key');
      key.innerText = letter.toUpperCase();
      key.dataset.letter = letter;
      key.addEventListener('click', () => handleKeyPress(letter));
      rowElement.appendChild(key);
    });
    
    keyboardElement.appendChild(rowElement);
  });
}

// Handle key press from both physical and virtual keyboard
function handleKeyPress(letter) {
  if (!playable) return;
  
  letter = letter.toLowerCase();
  if (letter >= 'a' && letter <= 'z') {
    if (selectedWord.includes(letter)) {
      if (!correctLetters.includes(letter)) {
        correctLetters.push(letter);
        updateKeyState(letter, 'correct');
        displayWord();
      } else {
        showNotification();
      }
    } else {
      if (!wrongLetters.includes(letter)) {
        wrongLetters.push(letter);
        globalWrongGuesses++; // Increment global wrong guesses
        updateKeyState(letter, 'wrong');
        updateWrongLettersElement();
      } else {
        showNotification();
      }
    }
  }
}

// Update virtual key state
function updateKeyState(letter, state) {
  const key = document.querySelector(`.key[data-letter="${letter}"]`);
  if (key) {
    key.classList.add('used', state);
  }
}

function displayWord() {
  wordElement.innerHTML = `
    ${selectedWord
      .split("")
      .map(
        (letter) => `
      <span class="letter ${correctLetters.includes(letter) ? 'revealed' : 'guess'}">
      ${correctLetters.includes(letter) ? letter : ""}
      </span>
      `
      )
      .join("")}
  `;
  
  const innerWord = wordElement.innerText.replace(/\n/g, "");
  if (innerWord === selectedWord) {
    // Calculate score based on remaining wrong guesses for this word
    const bonusPoints = (maxWrongGuesses - wrongLetters.length) * 100;
    score += 500 + bonusPoints;
    scoreElement.innerText = score;
    
    // Add word to guessed list
    guessedWords.push(selectedWord);
    
    // Check if all words have been guessed
    if (guessedWords.length === words.length) {
      // All words completed!
      finalMessage.innerText = "🏆 ALL WORDS COMPLETED! 🏆";
      finalMessage.className = 'win';
      finalMessageRevealWord.innerHTML = `Total Score: <span class="word-reveal">${score}</span> points!<br><br>All ${words.length} words guessed!<br>Click Play Again to restart!`;
      document.getElementById('play-button').innerText = "Restart All";
      popup.style.display = "flex";
      playable = false;
    } else {
      // Move to next word WITHOUT resetting hangman figure
      // Just show congratulations and move to next word
      finalMessage.innerText = "🎉 Word Complete! 🎉";
      finalMessage.className = 'win';
      finalMessageRevealWord.innerHTML = `+${500 + bonusPoints} points!<br>Wrong guesses so far: ${globalWrongGuesses}/${maxWrongGuesses}<br>Words left: ${words.length - guessedWords.length}`;
      document.getElementById('play-button').innerText = "Next Word";
      popup.style.display = "flex";
      playable = false;
    }
  }
}

function updateWrongLettersElement() {
  wrongLettersElement.innerHTML = `
    ${wrongLetters.map((letter) => `<span>${letter}</span>`)}
  `;
  
  // Show global wrong guesses count
  wrongCountElement.innerText = globalWrongGuesses;
  
  // Show hangman parts based on GLOBAL wrong guesses (not per word)
  figureParts.forEach((part, index) => {
    if (index < globalWrongGuesses) {
      part.style.display = "block";
    } else {
      part.style.display = "none";
    }
  });
  
  // Check if max wrong guesses reached (game over)
  if (globalWrongGuesses >= maxWrongGuesses) {
    finalMessage.innerText = "😢 Unfortunately you lost!";
    finalMessage.className = 'lose';
    finalMessageRevealWord.innerHTML = `Game Over!<br>Total Score: <span class="word-reveal">${score}</span><br>Words guessed: ${guessedWords.length}`;
    document.getElementById('play-button').innerText = "Restart";
    popup.style.display = "flex";
    playable = false;
  }
}

function showNotification() {
  notification.classList.add("show");
  setTimeout(() => {
    notification.classList.remove("show");
  }, 2000);
}

// Hint system - reveals a random letter on the word (no popup)
function showHint() {
  if (hintsUsed >= maxHints || !playable) return;
  
  // Find all unguessed letters
  const unguessedLetters = selectedWord.split('').filter(l => !correctLetters.includes(l));
  if (unguessedLetters.length === 0) return;
  
  // Pick a random letter from unguessed letters
  const randomIndex = Math.floor(Math.random() * unguessedLetters.length);
  const hintLetterChoice = unguessedLetters[randomIndex];
  
  // Add the letter to correct letters and reveal it on the word
  correctLetters.push(hintLetterChoice);
  updateKeyState(hintLetterChoice, 'correct');
  displayWord();
  
  // Disable hint button after use
  hintsUsed++;
  hintBtn.disabled = true;
}

function resetGame() {
  playable = true;
  correctLetters.splice(0);
  wrongLetters.splice(0);
  hintsUsed = 0;
  hintBtn.disabled = false;
  
  // Get available words (not yet guessed)
  const availableWords = words.filter(word => !guessedWords.includes(word));
  
  // Check if we need full reset (all words done or game over)
  const isFullReset = (availableWords.length === 0 && guessedWords.length > 0) || 
                      (globalWrongGuesses >= maxWrongGuesses);
  
  if (isFullReset) {
    // Full reset - clear everything
    guessedWords = [];
    score = 0;
    globalWrongGuesses = 0;
    scoreElement.innerText = score;
    
    // Reset hangman figure completely
    figureParts.forEach(part => {
      part.style.display = 'none';
    });
  } else {
    // Partial reset - keep hangman figure, just move to next word
    // Don't reset figureParts - they persist!
  }
  
  // Select random word from available words
  const remainingWords = words.filter(word => !guessedWords.includes(word));
  if (remainingWords.length > 0) {
    selectedWord = remainingWords[Math.floor(Math.random() * remainingWords.length)];
  } else {
    selectedWord = words[Math.floor(Math.random() * words.length)];
  }
  
  // Reset keyboard - remove all used states
  const keys = document.querySelectorAll('.key');
  keys.forEach(key => {
    key.classList.remove('used', 'correct', 'wrong');
  });
  
  // Reset displays (but NOT the figure parts unless it's a full reset)
  wrongCountElement.innerText = globalWrongGuesses;
  displayWord();
  updateWrongLettersElement();
  popup.style.display = "none";
  finalMessage.className = '';
  document.getElementById('play-button').innerText = "Next Word";
  
  // Display new clue
  displayClue();
}

// Event Listeners
window.addEventListener("keypress", (e) => {
  handleKeyPress(e.key);
});

playAgainButton.addEventListener("click", resetGame);

hintBtn.addEventListener("click", showHint);

// Initialize game
initKeyboard();
displayWord();
displayClue();
