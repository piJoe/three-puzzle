import './style.scss';

import m from 'mithril';
import { store } from 'client/store';
import {
    Scene,
    PerspectiveCamera,
    WebGLRenderer,
    Mesh,
    Vector2,
    TextureLoader,
    MeshStandardMaterial,
    DirectionalLight,
    PlaneGeometry,
    Vector3,
    LineSegments,
    Raycaster,
    Geometry,
    SphereGeometry,
    RepeatWrapping,
    MeshBasicMaterial,
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
    createNeighbourOffsets, generatePuzzleBoxTexture,
    generatePuzzlePaths,
    NEIGHBOUR_SIDES,
} from 'client/lib/puzzle/puzzle-utils';
import {
    createShapeFromPath,
    createSpawnPositionsOutsideArea,
} from 'client/lib/engine/engine-utils';
import {
    setTargetPositionGroup,
    TweenObject,
} from 'client/lib/engine/game/TweenObject';
import { updateGlobalTime } from 'client/lib/engine/game/GlobalTime';
import { LayerDefintion } from 'client/lib/engine/layers';
import { GameObjectMesh } from 'client/lib/engine/game/GameObjectMesh';
import { MergeGameObjectGroup } from 'client/lib/engine/game/MergeGameObjectGroup';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { includes } from 'ramda';
import { UVBoxBufferGeometry } from 'client/lib/engine/UVBoxBufferGeometry';
import { PuzzlePiece } from 'client/lib/engine/game/puzzle/PuzzlePiece';
import { OutlinePass } from 'client/lib/engine/render-passes/OutlinePass';

export const PuzzleRenderPage = function PuzzleRenderPage() {
    return {
        oncreate: (vnode) => {
            const canvasDOM = vnode.dom.querySelector('.game-canvas');
            console.log(vnode.dom);


            const puzzleData = store.puzzleData;
            const puzzlePaths = generatePuzzlePaths(puzzleData);
            puzzleData.pieces.forEach((p, idx) => {
                const path = puzzlePaths[idx];
                p.shape = createShapeFromPath(path);
            });
            // console.log(puzzlePaths);

            const raycaster = new Raycaster();
            raycaster.layers.enableAll();
            raycaster.layers.disable(LayerDefintion.IGNORE_RAYCAST);

            const camera = new PerspectiveCamera(
                50,
                window.innerWidth / window.innerHeight,
                0.001,
                500,
            );
            camera.layers.enableAll();
            camera.layers.disable(LayerDefintion.INVISIBLE);

            const mouse = new Vector3(0, 0, 0.5);

            const mouseVec = new Vector3(0, 0, 0);
            const mousePos = new Vector3(0, 0, 0);
            const cameraWorldPos = new Vector3();

            const pickHeight = 0.01;

            const gCursor = vnode.dom.querySelector('.game-cursor');
            const cursorPos = new Vector2();
            function onMouseMove(event) {
                mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
                mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

                //@todo: check unprojection (probably needs to be referenced by WORLD position AND rotation)
                camera.getWorldPosition(cameraWorldPos);
                mouseVec.set(
                    mouse.x,
                    mouse.y,
                    0.5,
                ).unproject(camera);
                mouseVec.sub(cameraWorldPos).normalize();

                //@todo: should be .z for camerapos and mouseVec
                const distance = (pickHeight - cameraWorldPos.y) / mouseVec.y;
                mousePos.copy(cameraWorldPos).add(mouseVec.multiplyScalar(distance));

                cursorPos.set(event.clientX, event.clientY);
            }

            window.addEventListener('pointermove', onMouseMove);

            let pickupDown = false;
            let pickedObject = [];
            let grabOffset = new Vector2();

            function key(k, isDown) {
                if (k === 0) pickupDown = isDown;
            }

            window.addEventListener('pointerdown', (e) => key(e.button, true));
            window.addEventListener('pointerup', (e) => key(e.button, false));

            const scene = new Scene();
            window.scene = scene; // @todo: make proper global module from this

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
            window.addEventListener('resize', (e) => {
                renderer.setSize(window.innerWidth, window.innerHeight);
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
            });
            canvasDOM.appendChild(renderer.domElement);

            const composer = new EffectComposer(renderer);
            // const renderPass = new RenderPass(scene, camera);
            // composer.addPass(renderPass);
            // const saoPass = new SAOPass( scene, camera, false, true );
            // saoPass.params = {
            //     ...saoPass.params,
            //     saoBlurRadius: 2,
            //     saoBlurStdDev: 2,
            //     saoIntensity: 0.006,
            //     saoKernelRadius: 4,
            //     saoScale: 2,
            // };
            // composer.addPass( saoPass );
            const outlinePass = new OutlinePass(scene, camera, []);
            composer.addPass(outlinePass);

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

            // const detailMap = loader.load(
            //     '/resources/test_roughness_2.png',
            //     (map) => {
            //         map.wrapS = RepeatWrapping;
            //         map.wrapT = RepeatWrapping;
            //         map.repeat.set(64,64);
            //         map.needsUpdate = true;
            //     },
            // );
            // const detailBumpMap = loader.load(
            //     '/resources/test_bump_2.png',
            //     (map) => {
            //         map.wrapS = RepeatWrapping;
            //         map.wrapT = RepeatWrapping;
            //         map.repeat.set(64,64);
            //         map.needsUpdate = true;
            //     },
            // );

            const boxMaterial = new MeshStandardMaterial({});
            const boxDepth = Math.max(0.03, Math.min(0.07, puzzleData.pieces.length / 10000));

            const puzzleTexture = loader.load(puzzleData.puzzleImage, async (map) => {
                const boxImage = await generatePuzzleBoxTexture(puzzleData, map.image, new Vector3(puzzleData.width, puzzleData.height, boxDepth));
                boxMaterial.map = loader.load(boxImage);
                boxMaterial.needsUpdate = true;
            });

            const material = new MeshStandardMaterial({
                map: puzzleTexture,
                // roughnessMap: detailMap,
                roughness: 0.9,
                // bumpMap: detailBumpMap,
                bumpScale: 0.0001,
            });

            const outlineMat = new MeshBasicMaterial({
                color: 0xff0000,
                side: BackSide,
                depthWrite: false,
            });

            loader.load('/resources/envmap.jpg', (map) => {
                const envmap = pmremGenerator.fromEquirectangular(map).texture;
                scene.background = envmap;
                scene.environment = envmap;

                map.dispose();
                pmremGenerator.dispose();
            });

            const fakeFullShadowMat = new MeshBasicMaterial({
                transparent: true,
                depthWrite: false,
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
                -(0.0014),
                (puzzleData.height * 2.2) / 3,
            );
            const planeM = new Mesh(plane, planeMaterial);
            planeM.receiveShadow = true;
            scene.add(planeM);

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

            const puzzleBoxGeo = new UVBoxBufferGeometry(puzzleData.width, puzzleData.height, boxDepth);
            puzzleBoxGeo.center();
            puzzleBoxGeo.rotateX(-Math.PI / 2);
            const puzzleBox = new GameObjectMesh(puzzleBoxGeo, boxMaterial);
            const boxPos = new Vector3(lastPiece.x * puzzleData.pieceSize[0] * 1.6 / 2, boxDepth / 2, lastPiece.y * puzzleData.pieceSize[1] * 1.6 / 2);
            puzzleBox.position.copy(boxPos);
            puzzleBox.targetPosition.copy(boxPos);
            // scene.add(puzzleBox);

            const neighbourOffsets = createNeighbourOffsets(
                puzzleData.pieceSize[0],
                puzzleData.pieceSize[1],
            );
            const pieceMeshes = [];
            updateGlobalTime(performance.now());

            const mergeGroup = new MergeGameObjectGroup(material);
            scene.add(mergeGroup);
            puzzleData.mergeGroup = mergeGroup;

            for (let i = 0; i < puzzleData.pieces.length; i++) {
                const base = new PuzzlePiece(puzzleData, i);

                const puzzlePiece = puzzleData.pieces[i];
                base.puzzleInfo = puzzlePiece;
                // base.layers.set(1);

                // base.rotateY(MathUtils.degToRad(Math.round(Math.random() * 8) * 45));
                // base.position.set(puzzleData.pieceSize[0] * puzzlePiece.x * 1.6, 0, puzzleData.pieceSize[1] * puzzlePiece.y * 1.6);
                const pos = new Vector3(puzzleData.pieceSize[0] * puzzlePiece.x, 0, puzzleData.pieceSize[1] * puzzlePiece.y);
                // const pos = validPositions.splice(
                //     Math.floor(Math.random() * validPositions.length),
                //     1,
                // )[0];
                base.position.copy(pos);
                base.targetPosition.copy(pos);
                // console.log(base.position);

                // scene.add(base);
                pieceMeshes.push(base);
            }

            let onlyCorner = false;
            window.toggleInnerPieces = function() {
                onlyCorner = !onlyCorner;
                pieceMeshes.forEach(p => {
                    const isCornerPiece = includes(-1, p.puzzleInfo.neighbours);
                    if (!isCornerPiece && p.visible === false) {
                        onlyCorner ? mergeGroup.hideVertices(p) : mergeGroup.updateVertices(p);
                    }
                });
            };

            const dot = new SphereGeometry(0.002);
            const raycastMat = new MeshBasicMaterial({
                color: 0xff0000,
            });
            const raycastPoint = new Mesh(dot, raycastMat);
            // raycastPoint.position.set(0,0.1,0);
            raycastPoint.layers.set(LayerDefintion.IGNORE_RAYCAST);
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
            connectLine.layers.set(LayerDefintion.IGNORE_RAYCAST);
            connectLine.frustumCulled = false;
            scene.add(connectLine);

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

            let delta100Ticks = 0;
            let tickCount = 0;

            function animate(time) {
                updateGlobalTime(time);
                const tickStartTime = performance.now();

                requestAnimationFrame(animate);

                raycaster.setFromCamera(mouse, camera);

                // cast for virtual mouse pointer
                // if (pickedObject.length === 0) {
                //     raycaster.layers.enableAll();
                //     raycaster.layers.disable(LayerDefintion.IGNORE_RAYCAST);
                //     const intersect = raycaster.intersectObjects(
                //         scene.children,
                //         true,
                //     )[0];
                //     if (intersect) {
                //         raycastPoint.position.copy(intersect.point);
                //         // console.log(raycastPoint.position);
                //     }
                // }

                // cast for picking up objects
                if (pickedObject.length === 0) {
                    if (pickupDown) {
                        raycaster.layers.set(LayerDefintion.INTERACTABLE);
                        const intersects = raycaster.intersectObjects(
                            pieceMeshes,
                        );
                        console.log(intersects);
                        if (intersects.length > 0) {
                            // raycastPoint.position.copy(intersects[0].point);
                            // console.log(mouse, intersects[0]);
                            const gObj = intersects[0].object;
                            pickedObject = gObj.select();
                            outlinePass.outlinedObjects = pickedObject;
                            // grabOffset.set(
                            //     intersects[0].point.x - pickedObject[0].position.x,
                            //     intersects[0].point.z - pickedObject[0].position.z,
                            // );
                            grabOffset.set(
                                mousePos.x - pickedObject[0].position.x,
                                mousePos.z - pickedObject[0].position.z,
                            );
                            pickedObject.forEach(o => {
                                o.onPickUp();
                            });
                            setTargetPositionGroup(
                                pickedObject,
                                'targetPosition',
                                pickedObject[0].targetPosition,
                                pickedObject[0].targetPosition.clone().add(new Vector3(0, 0.01, 0)),
                                150);
                        }
                    }
                }

                // we're actively dragging an object
                if (pickupDown && pickedObject.length > 0) {
                    raycaster.layers.set(LayerDefintion.DEFAULT);
                    const intersection = raycaster.intersectObject(planeM)[0];
                    if (intersection) {
                        const point = intersection.point;

                        // const targetVec = new Vector3(
                        //     point.x - grabOffset.x,
                        //     0.01,
                        //     point.z - grabOffset.y,
                        // );
                        const targetVec = new Vector3(
                            mousePos.x - grabOffset.x,
                            0.01,
                            mousePos.z - grabOffset.y,
                        );
                        setTargetPositionGroup(pickedObject, 'targetPosition', pickedObject[0].targetPosition, targetVec, 0);

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
                    const targetVec = new Vector3(
                        pickedObject[0].targetPosition.x,
                        0.0,
                        pickedObject[0].targetPosition.z,
                    );
                    setTargetPositionGroup(pickedObject, 'targetPosition', pickedObject[0].targetPosition, targetVec, 80);

                    pickedObject.forEach(o => o.unselect());
                    pickedObject.forEach(o => o.onDrop());

                    pickedObject.filter(gObj => gObj instanceof PuzzlePiece).forEach(gObj => {
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
                    outlinePass.outlinedObjects = pickedObject;

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

                scene.traverse(obj => {
                    (obj instanceof TweenObject || obj instanceof MergeGameObjectGroup) ? obj.tick() : false;
                });
                composer.render();

                gCursor.style.top = `${cursorPos.y}px`;
                gCursor.style.left = `${cursorPos.x}px`;

                const tickEndTime = performance.now();
                delta100Ticks += tickEndTime - tickStartTime;
                tickCount++;
                if (tickCount >= 100) {
                    // console.log('last 100 ticks avg', delta100Ticks / 100, 'ms');
                    delta100Ticks = 0;
                    tickCount = 0;
                }

            }

            renderer.render(scene, camera);
            composer.render();
            requestAnimationFrame(animate);
        },
        onremove: () => {
        },
        view: function() {
            return m('.game-main', [
                m('.game-canvas'),
                m('.game-overlay', [
                    m('img.debug-image'),
                    m('.game-context-menu', [
                        m('.game-menu-head', [
                            m('.game-menu-title', 'Objektname hier'),
                            m('pre.game-menu-stats', 'Hier stehen dann\ndie richtig guten Stats'),
                        ]),
                        m('.game-menu-items', [
                            m('a.game-menu-item', 'Freeze'),
                            m('a.game-menu-item', 'Delete'),
                            m('a.game-menu-item', 'Bla'),
                            m('a.game-menu-item', 'Spawn Puzzle'),
                        ]),
                    ]),
                ]),
                m('.game-cursor'),
            ]);
        },
    };
};
