import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import Stats from 'three/examples/jsm/libs/stats.module'

const stats = new Stats();
document.body.appendChild(stats.dom);


function getGeometryDimensions(geometry) {
    geometry.computeBoundingBox();
    const boundingBox = geometry.boundingBox;
    const size = new THREE.Vector3();
    boundingBox.getSize(size);

    return {
        width: size.x,
        height: size.y,
        depth: size.z
    };
}

const manager = new THREE.LoadingManager();
const loader = new GLTFLoader(manager);
const textureLoader = new THREE.TextureLoader();

let materialRoad;
textureLoader.load(
    'textures/road.jpg',
    // onLoad callback
    function (texture) {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.MirroredRepeatWrapping
        texture.wrapT = THREE.MirroredRepeatWrapping
        texture.repeat.set(1, 10);
        materialRoad = new THREE.MeshBasicMaterial({
            map: texture
        });
    },
);

let cubeBoxplayer = null;
let CarSize = { width: 1, height: 1, depth: 1 }
let isFirst = 0
loader.load(
    'models/car/scene.gltf',
    // called when the resource is loaded
    function (gltf) {
        cubeBoxplayer = gltf.scene;
        gltf.animations; // Array<THREE.AnimationClip>
        gltf.scene; // THREE.Group
        gltf.scenes; // Array<THREE.Group>
        gltf.cameras; // Array<THREE.Camera>
        gltf.asset; // Object
        gltf.scene.traverse(function (child) {
            if (child.isMesh) {
                if (isFirst == 0) {
                    const geometry = child.geometry;
                    const { width, height, depth } = getGeometryDimensions(geometry);
                    CarSize.width = width;
                    CarSize.height = height;
                    CarSize.depth = depth;
                    isFirst = 1
                }
            }
        });
    },
);
manager.onLoad = init;


function init() {

    let p_x = 0;
    let p_y = 45;
    let p_z = 150;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 5000)
    camera.position.z = p_z;
    camera.position.y = p_y;
    camera.position.x = p_x;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

    renderer.setClearColor(0x000000, 0);
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.shadowMap.enabled = true;

    renderer.domElement.setAttribute("id", "container3d");

    document.body.insertBefore(renderer.domElement, document.body.firstChild)



    scene.add(cubeBoxplayer)
    cubeBoxplayer.position.x = 0
    cubeBoxplayer.position.y = -9.5
    cubeBoxplayer.position.z = 0
    cubeBoxplayer.rotation.y = 3.15
    cubeBoxplayer.castShadow = true;
    cubeBoxplayer.receiveShadow = true;


    // Light
    const aLight = new THREE.AmbientLight(0xffffff, 0.7)
    aLight.position.set(0, 60, 50)
    scene.add(aLight);

    const light = new THREE.DirectionalLight(0xFFFFFF, 40);
    light.position.set(0, 20, -5);
    scene.add(light);
    light.castShadow = true;


    const controls = new OrbitControls(camera, renderer.domElement);

    camera.position.set(0, 20, 60);
    controls.update();


    const roadSystem = new THREE.Object3D();

    scene.add(roadSystem);

    const road = new THREE.BoxGeometry(20, 1, 1000);
    // const materialBoxRoad = new THREE.MeshPhongMaterial({ color: '#fff' });
    const cubeBoxRoad = new THREE.Mesh(road, materialRoad);
    cubeBoxRoad.position.x = 0
    cubeBoxRoad.position.y = 0
    cubeBoxRoad.position.z = 0
    cubeBoxRoad.castShadow = true;
    cubeBoxRoad.receiveShadow = true;

    roadSystem.position.x = 0
    roadSystem.position.y = -10
    roadSystem.position.z = -cubeBoxRoad.geometry.parameters.depth / 2
    roadSystem.add(cubeBoxRoad);



    let arrayObstacle = [];
    let arrayBoost = [];
    function generateObstacle(countObstacle = 0) {
        const obstacleSize = new THREE.ConeGeometry(1, 2, 15);
        const obstacleMaterial = new THREE.MeshPhongMaterial({ color: '#ff0000' });
        const sideBarMaterial = new THREE.MeshPhongMaterial({ color: '#ffffff' }); // Белый цвет для полосок


        for (let index = 0; index < countObstacle; index++) {
            const obstacle = new THREE.Mesh(obstacleSize, obstacleMaterial);

            const randomXPosition = (Math.random() - 0.5) * cubeBoxRoad.geometry.parameters.width;
            const randomZPosition = (Math.random() - 0.5) * cubeBoxRoad.geometry.parameters.depth;

            obstacle.position.set(randomXPosition, 1, randomZPosition);
            obstacle.castShadow = true;
            obstacle.receiveShadow = true;


            const sideBarSize = new THREE.CylinderGeometry(0.48, 0.58, 0.2, 15);
            const sideBarSizeTop = new THREE.CylinderGeometry(0.26, 0.36, 0.2, 15);
            const topSideBar = new THREE.Mesh(sideBarSizeTop, sideBarMaterial);
            const bottomSideBar = new THREE.Mesh(sideBarSize, sideBarMaterial);

            bottomSideBar.position.set(obstacle.position.x, 1, obstacle.position.z);
            topSideBar.position.set(obstacle.position.x, 1.4, obstacle.position.z);

            arrayObstacle.push(obstacle)
            roadSystem.add(obstacle);
            roadSystem.add(bottomSideBar);
            roadSystem.add(topSideBar);
        }
    }

    generateObstacle(250)

    function generateBoost(countObstacle = 0) {
        const boostSize = new THREE.BoxGeometry(1, 1, 1);
        const whiteMaterial = new THREE.MeshPhongMaterial({ color: '#ff0000' });

        for (let index = 0; index < countObstacle; index++) {
            const boost = new THREE.Mesh(boostSize, whiteMaterial);

            const randomXPosition = (Math.random() - 0.5) * cubeBoxRoad.geometry.parameters.width;
            const randomZPosition = (Math.random() - 0.5) * cubeBoxRoad.geometry.parameters.depth;

            boost.position.set(randomXPosition, 2, randomZPosition);
            boost.castShadow = true;
            boost.receiveShadow = true;

            arrayBoost.push(boost)
            roadSystem.add(boost);
        }
    }
    // generateBoost(60)


    function start() {
        roadSystem.position.z = -cubeBoxRoad.geometry.parameters.depth / 2
        cubeBoxplayer.position.x = 0
        speed = 1
        counter = 0
        document.getElementById('modal').classList.remove('active')
        generateGradient()
    }



    let rangeRoad
    let animationId
    let speed
    let isBoost = false
    let counter
    let counterHtml = document.getElementById('counter')
    let keyDownPres = false
    let direction = ''
    rangeRoad = (Math.abs(cubeBoxRoad.geometry.parameters.width) - CarSize.width) / 2
    start()
    animate()
    function animate() {
        animationId = requestAnimationFrame(animate);
        roadSystem.position.z += speed

        checkPosition();
        counter += speed
        counterHtml.textContent = counter
        turnRight()
        turnLeft()
        stats.update();
        controls.update();
        renderer.render(scene, camera);
    }



    function checkPosition() {
        if (Math.abs(cubeBoxplayer.position.x) > rangeRoad) {
            gameOver()
        }
        arrayObstacle.forEach(element => {
            let leftBorderPlayer = cubeBoxplayer.position.x - CarSize.width / 2
            let rightBorderPlayer = cubeBoxplayer.position.x + CarSize.width / 2
            let element_position_z = element.position.z + roadSystem.position.z
            if (cubeBoxplayer.position.z - CarSize.depth / 2 <= element_position_z && cubeBoxplayer.position.z + CarSize.depth / 2 >= element_position_z) {
                if (leftBorderPlayer < element.position.x && element.position.x < 0 && rightBorderPlayer > element.position.x) {
                    gameOver()
                }
                else if (rightBorderPlayer > element.position.x && element.position.x >= 0 && leftBorderPlayer < element.position.x) {
                    gameOver()
                }
            }
        });

        // arrayBoost.forEach(elementBoost => {
        //     let leftBorderPlayer = cubeBoxplayer.position.x - CarSize.width / 2
        //     let rightBorderPlayer = cubeBoxplayer.position.x + CarSize.width / 2
        //     let element_position_z = elementBoost.position.z + roadSystem.position.z
        //     if (cubeBoxplayer.position.z - CarSize.depth / 2 <= element_position_z && cubeBoxplayer.position.z + CarSize.depth / 2 >= element_position_z) {
        //         if (leftBorderPlayer < elementBoost.position.x && elementBoost.position.x < 0 && rightBorderPlayer > elementBoost.position.x) {
        //             Boost(elementBoost)
        //         }
        //         else if (rightBorderPlayer > elementBoost.position.x && elementBoost.position.x >= 0 && leftBorderPlayer < elementBoost.position.x) {
        //             Boost(elementBoost)
        //         }
        //     }
        // });
    }

    function gameOver() {
        speed = 0
        document.getElementById('modal').classList.add('active')
        document.getElementById('counter_result').textContent = counter;
    }

    function Boost(element) {
        speed = 2
        roadSystem.remove(element);
    }


    function playerControl() {
        window.onkeydown = window.onkeyup = window.onkeypress = handle;

        function handle(e) {
            if (e.type == 'keydown') {
                keyDownPres = true
            }
            else {
                keyDownPres = false
            }
            switch (e.key) {
                case 'ArrowLeft':
                    direction = 'ArrowLeft'
                    break;
                case 'ArrowRight':
                    direction = 'ArrowRight'
                    break;
                default:
                    break;
            }
        }
    }
    playerControl()

    function turnRight() {
        if (keyDownPres && direction == "ArrowRight") {
            cubeBoxplayer.position.x += 0.3
            cubeBoxplayer.rotation.y = 3.10
        }


        if (!keyDownPres) {
            setTimeout(() => {
                cubeBoxplayer.rotation.y = 3.15
            }, 50);
        }
    }

    function turnLeft() {
        if (keyDownPres && direction == "ArrowLeft") {
            cubeBoxplayer.position.x -= 0.3
            cubeBoxplayer.rotation.y = 3.20
        }
        if (!keyDownPres) {
            setTimeout(() => {
                cubeBoxplayer.rotation.y = 3.15
            }, 50);
        }
    }

    document.getElementById('btn_restart').addEventListener('click', () => {
        start()
    })

    turnLeftBtn.addEventListener("touchstart", () => {
        keyDownPres = true
        direction = 'ArrowLeft'
    });
    turnLeftBtn.addEventListener("touchend", () => {
        keyDownPres = false
    });

    turnRightBtn.addEventListener("touchstart", () => {
        keyDownPres = true
        direction = 'ArrowRight'
    });
    turnRightBtn.addEventListener("touchend", () => {
        keyDownPres = false
    });

}


function generateGradient() {
    let colors = [];
    for (let index = 0; index < 5; index++) {
        colors.push(generateRandomColor());

    }
    const degree = Math.floor(Math.random() * 360);
    const gradientString = `linear-gradient(${degree}deg, ${colors.join(', ')})`;

    document.body.style.background = gradientString;
}

function generateRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}


document.ondblclick = function (e) {
    e.preventDefault();
}