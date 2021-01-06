import './style.scss';

import m from 'mithril';
import { store } from 'client/store';
import {
    Scene,
    PerspectiveCamera,
    WebGLRenderer,
    Mesh,
    Shape,
    Vector2,
    OrthographicCamera,
    TextureLoader,
    MeshStandardMaterial,
    AmbientLight,
    DirectionalLight,
    MathUtils,
    PlaneGeometry,
    Vector3,
    ExtrudeBufferGeometry,
    WireframeGeometry,
    LineSegments,
    Raycaster,
    Geometry,
    SphereGeometry,
    RepeatWrapping,
    MeshBasicMaterial,
    PlaneBufferGeometry,
    PMREMGenerator,
    MOUSE,
    BackSide,
    NeverDepth,
    LineBasicMaterial,
    AudioListener,
    Audio,
    AudioLoader,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
    createNeighbourOffsets,
    generatePuzzlePaths,
    NEIGHBOUR_SIDES,
} from 'client/lib/puzzle/puzzle-utils';
import {
    createShapeFromPath,
    createSpawnPositionsOutsideArea,
} from 'client/lib/engine/engine-utils';
import { SimpleExtrudeBufferGeometry } from '../../../lib/engine/SimpleExtrudeBufferGeometry';
import {
    setTargetPositionGroup,
    TweenObject,
} from 'client/lib/engine/game/TweenObject';
import { updateGlobalTime } from 'client/lib/engine/game/GlobalTime';
import { GameObject } from 'client/lib/engine/game/GameObject';
import { LayerDefintion } from 'client/lib/engine/layers';

const PuzzleUVGenerator = (puzzleData, i) => {
    // console.log(puzzleData, i);

    const { pieceSize, width, height } = puzzleData;
    const piece = puzzleData.pieces[i];

    const x = pieceSize[0] * piece.x;
    const y = pieceSize[1] * piece.y;

    return {
        generateTopUV: function(geometry, vertices, indexA, indexB, indexC) {
            const a_x = (vertices[indexA * 3] + x) / width;
            const a_y = (height - (vertices[indexA * 3 + 1] + y)) / height;
            const b_x = (vertices[indexB * 3] + x) / width;
            const b_y = (height - (vertices[indexB * 3 + 1] + y)) / height;
            const c_x = (vertices[indexC * 3] + x) / width;
            const c_y = (height - (vertices[indexC * 3 + 1] + y)) / height;

            return [
                new Vector2(a_x, a_y),
                new Vector2(b_x, b_y),
                new Vector2(c_x, c_y),
            ];
        },

        generateSideWallUV: function() {
            const nullVec = new Vector2(0, 1);
            return [nullVec, nullVec, nullVec, nullVec];
        },
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
                mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            }

            window.addEventListener('pointermove', onMouseMove);

            let pickupDown = false;
            let pickedObject = [];
            let grabOffset = new Vector2();

            function key(k, isDown) {
                // if (k.toLowerCase() === 'f') pickupDown = isDown;
                if (k === 0) pickupDown = isDown;
            }

            window.addEventListener('pointerdown', (e) => key(e.button, true));
            window.addEventListener('pointerup', (e) => key(e.button, false));

            const scene = new Scene();
            const camera = new PerspectiveCamera(
                50,
                window.innerWidth / window.innerHeight,
                0.001,
                500,
            );
            camera.layers.enableAll();
            // camera.layers.enable(0);
            // camera.layers.enable(1);
            // const camera = new OrthographicCamera(window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 0.01, 1000);

            const listener = new AudioListener();
            camera.add(listener);
            const clickSound = new Audio(listener);
            // load a sound and set it as the Audio object's buffer
            const audioLoader = new AudioLoader();
            audioLoader.load('resources/snap.ogg', function(buffer) {
                clickSound.setBuffer(buffer);
                // sound.setLoop( true );
                clickSound.setVolume(0.5);
            });

            const directionalLight = new DirectionalLight(0xffffff, 1.25);
            directionalLight.position.set(puzzleData.width, 2, 0);
            directionalLight.lookAt(
                puzzleData.width / 2,
                0,
                puzzleData.height / 2,
            );
            directionalLight.target.position.set(
                puzzleData.width / 2,
                0,
                puzzleData.height / 2,
            );
            window.light = directionalLight;

            scene.add(directionalLight);
            scene.add(directionalLight.target);

            const renderer = new WebGLRenderer({
                antialias: true,
            });
            renderer.physicallyCorrectLights = true;
            window.renderer = renderer;

            renderer.setSize(window.innerWidth, window.innerHeight);
            canvasDOM.appendChild(renderer.domElement);

            const pmremGenerator = new PMREMGenerator(renderer);
            pmremGenerator.compileEquirectangularShader();

            const pieceMaxSize = Math.min(
                puzzleData.pieceSize[0],
                puzzleData.pieceSize[1],
            );

            const extrudeSettings = {
                steps: 1,
                depth: pieceMaxSize / 20,
                offset: -(pieceMaxSize / 400),
            };

            const loader = new TextureLoader();

            const planeMaterial = new MeshStandardMaterial({
                map: loader.load('/resources/felt/color.jpg', (map) => {
                    map.wrapS = RepeatWrapping;
                    map.wrapT = RepeatWrapping;
                    map.repeat.set(
                        20 * puzzleData.width,
                        20 * puzzleData.height,
                    );
                    map.needsUpdate = true;
                }),
                normalMap: loader.load('/resources/felt/normal.jpg', (map) => {
                    map.wrapS = RepeatWrapping;
                    map.wrapT = RepeatWrapping;
                    map.repeat.set(
                        20 * puzzleData.width,
                        20 * puzzleData.height,
                    );
                    map.needsUpdate = true;
                }),
                // normalScale: new Vector2(-1, -1),
                roughnessMap: loader.load(
                    '/resources/felt/roughness.jpg',
                    (map) => {
                        map.wrapS = RepeatWrapping;
                        map.wrapT = RepeatWrapping;
                        map.repeat.set(
                            20 * puzzleData.width,
                            20 * puzzleData.height,
                        );
                        map.needsUpdate = true;
                    },
                ),
                color: 0x4d4d4d,
            });
            window.felt = planeMaterial;

            const detailMap = loader.load(
                '/resources/test_roughness.jpg',
                (map) => {
                    map.wrapS = RepeatWrapping;
                    map.wrapT = RepeatWrapping;
                    map.repeat.set(4, 4);
                    map.needsUpdate = true;
                },
            );
            const material = new MeshStandardMaterial({
                map: loader.load(puzzleData.puzzleImage),
                roughnessMap: detailMap,
                roughness: 0.98,
                bumpMap: detailMap,
                bumpScale: 0.0002,
            });

            const outlineMat = new MeshBasicMaterial({
                color: 0xff0000,
                side: BackSide,
            });

            loader.load('/resources/envmap.jpg', (map) => {
                const envmap = pmremGenerator.fromEquirectangular(map).texture;
                scene.background = envmap;
                scene.environment = envmap;

                map.dispose();
                pmremGenerator.dispose();
            });

            const fakeShadowMat = new MeshBasicMaterial({
                map: loader.load('/resources/shadowmap.png'),
                transparent: true,
                depthWrite: false,
                side: BackSide,
                opacity: 0.5,
            });
            const fakeFullShadowMat = new MeshBasicMaterial({
                transparent: true,
                // depthWrite: false,
                opacity: 0.4,
                color: 0x000000,
                depthFunc: NeverDepth,
            });

            const plane = new PlaneGeometry(
                puzzleData.width * 6,
                puzzleData.height * 6,
            );
            plane.center();
            plane.rotateX(-Math.PI / 2);
            plane.translate(
                (puzzleData.width * 2.2) / 3,
                -(pieceMaxSize / 20),
                (puzzleData.height * 2.2) / 3,
            );
            const planeM = new Mesh(plane, planeMaterial);
            planeM.receiveShadow = true;
            scene.add(planeM);

            const shadowGeo = new PlaneBufferGeometry(
                pieceMaxSize * 3,
                pieceMaxSize * 3,
            );

            const lastPiece = puzzleData.pieces[puzzleData.pieces.length - 1];
            const validPositions = createSpawnPositionsOutsideArea(
                0,
                0,
                lastPiece.x,
                lastPiece.y,
                puzzleData.pieces.length,
            ).map((p) => {
                return new Vector3(
                    puzzleData.pieceSize[0] * p.x * 1.6,
                    0,
                    puzzleData.pieceSize[1] * p.y * 1.6,
                );
            });

            const neighbourOffsets = createNeighbourOffsets(
                puzzleData.pieceSize[0],
                puzzleData.pieceSize[1],
            );
            const pieceGeometries = [];
            const pieceMeshes = [];
            let bufferOffset = 0;
            for (let i = 0; i < puzzlePaths.length; i++) {
                const puzzlePiece = puzzleData.pieces[i];
                const shape = createShapeFromPath(puzzlePaths[i]);

                extrudeSettings.UVGenerator = PuzzleUVGenerator(puzzleData, i);
                const geometry = new SimpleExtrudeBufferGeometry(
                    shape,
                    extrudeSettings,
                );
                // geometry.center();
                geometry.rotateX(Math.PI / 2);
                // geometry.rotateY(MathUtils.degToRad(Math.round(Math.random() * 8) * 45));

                pieceGeometries.push(geometry);

                const outlineGeo = new SimpleExtrudeBufferGeometry(
                    shape,
                    {
                        ...extrudeSettings,
                        offset: pieceMaxSize / 100,
                        depth: pieceMaxSize / 15,
                    },
                );
                outlineGeo.rotateX(Math.PI / 2);
                const outlineMesh = new Mesh(outlineGeo, outlineMat);
                outlineMesh.name = 'outline';
                outlineMesh.position.set(
                    -puzzleData.pieceSize[0] / 2,
                    pieceMaxSize / 100,
                    -puzzleData.pieceSize[1] / 2,
                );
                outlineMesh.visible = false;

                // const shadowMesh = new Mesh(shadowGeo, fakeShadowMat);
                const shadowMesh = new Mesh(geometry, fakeFullShadowMat);
                shadowMesh.name = 'shadow';
                // shadowMesh.rotateX(-Math.PI / 2);
                // shadowMesh.position.set(pieceMaxSize / 2 - puzzleData.pieceSize[0] / 2, -0.0098, pieceMaxSize / 2 - puzzleData.pieceSize[1] / 2);
                shadowMesh.position.set(
                    -puzzleData.pieceSize[0] / 2,
                    -0.0099,
                    -puzzleData.pieceSize[1] / 2,
                );
                shadowMesh.visible = false;

                const base = new GameObject({
                    selectMesh: outlineMesh,
                    shadowMesh: shadowMesh,
                });

                const mesh = new Mesh(geometry, material);
                // mesh.castShadow = true;
                // mesh.receiveShadow = true;
                // mesh.visible = false;
                mesh.layers.set(1);

                mesh.bufferOffset = bufferOffset;
                bufferOffset += geometry.attributes.position.count;

                mesh.position.set(
                    -puzzleData.pieceSize[0] / 2,
                    0,
                    -puzzleData.pieceSize[1] / 2,
                );

                base.add(mesh);

                base.puzzleInfo = puzzlePiece;
                // base.layers.set(1);

                // base.rotateY(MathUtils.degToRad(Math.round(Math.random() * 8) * 45));
                // base.position.set(puzzleData.pieceSize[0] * puzzlePiece.x * 1.6, 0, puzzleData.pieceSize[1] * puzzlePiece.y * 1.6);
                // base.position.set(puzzleData.pieceSize[0] * puzzlePiece.x, 0, puzzleData.pieceSize[1] * puzzlePiece.y);
                const pos = validPositions.splice(
                    Math.floor(Math.random() * validPositions.length),
                    1,
                )[0];
                // base.position.set(pos.x, pos.y, pos.z);
                base.position.copy(pos);
                // console.log(base.position);

                scene.add(base);
                pieceMeshes.push(base);
            }
            console.log(pieceMeshes[0]);

            const dot = new SphereGeometry(0.002);
            const raycastMat = new MeshBasicMaterial({
                color: 0xff0000,
            });
            const raycastPoint = new Mesh(dot, raycastMat);
            // raycastPoint.position.set(0,0.1,0);
            raycastPoint.layers.set(9);
            raycastPoint.visible = false;
            scene.add(raycastPoint);

            const connectGeo = new Geometry();
            const nullVec = new Vector3(0, 0, 0);
            connectGeo.vertices.push(
                nullVec,
                nullVec,
                nullVec,
                nullVec,
                nullVec,
                nullVec,
                nullVec,
                nullVec,
            );
            connectGeo.verticesNeedUpdate = true;
            const connectMat = new LineBasicMaterial({
                color: 0x00ff00,
                // depthTest: false,
                // depthWrite: false,
            });
            const connectLine = new LineSegments(connectGeo, connectMat);
            connectLine.name = 'Meine Line';
            connectLine.layers.set(9);
            connectLine.frustumCulled = false;
            scene.add(connectLine);

            // console.time('merge');
            // const merged = BufferGeometryUtils.mergeBufferGeometries(pieceGeometries);
            // console.timeEnd('merge');
            // console.time('newmesh');
            // const allMesh = new Mesh(merged, material);
            // allMesh.castShadow = true;
            // scene.add(allMesh);
            // console.timeEnd('newmesh');

            const controls = new OrbitControls(camera, renderer.domElement);
            window.controls = controls;
            // controls.enableRotate = false;
            controls.maxPolarAngle = Math.PI / 2.1;
            controls.maxDistance = 3;
            controls.minDistance = 0.05;
            controls.zoomSpeed = 2;
            controls.screenSpacePanning = false;
            controls.enableKeys = true;
            controls.keyPanSpeed = 20;
            controls.keys = {
                LEFT: 65, //left arrow
                UP: 87, // up arrow
                RIGHT: 68, // right arrow
                BOTTOM: 83, // down arrow
            };
            controls.mouseButtons = {
                MIDDLE: MOUSE.ROTATE,
                RIGHT: MOUSE.PAN,
                // MIDDLE: THREE.MOUSE.DOLLY,
            };
            //controls.update() must be called after any manual changes to the camera's transform
            camera.position.set(0, 1, 0);
            camera.lookAt(0, 0, 0);
            controls.update();

            let hasChanged = false;
            let lastTime = 0;

            let currentObject = 0;
            let currentTime = 0;
            let curTrans = new Vector3(
                -1 + Math.random() * 2,
                0,
                -1 + Math.random() * 2,
            );

            // let delta100Ticks = 0;
            // let tickCount = 0;
            function animate(time) {
                const d = updateGlobalTime(time);
                // const tickStartTime = performance.now();
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

                scene.traverse(obj => {
                    (obj instanceof GameObject || obj instanceof TweenObject) ? obj.tick() : false;
                });

                raycaster.setFromCamera(mouse, camera);

                // cast for virtual mouse pointer
                if (pickedObject.length === 0) {
                    raycaster.layers.enableAll();
                    raycaster.layers.disable(LayerDefintion.IGNORE_RAYCAST);
                    const intersect = raycaster.intersectObjects(
                        scene.children,
                        true,
                    )[0];
                    if (intersect) {
                        raycastPoint.position.copy(intersect.point);
                        // console.log(raycastPoint.position);
                    }
                }

                // cast for picking up objects
                if (pickedObject.length === 0) {
                    raycaster.layers.set(1);
                    const intersects = raycaster.intersectObjects(
                        scene.children,
                        true,
                    );
                    if (intersects.length > 0) {
                        // raycastPoint.position.copy(intersects[0].point);
                        // console.log(mouse, intersects[0]);
                        if (pickupDown) {
                            const gObj = intersects[0].object.parent;
                            pickedObject = gObj.select();
                            grabOffset.set(
                                intersects[0].point.x - pickedObject[0].position.x,
                                intersects[0].point.z - pickedObject[0].position.z,
                            );
                            setTargetPositionGroup(pickedObject, 'position', pickedObject[0].position, pickedObject[0].position.clone().add(new Vector3(0, 0.01, 0)));
                        }
                    }
                }

                // we're actively dragging an object
                if (pickupDown && pickedObject.length > 0) {
                    raycaster.layers.set(0);
                    const intersection = raycaster.intersectObject(planeM)[0];
                    if (intersection) {
                        const point = intersection.point;

                        const targetVec = new Vector3(
                            point.x - grabOffset.x,
                            0.01,
                            point.z - grabOffset.y,
                        );
                        setTargetPositionGroup(pickedObject, 'position', pickedObject[0].position, targetVec);

                        // debug neighbours
                        // connectLine.geometry.vertices = [];
                        // for (let i = 0; i < pickedObject.puzzleInfo.neighbours.length; i++) {
                        //     const neighbourNo = pickedObject.puzzleInfo.neighbours[i];
                        //     if (neighbourNo < 0) {
                        //         connectLine.geometry.vertices.push(nullVec, nullVec);
                        //     } else {
                        //         const neighbour = pieceMeshes[neighbourNo];
                        //         const selfOffset = NEIGHBOUR_OFFSETS[i];
                        //         const neighbourOffset = (NEIGHBOUR_OFFSETS[(i + 2) % 4]);
                        //         // console.log(selfOffset, neighbourOffset);
                        //         connectLine.geometry.vertices.push(pickedObject.position.clone().setY(0.003).add(selfOffset), neighbour.position.clone().setY(0.003).add(neighbourOffset));
                        //     }
                        // }
                        // connectLine.geometry.verticesNeedUpdate = true;
                    }
                }

                // we stopped dragging an object
                if (!pickupDown && pickedObject.length > 0) {
                    console.log(pickedObject);

                    const targetVec = new Vector3(
                        pickedObject[0].position.x,
                        0.0,
                        pickedObject[0].position.z,
                    );
                    setTargetPositionGroup(pickedObject, 'targetPosition', pickedObject[0].position, targetVec);

                    pickedObject.forEach(o => o.unselect());

                    pickedObject.forEach(gObj => {
                        for (
                            let i = 0;
                            i < gObj.puzzleInfo.neighbours.length;
                            i++
                        ) {
                            const neighbourNo =
                                gObj.puzzleInfo.neighbours[i];
                            if (neighbourNo < 0) {
                                continue;
                            }


                            const neighbour = pieceMeshes[neighbourNo];
                            const selfOffset = neighbourOffsets[i];
                            const neighbourOffset = neighbourOffsets[(i + 2) % 4];

                            if (gObj.sameGroup(neighbour)) {
                                console.log('already sharing a group!');
                                continue;
                            }

                            const selfPos = gObj.targetPosition
                                .clone()
                                .add(selfOffset);
                            const neighbourPos = (neighbour.targetPosition ? neighbour.targetPosition : neighbour.position)
                                .clone()
                                .add(neighbourOffset);
                            const distance = selfPos.distanceTo(neighbourPos);
                            //@todo: iterate through all neighbours distances, closest distance wins snapping
                            //@todo: figure out what to do here ... :shrug:

                            console.log('NEIGHBOUR CHECK DISTANCE', distance);

                            if (distance < selfOffset.length() / 2) {
                                gObj.addGroup(neighbour);
                                clickSound.play();
                                console.log(
                                    '*CLICK*',
                                    NEIGHBOUR_SIDES.getSideName(i),
                                    distance,
                                );
                                const newPos = (neighbour.targetPosition ? neighbour.targetPosition : neighbour.position)
                                    .clone()
                                    .add(neighbourOffset)
                                    .sub(selfOffset);

                                setTargetPositionGroup(pickedObject, 'position', gObj.position, newPos);
                                break;
                            }
                        }
                    });


                    pickedObject = [];

                    connectLine.geometry.vertices = [
                        nullVec,
                        nullVec,
                        nullVec,
                        nullVec,
                        nullVec,
                        nullVec,
                        nullVec,
                        nullVec,
                    ];
                    connectLine.geometry.verticesNeedUpdate = true;
                }

                hasChanged = true;
                if (hasChanged) {
                    renderer.render(scene, camera);
                }
                hasChanged = false;
                //
                // const tickEndTime = performance.now();
                // delta100Ticks += tickEndTime - tickStartTime;
                // tickCount++;
                // if (tickCount >= 100) {
                //     console.log('last 100 ticks avg', delta100Ticks/100,'ms');
                //     delta100Ticks = 0;
                //     tickCount = 0;
                // }

            }

            controls.addEventListener('change', () => {
                hasChanged = true;
            });
            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        },
        onremove: () => {
        },
        view: function() {
            return m('.puzzle-canvas');
        },
    };
};
