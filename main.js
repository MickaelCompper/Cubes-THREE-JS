import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';

/**
 * Variables
 */
const pointsUI = document.getElementById('pointsUI');
let points = 0;
let gameOver = false;

const randomRangeNum = (max, min)=>{
  return Math.floor(Math.random() * (max - min + 1) + min);
}
const moveObstables = (arr, speed, maxX, minX, maxZ, minZ)=>{
  arr.forEach(element => {
    element.body.position.z += speed;

    if (element.body.position.z > camera.position.z) {
      element.body.position.x = randomRangeNum(maxX, minX);
      element.body.position.z = randomRangeNum(maxZ, minZ);
    }
    element.mesh.position.copy(element.body.position);
    element.mesh.quaternion.copy(element.body.quaternion);
  });
};

/**
 * Scene Setup
 */
const scene = new THREE.Scene();
const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.82, 0)
});

const cannonDebugger = new CannonDebugger(scene, world, {
  color: '#AEE2FF',
  scale: 1
});

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = 4.5;
camera.position.y = 1.5;


const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

/**
 * Controls
 */
const controls = new OrbitControls(camera, renderer.domElement);

/**
 * Ground
 */
const groundShape = new CANNON.Box(new CANNON.Vec3(15, 0.5, 15));
const groundBody = new CANNON.Body({
  mass: 0, 
});
groundBody.addShape(groundShape);
groundBody.position.y = -1; 
world.addBody(groundBody);

const groundMesh = new THREE.Mesh(
  new THREE.BoxGeometry(30, 1, 30),
  new THREE.MeshBasicMaterial({ color: 0x00ff00 })
);
groundMesh.position.y = -1;
scene.add(groundMesh);


/**
 * Player
 */
const playerBody = new CANNON.Body({
  mass: 1,
  shape: new CANNON.Box(new CANNON.Vec3(0.25, 0.25, 0.25)),
  fixedRotation: true
});
world.addBody(playerBody);

const player = new THREE.Mesh( 
  new THREE.BoxGeometry( 0.5, 0.5, 0.5 ), 
  new THREE.MeshBasicMaterial( { color: 0xff0000 } ) );
scene.add( player );

playerBody.addEventListener('collide', (e)=>{
  powerups.forEach((element)=>{
    if (e.body === element.body) {
      element.body.position.x = randomRangeNum(8, -8);
      element.body.position.z = randomRangeNum(-5, -10);
      element.mesh.position.copy(element.body.position);
      element.mesh.quaternion.copy(element.body.quaternion);
      points++;
      pointsUI.textContent = points.toString();
    }
  })
  enemies.forEach((element)=>{
    if (e.body === element.body) {
      gameOver = true;
    }
  })
})

/**
 * Powerup
 */
let powerups = [];
for (let i = 0; i < 10; i++) {
  const posX = randomRangeNum(8, -8);
  const posZ = randomRangeNum(-5, -10);

  const powerup = new THREE.Mesh(
    new THREE.TorusGeometry(1, 0.4, 16, 50),
    new THREE.MeshBasicMaterial( { color: 0xffff00 } ));

    powerup.scale.set(0.1, 0.1, 0.1);
    powerup.position.x = posX;
    powerup.position.z = posZ;
    powerup.name = "powerup" + [i + 1];
    scene.add(powerup);

    const powerupBody = new CANNON.Body({
      shape: new CANNON.Sphere(0.2)
    });
    powerupBody.position.set(posX, 0, posZ);
    world.addBody(powerupBody);

    const powerupObject = {
      mesh: powerup,
      body: powerupBody
    }

    powerups.push(powerupObject);
}

/**
 * Enemy
 */
const enemies = [];

for (let i = 0; i < 10; i++) {
  const posX = randomRangeNum(8, -8);
  const posZ = randomRangeNum(-5, -10);

  const enemy = new THREE.Mesh(
    new THREE.TorusGeometry(1, 0.4, 16, 50),
    new THREE.MeshBasicMaterial( { color: 0x0000ff } ));

    enemy.scale.set(0.1, 0.1, 0.1);
    enemy.position.x = posX;
    enemy.position.z = posZ;
    enemy.name = "enemy" + [i + 1];
    scene.add(enemy);

    const enemyBody = new CANNON.Body({
      shape: new CANNON.Sphere(0.2)
    });
    enemyBody.position.set(posX, 0, posZ);
    world.addBody(enemyBody);

    const enemyObject = {
      mesh: enemy,
      body: enemyBody
    }

    enemies.push(enemyObject);
  }

  /**
   * Particules
   */
  scene.fog = new THREE.FogExp2(0x0047ab, 0.09, 50);

  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const size = 2000;

  for (let i = 0; i < 5000; i++) {
    const x = (Math.random() * size + Math.random() * size) / 2;
    const y = (Math.random() * size + Math.random() * size) / 2;
    const z = (Math.random() * size + Math.random() * size) / 2;
    
    vertices.push(x, y, z);
  }

  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(vertices, 3)
  );

  const material = new THREE.PointsMaterial({
    size: 2,
    color: 0xffffff
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

/**
 * Animate Loop
 */
function animate() {
	requestAnimationFrame( animate );

  particles.rotation.x += .001;
  particles.rotation.y += .001;
  particles.rotation.z += .005;

  if (!gameOver) {
  moveObstables(powerups, 0.1, 8, -8, -5, -10);
  moveObstables(enemies, 0.1, 8, -8, -5, -10);
  } else {
    pointsUI.textContent = 'Game Over';
    playerBody.velocity.set(playerBody.position.x, 5, 5);

    enemies.forEach((element)=>{
      scene.remove(element.mesh);
      world.removeBody(element.body)
    });
    powerups.forEach((element)=>{
      scene.remove(element.mesh);
      world.removeBody(element.body)
    });

    if (playerBody.position.z > camera.position.z) {
      scene.remove(player);
      world.removeBody(playerBody);
    }
  }

  controls.update();

  world.fixedStep();

  player.position.copy(playerBody.position);
  player.quaternion.copy(playerBody.quaternion);

  cannonDebugger.update();

	renderer.render( scene, camera );
}

animate();

/**
 * Event Listeners
 */
window.addEventListener('resize', ()=>{
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener('keydown', (e)=>{
  if(e.key === 'd' || e.key === 'D'){
    playerBody.position.x += 0.1;
  }
  if(e.key === 'q' || e.key === 'Q'){
    playerBody.position.x += -0.1;
  }
  if (e.key === 'r' || e.key === 'R'){
    playerBody.position.x = 0;
    playerBody.position.y = 0;
    playerBody.position.z = 0;
  }
  if(e.key === ' ' || e.key === ' '){
    playerBody.position.y = 2;
  }
});