import levels from "./levels.json" with { type: "json" };


const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const GAME_WIDTH = 1920;
const GAME_HEIGHT = 1080;

let currentPosition = { x: 100, y: 100 };
let currentDirection = { x: 0, y: 0 };
let gameInterval;
let currentLevelIndex = 0; // Start with level 0

let gameState = "start";
let walls = [];
const playerSize = { width: 22, height: 22 };
let keys = {};

// New trail array
let trail = [];

const startImage = new Image();
startImage.src = "start.png"; // Path to your start point image

const endImage = new Image();
endImage.src = "end.png"; // Path to your end point image

// Preload the background image
const bgImage = new Image();
bgImage.src = levels[currentLevelIndex].backgroundImage;

const audioContext = new (window.AudioContext || window.webkitAudioContext)(); // Create audio context
let keyPressSoundBuffer;
let backgroundMusicBuffer;
let backgroundMusicSource;

// Load the sound file
fetch("keyPress.mp3")
  .then(response => response.arrayBuffer())
  .then(data => audioContext.decodeAudioData(data))
  .then(buffer => {
    keyPressSoundBuffer = buffer; // Store the decoded audio data
  })
  .catch(error => console.error("Error loading sound:", error));

fetch("backgroundMusic.mp3") // Replace with your music file path
  .then(response => response.arrayBuffer())
  .then(data => audioContext.decodeAudioData(data))
  .then(buffer => {
    backgroundMusicBuffer = buffer; // Store the decoded audio data
  })
  .catch(error => console.error("Error loading background music:", error));


function resizeCanvas() {
  const aspectRatio = GAME_WIDTH / GAME_HEIGHT;
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  let newWidth, newHeight;

  // Define padding
  const padding = 220; // Total padding (20px on each side)

  if (windowWidth / windowHeight > aspectRatio) {
    newHeight = windowHeight - padding; // Adjust height for padding
    newWidth = newHeight * aspectRatio;
  } else {
    newWidth = windowWidth - padding; // Adjust width for padding
    newHeight = newWidth / aspectRatio;
  }

  canvas.width = GAME_WIDTH; // Keep the internal canvas resolution
  canvas.height = GAME_HEIGHT; // Keep the internal canvas resolution

  canvas.style.width = `${newWidth}px`; // Set the display size
  canvas.style.height = `${newHeight}px`; // Set the display size
  canvas.style.margin = `${padding / 2}px`; // Centering the canvas with margin

  drawGame();
}

function playBackgroundMusic() {
  if (!backgroundMusicBuffer) return; // Ensure the music buffer is loaded

  // Create a new audio buffer source
  backgroundMusicSource = audioContext.createBufferSource();
  backgroundMusicSource.buffer = backgroundMusicBuffer; // Set the music buffer

  // Connect the source to the destination (speakers)
  backgroundMusicSource.connect(audioContext.destination);

  // Set the music to loop
  backgroundMusicSource.loop = true;

  // Start playing the music
  backgroundMusicSource.start(0);
}


function playRandomizedPitchSound() {
  if (!keyPressSoundBuffer) return; // Ensure the sound buffer is loaded

  const source = audioContext.createBufferSource(); // Create a new audio buffer source
  source.buffer = keyPressSoundBuffer; // Set the sound buffer

  // Randomize the playback rate (between 0.8 and 1.2 for slight variation)
  source.playbackRate.value = Math.random() * 0.4 + 1.2; // Random value between 0.8 and 1.2

  source.connect(audioContext.destination); // Connect the source to the output (speakers)
  source.start(0); // Start playing the sound
}

function drawGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw the background
  ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

  drawWalls(); // Draw walls after the background
  drawTrail(); // Draw trail before the player
  drawPlayer(); // Draw player after the trail

  drawStartPoint(); // Draw start point image
  drawEndPoint(); // Draw end point image
}

// New function to draw the trail
function drawTrail() {
  ctx.fillStyle = "rgba(47, 170, 112, 1)"; // Color and transparency for the trail
  trail.forEach((pos) => {
    const scaledX = (pos.x / GAME_WIDTH) * canvas.width;
    const scaledY = (pos.y / GAME_HEIGHT) * canvas.height;
    const playerWidth = (playerSize.width / GAME_WIDTH) * canvas.width;
    const playerHeight = (playerSize.height / GAME_HEIGHT) * canvas.height;

    ctx.beginPath();
    ctx.arc(scaledX, scaledY, playerWidth / 5, 0, Math.PI * 5);
    ctx.fill();
  });
}

function drawWalls() {
  walls.forEach((wall) => {
    const scaledX = (wall.x / GAME_WIDTH) * canvas.width;
    const scaledY = (wall.y / GAME_HEIGHT) * canvas.height;
    const scaledWidth = (wall.width / GAME_WIDTH) * canvas.width;
    const scaledHeight = (wall.height / GAME_HEIGHT) * canvas.height;
    const borderRadius = 8; // Adjust this value for the desired border radius

    ctx.fillStyle = "rgba(255, 0, 0, 0.5)"; // Set fill color
    drawRoundedRect(scaledX, scaledY, scaledWidth, scaledHeight, borderRadius); // Draw the wall with rounded corners
  });
}


function drawRoundedRect(x, y, width, height, borderRadius) {
  ctx.beginPath();
  ctx.moveTo(x + borderRadius, y); // Move to the top-left corner

  // Top side
  ctx.lineTo(x + width - borderRadius, y);
  // Top-right corner
  ctx.arcTo(x + width, y, x + width, y + borderRadius, borderRadius);
  // Right side
  ctx.lineTo(x + width, y + height - borderRadius);
  // Bottom-right corner
  ctx.arcTo(x + width, y + height, x + width - borderRadius, y + height, borderRadius);
  // Bottom side
  ctx.lineTo(x + borderRadius, y + height);
  // Bottom-left corner
  ctx.arcTo(x, y + height, x, y + height - borderRadius, borderRadius);
  // Left side
  ctx.lineTo(x, y + borderRadius);
  // Top-left corner
  ctx.arcTo(x, y, x + borderRadius, y, borderRadius);

  ctx.closePath();
  ctx.fill();
}


function drawPlayer() {
  const playerWidth = (playerSize.width / GAME_WIDTH) * canvas.width;
  const playerHeight = (playerSize.height / GAME_HEIGHT) * canvas.height;

  const scaledX = (currentPosition.x / GAME_WIDTH) * canvas.width;
  const scaledY = (currentPosition.y / GAME_HEIGHT) * canvas.height;

  ctx.fillStyle = "rgb(47, 170, 112)";
  ctx.beginPath();
  ctx.arc(scaledX, scaledY, playerWidth / 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawStartPoint() {
  const imageWidth = 75; // Actual width of the image
  const imageHeight = 100; // Actual height of the image

  const scaledX = (levels[currentLevelIndex].startCoords.x + imageWidth / 2 / GAME_WIDTH) * canvas.width;
  const scaledY = (levels[currentLevelIndex].startCoords.y / GAME_HEIGHT) * canvas.height;

  // Draw the image centered at the start point
  ctx.drawImage(startImage, scaledX - imageWidth / 2, scaledY - imageHeight / 2, imageWidth, imageHeight);
}

function drawEndPoint() {
  const imageWidth = 75; // Actual width of the image
  const imageHeight = 100; // Actual height of the image

  const scaledX = ((levels[currentLevelIndex].endCoords.x - imageWidth / 2) / GAME_WIDTH) * canvas.width; // No need to adjust for image width
  const scaledY = (levels[currentLevelIndex].endCoords.y / GAME_HEIGHT) * canvas.height;

  // Save the current context state
  ctx.save();

  // Move the origin to the center of the end point
  ctx.translate(scaledX, scaledY);

  // Rotate the context by 180 degrees (PI radians)
  const rotationRadians = levels[currentLevelIndex].endCoords.rotation * (Math.PI / 180); // Convert to radians

  // Rotate the context
  ctx.rotate(rotationRadians); // Rotate by the specified angle
  
  // Draw the image centered at the new origin
  ctx.drawImage(endImage, -imageWidth / 2, -imageHeight / 2, imageWidth, imageHeight);

  // Restore the context to its original state
  ctx.restore();
}

function movePlayer() {
  // Add current position to trail
  trail.push({ ...currentPosition }); // Store current position

  // Move player in the current direction
  currentPosition.x += currentDirection.x * levels[currentLevelIndex].speed;
  currentPosition.y += currentDirection.y * levels[currentLevelIndex].speed;

  // Check wall collisions or boundaries
  if (checkWallCollision() || checkBounds()) {
    console.log("Game Over!");
    resetGame();
  } else if (checkEndPoint()) {
    console.log("You've reached the endpoint!");
    advanceToNextLevel(); // Move to the next level
  }

  drawGame(); // Draw the game after updating player position
}

function checkWallCollision() {
  const playerX = currentPosition.x;
  const playerY = currentPosition.y;

  return walls.some(
    (wall) => playerX > wall.x && playerX < wall.x + wall.width && playerY > wall.y && playerY < wall.y + wall.height
  );
}

function checkBounds() {
  return (
    currentPosition.x < 0 || currentPosition.x > GAME_WIDTH || currentPosition.y < 0 || currentPosition.y > GAME_HEIGHT
  );
}

function checkEndPoint() {
  const playerX = currentPosition.x;
  const playerY = currentPosition.y;

  // Get the current level's end point coordinates
  const endCoords = levels[currentLevelIndex].endCoords;

  // Define the hitbox dimensions
  const hitBoxSize = 50; // Width of the endpoint image

  // Check if the player overlaps with the end point hitbox
  return (
    playerX > endCoords.x - hitBoxSize &&
    playerX < endCoords.x + hitBoxSize &&
    playerY > endCoords.y - hitBoxSize &&
    playerY < endCoords.y + hitBoxSize
  );
}

function resetGame() {
  clearInterval(gameInterval);
  currentPosition = { ...levels[currentLevelIndex].startCoords };
  currentDirection = { x: 1, y: 0 };
  trail = []; // Clear the trail
  startGame();
}

function advanceToNextLevel() {
  // Check if there are more levels
  if (currentLevelIndex < levels.length - 1) {
    currentLevelIndex++; // Move to the next level
    resetPlayerPosition(); // Reset player position to the new level's start position
  } else {
    displayEndMessage(); // End game if there are no more levels
  }
}
function resetPlayerPosition() {
  currentPosition = { ...levels[currentLevelIndex].startCoords };
  walls = [...levels[currentLevelIndex].walls]; // Update walls for the new level
  trail = []; // Clear the trail for the new level
  loadBackgroundImage(); // Load the new background image
  drawGame(); // Redraw the game for the new level
}

// Function to load the background image for the current level
function loadBackgroundImage() {
  bgImage.src = levels[currentLevelIndex].backgroundImage;

  // Ensure the background image is loaded before drawing
  bgImage.onload = () => {
    drawGame(); // Draw the game after loading the background
  };
}

function displayEndMessage() {
  clearInterval(gameInterval);
  document.getElementById("end-message").innerText = "You've reached the endpoint!";
  document.getElementById("end-screen").classList.remove("hidden");
  document.getElementById("game-canvas").classList.add("hidden");
}

function startGame() {
  gameState = "running";
  document.getElementById("start-screen").classList.add("hidden");
  document.getElementById("game-container").classList.remove("hidden");
  document.getElementById("game-canvas").classList.remove("hidden");
  resetPlayerPosition(); // Set up the player and load the level
  playBackgroundMusic(); 
  gameInterval = setInterval(movePlayer, 20);
}

document.getElementById("start-button").addEventListener("click", startGame);
document.getElementById("restart-button").addEventListener("click", () => {
  gameState = "start"; // Reset game state to start
  currentLevelIndex = 0; // Reset to the first level
  document.getElementById("start-screen").classList.remove("hidden"); // Show start screen
  document.getElementById("end-screen").classList.add("hidden"); // Hide end screen
  document.getElementById("game-canvas").classList.add("hidden");
});

currentDirection = { x: 1, y: 0 };

document.addEventListener("keydown", (event) => {
  switch (event.code) {
    case "ArrowUp":
    case "KeyW":
      currentDirection = { x: 0, y: -1 };
      playRandomizedPitchSound(); 
      break;
    case "ArrowDown":
    case "KeyS":
      currentDirection = { x: 0, y: 1 };
      playRandomizedPitchSound(); 
      break;
    case "ArrowLeft":
    case "KeyA":
      currentDirection = { x: -1, y: 0 };
      playRandomizedPitchSound(); 
      break;
    case "ArrowRight":
    case "KeyD":
      currentDirection = { x: 1, y: 0 };
      playRandomizedPitchSound(); 
      break;
  }
});

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
