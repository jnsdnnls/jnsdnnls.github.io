const player = document.getElementById("player");
const startPoint = document.getElementById("start-point");
const endPoint = document.getElementById("end-point");
const message = document.getElementById("message");
const startScreen = document.getElementById("start-screen");
const gameContainer = document.getElementById("game-container");
const endScreen = document.getElementById("end-screen");
const endMessage = document.getElementById("end-message");

// Define levels with unique configurations
const levels = [
  {
    startCoords: { x: 0, y: 875 },
    endCoords: { x: 1859, y: 115 },
    walls: [
      { x: 0, y: 0, width: 458, height: 688 },
      { x: 322, y: 894, width: 300, height: 185 },
      { x: 409, y: 522, width: 667, height: 261 },
      { x: 733, y: 522, width: 343, height: 457 },
      { x: 733, y: 627, width: 767, height: 156 },
      { x: 1179, y: 875, width: 741, height: 205 },
      { x: 1630, y: 430, width: 290, height: 650 },
      { x: 1752, y: 376, width: 168, height: 120 },
      { x: 1174, y: 339, width: 532, height: 170 },
      { x: 1364, y: 119, width: 127, height: 275 },
      { x: 584, y: 251, width: 726, height: 149 },
      { x: 584, y: 101, width: 154, height: 342 },
      { x: 537, y: 101, width: 201, height: 129 },
      { x: 844, y: 0, width: 391, height: 174 },
      { x: 1589, y: 0, width: 162, height: 174 },
    ],
    speed: 4,
    backgroundImage: "./levels/level1.png",
  },
  {
    startCoords: { x: 100, y: 650 },
    endCoords: { x: 1200, y: 50 },
    walls: [
      { x: 0, y: 100, width: 300, height: 500 },
      { x: 600, y: 300, width: 400, height: 200 },
      // Add more walls for level 2
    ],
    speed: 4,
    backgroundImage: "./levels/VLSICircuitBreaker2.0-GTAO-Circuit5.png",
  },
];

let gameState = "start"; // Possible states: 'start', 'running', 'over'
let currentPosition = { x: 0, y: 0 }; // Player position
let currentDirection = { x: 1, y: 0 }; // Starting direction (right)
let gameInterval;
let currentLevelIndex = 0; // Start with level 0
let walls = []; // Array to store wall configurations
const endHitbox = { width: 60, height: 80 }; // Hitbox dimensions

const trailPositions = [];
const maxTrailLength = 50; // Maximum number of segments in the trail

// Set start and end points
function setStartAndEndPoints(level) {
  const { startCoords, endCoords } = level;
  startPoint.style.left = `${startCoords.x}px`;
  startPoint.style.top = `${startCoords.y}px`;
  endPoint.style.left = `${endCoords.x}px`;
  endPoint.style.top = `${endCoords.y}px`;
}

// Move the player automatically
function movePlayer() {
  if (gameState !== "running") return; // Stop movement if the game is not running

  // Store the current position for the trail
  trailPositions.push({ ...currentPosition });

  currentPosition.x += currentDirection.x * levels[currentLevelIndex].speed;
  currentPosition.y += currentDirection.y * levels[currentLevelIndex].speed;

  // Check for wall collisions or out of bounds
  if (checkWallCollision() || checkBounds()) {
    resetGame();
  } else if (checkEndPoint()) {
    displayEndMessage();
  }

  updatePlayerPosition();
  drawTrail();
}

// Function to draw the trail
function drawTrail() {
  const trailContainer = document.getElementById("trail-container");
  trailContainer.innerHTML = ""; // Clear existing trail

  // Draw circles for each trail position
  trailPositions.forEach((pos) => {
    const circle = document.createElement("div");
    circle.classList.add("trail-circle");
    circle.style.left = `${pos.x - 4}px`; // Adjust circle position slightly for visual effect
    circle.style.top = `${pos.y - 4}px`; // Adjust circle position slightly for visual effect
    trailContainer.appendChild(circle);
  });
}

const playerSize = { width: 22, height: 22 }; // Example size, adjust as necessary

function updatePlayerPosition() {
  const centerX = currentPosition.x - playerSize.width / 2;
  const centerY = currentPosition.y - playerSize.height / 2;
  player.style.transform = `translate(${centerX}px, ${centerY}px)`;
}

function checkWallCollision() {
  const centerX = currentPosition.x;
  const centerY = currentPosition.y;
  const halfWidth = playerSize.width / 2;
  const halfHeight = playerSize.height / 2;

  return walls.some(
    (wall) =>
      centerX + halfWidth > wall.x &&
      centerX - halfWidth < wall.x + wall.width &&
      centerY + halfHeight > wall.y &&
      centerY - halfHeight < wall.y + wall.height
  );
}

// Check if the player goes out of bounds
function checkBounds() {
  const container = document.getElementById("game-container");
  return (
    currentPosition.x < 0 ||
    currentPosition.x > container.clientWidth ||
    currentPosition.y < 0 ||
    currentPosition.y > container.clientHeight
  );
}

function checkEndPoint() {
  const centerX = currentPosition.x;
  const centerY = currentPosition.y;

  return (
    centerX + endHitbox.width > endPoint.offsetLeft &&
    centerX - endHitbox.width < endPoint.offsetLeft + endHitbox.width &&
    centerY + endHitbox.height > endPoint.offsetTop &&
    centerY - endHitbox.height < endPoint.offsetTop + endHitbox.height
  );
}

// Change direction based on key input
function changeDirection(e) {
  const directions = {
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
  };

  if (e.key in directions) {
    currentDirection = directions[e.key];
  } else if (e.key === "+") {
    levels[currentLevelIndex].speed++; // Increase speed
  } else if (e.key === "-") {
    levels[currentLevelIndex].speed = Math.max(1, levels[currentLevelIndex].speed - 1); // Decrease speed but not below 1
  }
}

function loadLevel(levelIndex) {
  const level = levels[levelIndex];

  setStartAndEndPoints(level); // Set start and end points
  walls = [...level.walls]; // Update walls from the current level
  createWalls(); // Create walls for the current level

  // Set the background image for the game container
  gameContainer.style.backgroundImage = `url(${level.backgroundImage})`;

  currentPosition = { ...level.startCoords }; // Reset player position
  currentDirection = { x: 1, y: 0 }; // Reset to starting direction
  updatePlayerPosition();
}

// Start the game and continuously move the player
function startGame() {
  gameState = "running"; // Set game state to running
  startScreen.classList.add("hidden");
  endScreen.classList.add("hidden");
  gameContainer.classList.remove("hidden");
  clearInterval(gameInterval);
  loadLevel(currentLevelIndex); // Load the current level
  gameInterval = setInterval(movePlayer, 20); // Move every 20ms for smoother movement
}

// Reset the game if the player hits a wall or goes out of bounds
function resetGame() {
  clearInterval(gameInterval);
  currentPosition = { ...levels[currentLevelIndex].startCoords }; // Reset to starting position
  currentDirection = { x: 1, y: 0 }; // Reset to starting direction
  gameState = "running"; // Reset game state to running
  updatePlayerPosition();
  trailPositions.length = 0; // Clear the trail
  drawTrail(); // Clear the trail visuals
  startGame(); // Restart game
}

// Display end message
function displayEndMessage() {
  gameState = "over"; // Set game state to over
  clearInterval(gameInterval);

  if (currentLevelIndex < levels.length - 1) {
    currentLevelIndex++;
    endMessage.innerText = "Level Complete! Proceeding to the next level...";
    setTimeout(() => {
      gameState = "running";
      loadLevel(currentLevelIndex); // Load the next level
      startGame();
    }, 2000); // Wait 2 seconds before starting the next level
  } else {
    endMessage.innerText = "You've reached the endpoint! Game over!";
    endScreen.classList.remove("hidden");
  }
}

// Initialize the game
setStartAndEndPoints(levels[currentLevelIndex]); // Set the start and end point positions
updatePlayerPosition(); // Initialize the player's position

// Event listeners
document.getElementById("start-button").addEventListener("click", startGame);
document.getElementById("restart-button").addEventListener("click", () => {
  gameState = "start"; // Reset game state to start
  currentLevelIndex = 0; // Reset to the first level
  startScreen.classList.remove("hidden"); // Show start screen
  endScreen.classList.add("hidden"); // Hide end screen
  gameContainer.classList.add("hidden"); // Hide game container
});
document.addEventListener("keydown", changeDirection);

// Create walls at the start
function createWalls() {
  document.querySelectorAll(".wall").forEach((wall) => wall.remove()); // Clear existing walls

  walls.forEach((wall) => {
    const wallDiv = document.createElement("div");
    wallDiv.classList.add("wall");
    wallDiv.style.width = wall.width + "px";
    wallDiv.style.height = wall.height + "px";
    wallDiv.style.left = wall.x + "px";
    wallDiv.style.top = wall.y + "px";
    gameContainer.appendChild(wallDiv);
  });
}

// Create walls initially
createWalls();
