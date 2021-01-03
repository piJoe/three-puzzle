import './style.scss';

import m from 'mithril';
import { store } from 'client/store';
import { Scene, PerspectiveCamera, WebGLRenderer, Mesh, Shape, Vector2, OrthographicCamera, TextureLoader, MeshStandardMaterial, AmbientLight, DirectionalLight, MathUtils, PlaneGeometry, Vector3, ExtrudeBufferGeometry, WireframeGeometry, LineSegments, Raycaster, BufferGeometry, PointsMaterial, Points, Geometry, SphereGeometry, DirectionalLightHelper, CameraHelper, PCFSoftShadowMap, RepeatWrapping, sRGBEncoding, ReinhardToneMapping, BasicShadowMap, MeshBasicMaterial, Object3D, PlaneBufferGeometry } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { generatePuzzlePaths } from 'client/lib/puzzle/puzzle-utils';
import { BufferGeometryUtils } from "three/examples/jsm/utils/BufferGeometryUtils";

function createShape(path) {
    return new Shape(path.map(p => new Vector2(p[0], p[1])));
}

const PuzzleUVGenerator = (puzzleData, i) => {
    // console.log(puzzleData, i);

    const { pieceSize, width, height } = puzzleData;
    const piece = puzzleData.pieces[i];

    const x = pieceSize[0] * piece.x;
    const y = pieceSize[1] * piece.y;

    return {
        generateTopUV: function (geometry, vertices, indexA, indexB, indexC) {

            const a_x = (vertices[indexA * 3] + x) / width;
            const a_y = (height - (vertices[indexA * 3 + 1] + y)) / height;
            const b_x = (vertices[indexB * 3] + x) / width;
            const b_y = (height - (vertices[indexB * 3 + 1] + y)) / height;
            const c_x = (vertices[indexC * 3] + x) / width;
            const c_y = (height - (vertices[indexC * 3 + 1] + y)) / height;

            return [
                new Vector2(a_x, a_y),
                new Vector2(b_x, b_y),
                new Vector2(c_x, c_y)
            ];

        },

        generateSideWallUV: function (geometry, vertices, indexA, indexB, indexC, indexD) {
            const nullVec = new Vector2(0,1);
            return [
                nullVec,
                nullVec,
                nullVec,
                nullVec
            ];
        }
    };

};

export const PuzzleRenderPage = function PuzzleRenderPage() {

    return {
        oncreate: (vnode) => {
            const canvasDOM = vnode.dom;
            console.log(vnode.dom);

            const puzzleData = store.puzzleData;
            const puzzlePaths = generatePuzzlePaths(puzzleData);
            // console.log(puzzlePaths);

            const raycaster = new Raycaster();
            raycaster.layers.set(1);

            const mouse = new Vector2();
            function onMouseMove(event) {
                mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
                mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
            }
            window.addEventListener('pointermove', onMouseMove);

            let pickupDown = false;
            let pickedObject = null;
            function key(k, isDown) {
                if (k.toLowerCase() === 'f') pickupDown = isDown;
            }
            window.addEventListener('keydown', (e) => key(e.key, true));
            window.addEventListener('keyup', (e) => key(e.key, false));

            const scene = new Scene();
            const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.001, 500);
            camera.layers.enable(0);
            camera.layers.enable(1);
            // const camera = new OrthographicCamera(window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 0.01, 1000);

            // const geometry = new BoxGeometry();
            // const material = new MeshBasicMaterial( { color: 0x00ff00 } );
            // const cube = new Mesh( geometry, material );
            // scene.add( cube );

            // const axesHelper = new AxesHelper(5);
            // scene.add(axesHelper);

            const ambientLight = new AmbientLight(0xffffff * 0.2); // soft white light
            scene.add(ambientLight);

            const directionalLight = new DirectionalLight(0xffffff, 3.0);
            directionalLight.position.set(puzzleData.width, 2, 0);
            directionalLight.lookAt(puzzleData.width / 2, 0, puzzleData.height / 2);
            directionalLight.target.position.set(puzzleData.width / 2, 0, puzzleData.height / 2);
            window.light = directionalLight;

            // directionalLight.castShadow = true;
            // directionalLight.shadow.mapSize.width = 2048; // default
            // directionalLight.shadow.mapSize.height = 2048; // default
            // directionalLight.shadow.camera.near = 0.0001; // default
            // directionalLight.shadow.camera.far = 4; // default
            // directionalLight.shadow.camera.left = -puzzleData.height*2;
            // directionalLight.shadow.camera.right = puzzleData.height*2;
            // directionalLight.shadow.camera.top = -puzzleData.width*2;
            // directionalLight.shadow.camera.bottom = puzzleData.width*2;
            // window.light = directionalLight;

            // const dhelper = new DirectionalLightHelper( directionalLight, 1 );
            // scene.add( dhelper );

            // const shelper = new CameraHelper(directionalLight.shadow.camera);
            // scene.add(shelper);

            scene.add(directionalLight);
            scene.add(directionalLight.target);

            const renderer = new WebGLRenderer({
                antialias: true,
            });
            renderer.physicallyCorrectLights = true;
            // renderer.outputEncoding = sRGBEncoding;
            // renderer.toneMapping = ReinhardToneMapping;
            // renderer.shadowMap.enabled = true;
            // renderer.shadowMap.type = BasicShadowMap;

            renderer.setSize(window.innerWidth, window.innerHeight);
            canvasDOM.appendChild(renderer.domElement);

            const pieceMaxSize = Math.min(puzzleData.pieceSize[0], puzzleData.pieceSize[1]);

            const extrudeSettings = {
                steps: 1,
                depth: (pieceMaxSize / 20),

                bevelEnabled: true,
                bevelThickness: (pieceMaxSize / 300),
                bevelSize: (pieceMaxSize / 300),
                // bevelThickness: 0,
                // bevelSize: 0,
                bevelOffset: -(pieceMaxSize / 200),
                bevelSegments: 1,
            };

            const loader = new TextureLoader();

            const planeMaterial = new MeshStandardMaterial({
                map: loader.load('/resources/wood_table/color.jpg', (map) => {
                    map.wrapS = RepeatWrapping;
                    map.wrapT = RepeatWrapping;
                    map.repeat.set(10*puzzleData.width, 10*puzzleData.height);
                    map.needsUpdate = true;
                }),
                normalMap: loader.load('/resources/wood_table/normal.jpg', (map) => {
                    map.wrapS = RepeatWrapping;
                    map.wrapT = RepeatWrapping;
                    map.repeat.set(10*puzzleData.width, 10*puzzleData.height);
                    map.needsUpdate = true;
                }),
                normalScale: new Vector2(-1,-1),
                roughnessMap: loader.load('/resources/wood_table/roughness.jpg', (map) => {
                    map.wrapS = RepeatWrapping;
                    map.wrapT = RepeatWrapping;
                    map.repeat.set(10*puzzleData.width, 10*puzzleData.height);
                    map.needsUpdate = true;
                }),
                roughness: 1.2,
            });

            const detailMap = loader.load('/resources/test_roughness.png', (map) => {
                map.wrapS = RepeatWrapping;
                map.wrapT = RepeatWrapping;
                map.repeat.set(4, 4);
                map.needsUpdate = true;
            });
            const material = new MeshStandardMaterial({
                map: loader.load(puzzleData.puzzleImage),
                roughnessMap: detailMap,
                roughness: 1.1,
                bumpMap: detailMap,
                bumpScale: 0.0002,
                // roughness: 0.45,
            });

            const fakeShadowMat = new MeshBasicMaterial({
                map: loader.load('/resources/shadowmap.png'),
                transparent: true,
                depthWrite: false,
                opacity: 0.5,
            });

            const plane = new PlaneGeometry(puzzleData.width * 3, puzzleData.height * 3);
            plane.center();
            plane.rotateX(-Math.PI / 2);
            plane.translate(puzzleData.width*1.6 / 2, -(pieceMaxSize / 20), puzzleData.height*1.6 /  2);
            const planeM = new Mesh(plane, planeMaterial);
            planeM.receiveShadow = true;
            scene.add(planeM);

            const shadowGeo = new PlaneBufferGeometry(pieceMaxSize*3, pieceMaxSize*3);

            const pieceGeometries = [];
            const pieceMeshes = [];
            let bufferOffset = 0;
            for (let i = 0; i < puzzlePaths.length; i++) {
                const puzzlePiece = puzzleData.pieces[i];
                const shape = createShape(puzzlePaths[i]);

                extrudeSettings.UVGenerator = PuzzleUVGenerator(puzzleData, i);
                const geometry = new ExtrudeBufferGeometry(shape, extrudeSettings);
                // geometry.center();
                geometry.rotateX(Math.PI / 2);
                // geometry.rotateY(MathUtils.degToRad(Math.round(Math.random() * 8) * 45));
                // geometry.translate(puzzleData.pieceSize[0] * puzzlePiece.x, 0, puzzleData.pieceSize[1] * puzzlePiece.y);
                // geometry.translate(puzzleData.pieceSize[0] * puzzlePiece.x * 1.6, 0, puzzleData.pieceSize[1] * puzzlePiece.y * 1.6);
                //geometry.translate(puzzleData.pieceSize[0] * puzzlePiece.x, 0, puzzleData.pieceSize[1] * puzzlePiece.y);

                pieceGeometries.push(geometry);

                const base = new Object3D();

                const mesh = new Mesh(geometry, material);
                // mesh.castShadow = true;
                // mesh.receiveShadow = true;
                // mesh.visible = false;
                mesh.layers.set(1);

                mesh.bufferOffset = bufferOffset;
                bufferOffset += geometry.attributes.position.count;

                mesh.position.set(-puzzleData.pieceSize[0]/2, 0, -puzzleData.pieceSize[1]/2);

                base.add(mesh);

                const shadowMesh = new Mesh(shadowGeo, fakeShadowMat);
                shadowMesh.name = 'shadow';
                shadowMesh.rotateX(-Math.PI / 2);
                shadowMesh.position.set(pieceMaxSize/2 - puzzleData.pieceSize[0]/2, -0.0095, pieceMaxSize/2 - puzzleData.pieceSize[1]/2);
                shadowMesh.visible = false;

                base.add(shadowMesh);
                // base.layers.set(1);

                base.rotateY(MathUtils.degToRad(Math.round(Math.random() * 8) * 45));
                base.position.set(puzzleData.pieceSize[0] * puzzlePiece.x * 1.6, 0, puzzleData.pieceSize[1] * puzzlePiece.y * 1.6);
                // base.position.set(puzzleData.pieceSize[0] * puzzlePiece.x, 0, puzzleData.pieceSize[1] * puzzlePiece.y);

                scene.add(base);
                pieceMeshes.push(base);
            }

            const dot = new SphereGeometry(0.002);
            const raycastMat = new MeshStandardMaterial({
                color: 0xff0000,
            });
            const raycastPoint = new Mesh(dot, raycastMat);
            raycastPoint.renderOrder = 1;
            raycastPoint.visible = false;
            scene.add(raycastPoint);

            // console.time('merge');
            // const merged = BufferGeometryUtils.mergeBufferGeometries(pieceGeometries);
            // console.timeEnd('merge');
            // console.time('newmesh');
            // const allMesh = new Mesh(merged, material);
            // allMesh.castShadow = true;
            // scene.add(allMesh);
            // console.timeEnd('newmesh');

            const controls = new OrbitControls(camera, renderer.domElement);
            // controls.enableRotate = false;
            controls.enableKeys = true;
            controls.keyPanSpeed = 20;
            controls.keys = {
                LEFT: 65, //left arrow
                UP: 87, // up arrow
                RIGHT: 68, // right arrow
                BOTTOM: 83 // down arrow
            };
            //controls.update() must be called after any manual changes to the camera's transform
            camera.position.set(0, 1, 0);
            camera.lookAt(0, 0, 0);
            controls.update();

            let hasChanged = false;
            let lastTime = 0;

            let currentObject = 0;
            let currentTime = 0;
            let curTrans = new Vector3(-1 + Math.random() * 2, 0, -1 + Math.random() * 2);
            function animate(time) {
                if (lastTime === 0) lastTime = time;
                const delta = time - lastTime;
                lastTime = time;

                requestAnimationFrame(animate);

                // currentTime += delta;
                // if (currentTime > 60) { // switch to other object after 5 seconds
                //     currentTime = 0;
                //     console.time('update mesh');
                //     // hide old piece, merge back into geometry array
                //     const oldMesh = pieceMeshes[currentObject];
                //     oldMesh.visible = false;
                //     oldMesh.updateMatrix(); 
                //     oldMesh.geometry.applyMatrix4( oldMesh.matrix );
                //     oldMesh.matrix.identity();
                //     oldMesh.position.set( 0, 0, 0 );
                //     // update allMesh position
                //     const oldArray = oldMesh.geometry.attributes.position.array;
                //     const offset = oldMesh.bufferOffset;
                //     const allArray = allMesh.geometry.attributes.position.array;
                //     let i = 0;
                //     while (i < oldArray.length) {
                //         allArray[(i)+(offset*3)] = oldArray[i];
                //         allArray[(i+1)+(offset*3)] = oldArray[i+1];
                //         allArray[(i+2)+(offset*3)] = oldArray[i+2];
                //         i+=3;
                //     }
                //     // set new piece, transforms, etc.
                //     curTrans = new Vector3(-1 + Math.random()*2, 0, -1 + Math.random()*2);
                //     if (currentObject+1 > pieceMeshes.length-1) {
                //         currentObject = -1;
                //     }
                //     currentObject++;
                //     pieceMeshes[currentObject].visible = true;
                //     // set all vertices for current piece in allMesh to 0 (will not be visible)
                //     i = pieceMeshes[currentObject].bufferOffset*3;
                //     const endP = pieceMeshes[currentObject].bufferOffset*3 + pieceMeshes[currentObject].geometry.attributes.position.count*3;
                //     while (i < endP) {
                //         allArray[i] = 0;
                //         allArray[i+1] = 0;
                //         allArray[i+2] = 0;
                //         i+=3;
                //     }
                //     allMesh.geometry.attributes.position.needsUpdate = true;
                //     console.timeEnd('update mesh');
                // }
                // pieceMeshes[currentObject].translateOnAxis(curTrans, delta*0.5);
                // hasChanged = true;

                raycaster.setFromCamera(mouse, camera);
                const intersects = raycaster.intersectObjects(scene.children, true);
                if (intersects.length > 0) {
                    raycastPoint.position.set(intersects[0].point.x, intersects[0].point.y, intersects[0].point.z);
                    // console.log(mouse, intersects[0]);
                    if (pickupDown && pickedObject === null) {
                        pickedObject = intersects[0].object.parent;
                        pickedObject.children[1].visible = true;
                        pickedObject.translateY(0.01);
                    }
                }

                if (!pickupDown && pickedObject !== null) {
                    pickedObject.translateY(-0.01);
                    pickedObject.children[1].visible = false;
                    pickedObject = null;
                }


                hasChanged = true;
                if (hasChanged) {
                    renderer.render(scene, camera);
                }
                hasChanged = false;
            }
            controls.addEventListener('change', () => {
                hasChanged = true;
            });
            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        },
        onremove: () => {

        },
        view: function () {
            return m('.puzzle-canvas');
        },
    };
};