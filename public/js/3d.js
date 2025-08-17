// --- SCENE SETUP, LOADERS, SKY, LIGHTING, ROAD (All Unchanged) ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('game-canvas').appendChild(renderer.domElement);
const textureLoader = new THREE.TextureLoader();
const fbxLoader = new THREE.FBXLoader();
const skyTexture = textureLoader.load('textures/sky.jpg');
const skyGeometry = new THREE.SphereGeometry(500, 60, 40);
skyGeometry.scale(-1, 1, 1);
const skyMaterial = new THREE.MeshBasicMaterial({ map: skyTexture });
const skybox = new THREE.Mesh(skyGeometry, skyMaterial);
scene.add(skybox);
scene.fog = new THREE.Fog(0x87CEEB, 10, 150);
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(10, 20, 5);
dirLight.castShadow = true;
scene.add(dirLight);
const roadColorTexture = textureLoader.load('textures/road_color.jpg');
const roadNormalTexture = textureLoader.load('textures/road_normal.jpg');
roadColorTexture.wrapS = roadColorTexture.wrapT = THREE.RepeatWrapping;
roadNormalTexture.wrapS = roadNormalTexture.wrapT = THREE.RepeatWrapping;
roadColorTexture.repeat.set(1, 50);
roadNormalTexture.repeat.set(1, 50);
const groundMaterial = new THREE.MeshStandardMaterial({ map: roadColorTexture, normalMap: roadNormalTexture, roughness: 0.8, metalness: 0.2 });
const groundGeometry = new THREE.PlaneGeometry(10, 2000);
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);
camera.position.set(0, 5, 12);
camera.lookAt(0, 0, 0);

// --- PLAYER MODEL SETUP ---
let playerModel = null;
const playerBox = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
let mixer;
const clock = new THREE.Clock();

// --- SHOP & GAME DATA ---
const SHOP_ITEMS = [ { id: 'default_green', name: 'Default Green', cost: 0, color: 0x00ff00 }, { id: 'electric_blue', name: 'Electric Blue', cost: 5, color: 0x00c6ff }, { id: 'hot_pink', name: 'Hot Pink', cost: 10, color: 0xff00ff }, { id: 'gold_rush', name: 'Gold Rush', cost: 25, color: 0xffd700 }, { id: 'stealth_black', name: 'Stealth Black', cost: 50, color: 0x222222 }, ];
let gameData = { coins: 0, purchasedItems: ['default_green'], equippedItem: 'default_green' };

// --- GAME STATE VARIABLES ---
let score = 0, gameSpeed = 0.2, isGameRunning = false;
let obstacles = [], coins = [], activeEffects = [];
const lanes = [-2.5, 0, 2.5];
let playerIsJumping = false, playerVelocityY = 0;
const gravity = 0.02, jumpStrength = 0.4;

// --- DOM ELEMENTS ---
const coinElement = document.getElementById('coin-display');
const startOverlay = document.getElementById('start-overlay');
const gameOverScreen = document.getElementById('game-over-screen');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const openMarketButton = document.getElementById('open-market-button');
const closeMarketButton = document.getElementById('close-market-button');
const marketplaceScreen = document.getElementById('marketplace-screen');
const itemsContainer = document.getElementById('items-container');
const marketCoinDisplay = document.getElementById('market-coin-display');
// NEW: Get the new button from the Game Over screen
const marketFromGameOverButton = document.getElementById('market-from-gameover-button');
const keys = {};

// --- DATA PERSISTENCE FUNCTIONS ---
function saveGameData() { localStorage.setItem('loanTrapGameData', JSON.stringify(gameData)); }
function loadGameData() { const savedData = localStorage.getItem('loanTrapGameData'); if (savedData) { gameData = JSON.parse(savedData); } updateCoinDisplay(); }

// --- EVENT LISTENERS ---
document.addEventListener('keydown', (e) => { keys[e.key] = true; });
document.addEventListener('keyup', (e) => { keys[e.key] = false; });
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', restartGame);
openMarketButton.addEventListener('click', openMarketplace);
closeMarketButton.addEventListener('click', closeMarketplace);
window.addEventListener('resize', onWindowResize);
// NEW: Add the event listener for the new button
marketFromGameOverButton.addEventListener('click', () => {
    gameOverScreen.style.display = 'none'; // Hide the game over screen
    openMarketplace();                      // Show the marketplace
});

// --- GAME FUNCTIONS ---
function startGame() { isGameRunning = true; score = 0; startOverlay.style.display = 'none'; openMarketButton.style.display = 'none'; animate(); }
function stopGame() { isGameRunning = false; gameOverScreen.style.display = 'flex'; gameData.coins += score; saveGameData(); updateCoinDisplay(); }
function restartGame() {
    score = 0; gameSpeed = 0.2;
    if (playerModel) { playerModel.position.set(0, 0, 0); playerModel.scale.set(0.01, 0.007, 0.01); playerModel.rotation.y = Math.PI; }
    [...obstacles, ...coins, ...activeEffects].forEach(obj => disposeOfObject(obj));
    obstacles = []; coins = []; activeEffects = [];
    gameOverScreen.style.display = 'none';
    startOverlay.style.display = 'flex';
    openMarketButton.style.display = 'block';
}
function onWindowResize() { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); }
function disposeOfObject(obj) { obj.traverse(child => { if (child.isMesh) { child.geometry.dispose(); if (child.material.isMaterial) { for (const key of Object.keys(child.material)) { if (child.material[key] && child.material[key].isTexture) { child.material[key].dispose(); } } child.material.dispose(); } } }); scene.remove(obj); }

// --- MARKETPLACE FUNCTIONS ---
function openMarketplace() { startOverlay.style.display = 'none'; marketplaceScreen.style.display = 'flex'; marketCoinDisplay.innerText = `Your Coins: ${gameData.coins}`; populateMarketplace(); }
function closeMarketplace() { marketplaceScreen.style.display = 'none'; startOverlay.style.display = 'flex'; openMarketButton.style.display = 'block'; }
function populateMarketplace() {
    itemsContainer.innerHTML = '';
    SHOP_ITEMS.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.className = 'item-card';
        const isPurchased = gameData.purchasedItems.includes(item.id);
        const isEquipped = gameData.equippedItem === item.id;
        itemCard.innerHTML = `<div class="item-name">${item.name}</div><div class="item-preview" style="background-color: #${new THREE.Color(item.color).getHexString()};"></div><button class="btn ${isPurchased ? 'btn-secondary' : 'btn-primary'}" id="btn-${item.id}">${isEquipped ? 'Equipped' : isPurchased ? 'Equip' : `Buy (${item.cost} Coins)`}</button>`;
        itemsContainer.appendChild(itemCard);
        const button = document.getElementById(`btn-${item.id}`);
        if (isEquipped) { button.disabled = true; }
        else if (isPurchased) { button.onclick = () => equipItem(item.id); }
        else { button.onclick = () => purchaseItem(item.id); }
    });
}
function purchaseItem(itemId) { const item = SHOP_ITEMS.find(i => i.id === itemId); if (gameData.coins >= item.cost) { gameData.coins -= item.cost; gameData.purchasedItems.push(itemId); saveGameData(); equipItem(itemId); } else { alert("Not enough coins!"); } }
function equipItem(itemId) { gameData.equippedItem = itemId; applyEquippedItem(); saveGameData(); populateMarketplace(); marketCoinDisplay.innerText = `Your Coins: ${gameData.coins}`; }
function applyEquippedItem() { if (!playerModel) return; const item = SHOP_ITEMS.find(i => i.id === gameData.equippedItem); if (item) { playerModel.traverse(child => { if (child.isMesh) { child.material.color.set(item.color); } }); } }
function updateCoinDisplay() { coinElement.innerText = `Coins: ${gameData.coins}`; }

// --- PLAYER MODEL LOADER ---
fbxLoader.load('models/character.fbx', function (fbx) {
    playerModel = fbx;
    playerModel.scale.set(0.01, 0.007, 0.01);
    playerModel.position.y = 0;
    playerModel.rotation.y = Math.PI;
    scene.add(playerModel);
    mixer = new THREE.AnimationMixer(playerModel);
    if (fbx.animations.length) mixer.clipAction(fbx.animations[0]).play();
    applyEquippedItem();
}, undefined, function (error) { console.error(error); });

// --- OBJECT & EFFECT CREATION (Unchanged) ---
function createCoinEffect(position) { const pGroup = new THREE.Group(); pGroup.userData.duration = 0.5; const pMat = new THREE.PointsMaterial({ color: 0xffff00, size: 0.2, transparent: true, blending: THREE.AdditiveBlending }); for (let i = 0; i < 15; i++) { const pGeo = new THREE.BufferGeometry(); pGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3)); const p = new THREE.Points(pGeo, pMat); p.userData.velocity = new THREE.Vector3((Math.random() - 0.5), (Math.random() - 0.5), (Math.random() - 0.5)).multiplyScalar(0.5); p.position.copy(position); pGroup.add(p); } scene.add(pGroup); activeEffects.push(pGroup); }
function createTextCanvas(text) { const canvas = document.createElement('canvas'); const context = canvas.getContext('2d'); canvas.width = 256; canvas.height = 128; context.fillStyle = 'white'; context.font = 'bold 70px Arial'; context.textAlign = 'center'; context.textBaseline = 'middle'; context.fillText(text, canvas.width / 2, canvas.height / 2); return canvas; }
function createGroundObstacle() { const words = ['DEBT', 'LOAN', 'BILLS', 'EXPENSE']; const word = words[Math.floor(Math.random() * words.length)]; const boxGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5); const boxMat = new THREE.MeshStandardMaterial({ color: 0xff0000 }); const box = new THREE.Mesh(boxGeo, boxMat); const textCanvas = createTextCanvas(word); const tex = new THREE.CanvasTexture(textCanvas); const textMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true }); const textPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.75), textMat); textPlane.position.z = 0.76; const group = new THREE.Group(); group.add(box); group.add(textPlane); group.position.x = lanes[Math.floor(Math.random() * lanes.length)]; group.position.y = 0.75; group.position.z = -100; group.box = new THREE.Box3(); scene.add(group); obstacles.push(group); }
function createHighObstacle() { const oGeo = new THREE.BoxGeometry(10, 1, 1); const oMat = new THREE.MeshStandardMaterial({ color: 0xff4500 }); const o = new THREE.Mesh(oGeo, oMat); o.position.x = 0; o.position.y = 1.2; o.position.z = -100; o.box = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3()); scene.add(o); obstacles.push(o); }
function createCoin() { const cGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 32); const cMat = new THREE.MeshStandardMaterial({ color: 0xffff00 }); const c = new THREE.Mesh(cGeo, cMat); c.rotation.x = Math.PI / 2; c.position.x = lanes[Math.floor(Math.random() * lanes.length)]; c.position.y = 1; c.position.z = -100; c.box = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3()); scene.add(c); coins.push(c); }

// --- MAIN GAME LOOP ---
let spawnTimer = 0;
function animate() {
    if (!isGameRunning) return;
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    skybox.rotation.y += 0.0002;
    ground.material.map.offset.y += gameSpeed * delta * 2;
    ground.material.normalMap.offset.y += gameSpeed * delta * 2;
    if (mixer) mixer.update(delta);
    if (playerModel) {
        if (keys['ArrowLeft'] && playerModel.position.x > lanes[0]) playerModel.position.x -= 0.15;
        if (keys['ArrowRight'] && playerModel.position.x < lanes[2]) playerModel.position.x += 0.15;
        if (keys['ArrowUp'] && !playerIsJumping) { playerIsJumping = true; playerVelocityY = jumpStrength; }
        if (playerIsJumping) { playerModel.position.y += playerVelocityY; playerVelocityY -= gravity; if (playerModel.position.y <= 0) { playerModel.position.y = 0; playerIsJumping = false; } }
        if (keys['ArrowDown']) { playerModel.scale.y = 0.0035; } else { playerModel.scale.y = 0.007; }
        camera.lookAt(playerModel.position);
        playerBox.setFromObject(playerModel);
    }
    coinElement.innerText = `Coins: ${gameData.coins} (+${score})`;
    for (let i = activeEffects.length - 1; i >= 0; i--) { const effect = activeEffects[i]; effect.userData.duration -= delta; effect.children.forEach(particle => { particle.position.add(particle.userData.velocity.clone().multiplyScalar(delta * 3)); }); if (effect.userData.duration <= 0) { disposeOfObject(effect); activeEffects.splice(i, 1); } }
    for (let i = obstacles.length - 1; i >= 0; i--) { const obstacle = obstacles[i]; obstacle.position.z += gameSpeed; const redBox = obstacle.children.length ? obstacle.children[0] : obstacle; obstacle.box.setFromObject(redBox); if (playerModel && playerBox.intersectsBox(obstacle.box)) { stopGame(); } if (obstacle.position.z > camera.position.z) { disposeOfObject(obstacle); obstacles.splice(i, 1); } }
    for (let i = coins.length - 1; i >= 0; i--) { const coin = coins[i]; coin.position.z += gameSpeed; coin.rotation.z += 0.1; coin.box.setFromObject(coin); if (playerModel && playerBox.intersectsBox(coin.box)) { score++; disposeOfObject(coin); coins.splice(i, 1); } if (coin.position.z > camera.position.z) { disposeOfObject(coin); coins.splice(i, 1); } }
    spawnTimer += delta;
    if (spawnTimer > 1.5) {
        const spawnType = Math.random();
        if (spawnType < 0.45) createCoin();
        else if (spawnType < 0.85) createGroundObstacle();
        else createHighObstacle();
        spawnTimer = 0;
        gameSpeed = Math.min(gameSpeed + 0.002, 0.5);
    }
    renderer.render(scene, camera);
}

// --- Initial Load ---
loadGameData();