import './style.scss';

import m from 'mithril';
import { store } from 'client/store';
import { Scene, PerspectiveCamera, WebGLRenderer, Mesh, Shape, Vector2, ExtrudeGeometry, MeshBasicMaterial, OrthographicCamera, TextureLoader, MeshStandardMaterial, AmbientLight, DirectionalLight, MathUtils, PlaneGeometry, PCFSoftShadowMap, CameraHelper, Vector3, ExtrudeBufferGeometry, WireframeGeometry, LineSegments } from 'three';
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
            const nullVec = new Vector2();
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

            const scene = new Scene();
            const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.001, 5000);
            // const camera = new OrthographicCamera(window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 0.01, 1000);

            // const geometry = new BoxGeometry();
            // const material = new MeshBasicMaterial( { color: 0x00ff00 } );
            // const cube = new Mesh( geometry, material );
            // scene.add( cube );

            // const axesHelper = new AxesHelper(5);
            // scene.add(axesHelper);

            const ambientLight = new AmbientLight(0x909090); // soft white light
            scene.add(ambientLight);

            const directionalLight = new DirectionalLight(0xffffff, 0.7);
            directionalLight.position.set(puzzleData.width, 1000, 0);
            directionalLight.target.position.set(puzzleData.width / 2, 0, puzzleData.height / 2);

            // directionalLight.castShadow = true;
            // directionalLight.shadow.mapSize.width = 2048; // default
            // directionalLight.shadow.mapSize.height = 2048; // default
            // directionalLight.shadow.camera.near = 0.1; // default
            // directionalLight.shadow.camera.far = 5000; // default
            // directionalLight.shadow.camera.left = -puzzleData.height*2;
            // directionalLight.shadow.camera.right = puzzleData.height*2;
            // directionalLight.shadow.camera.top = -puzzleData.width*2;
            // directionalLight.shadow.camera.bottom = puzzleData.width*2;
            // window.light = directionalLight;

            scene.add(directionalLight);
            scene.add(directionalLight.target);

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

            const planeMaterial = new MeshStandardMaterial({
                //map: loader.load(puzzleData.puzzleImage),
                color: 0x808080,
            });
            const plane = new PlaneGeometry(puzzleData.width * 3, puzzleData.height * 3);
            plane.center();
            plane.rotateX(-Math.PI / 2);
            plane.translate(puzzleData.width / 1.6, -(pieceMaxSize / 40), puzzleData.height / 1.6);
            const planeM = new Mesh(plane, planeMaterial);
            planeM.receiveShadow = true;
            scene.add(planeM);

            const loader = new TextureLoader();
            // const material = new MeshBasicMaterial({
            //     map: loader.load(puzzleData.puzzleImage),
            // });
            const material = new MeshStandardMaterial({
                map: loader.load(puzzleData.puzzleImage),
            });

            const pieceGeometries = [];
            const pieceMeshes = [];
            let bufferOffset = 0;
            for (let i = 0; i < puzzlePaths.length; i++) {
                const puzzlePiece = puzzleData.pieces[i];
                const shape = createShape(puzzlePaths[i]);

                extrudeSettings.UVGenerator = PuzzleUVGenerator(puzzleData, i);
                const geometry = new ExtrudeBufferGeometry(shape, extrudeSettings);
                geometry.center();
                geometry.rotateX(Math.PI / 2);
                geometry.rotateY(MathUtils.degToRad(Math.round(Math.random() * 8) * 45));
                // geometry.translate(puzzleData.pieceSize[0] * puzzlePiece.x, 0, puzzleData.pieceSize[1] * puzzlePiece.y);
                geometry.translate(puzzleData.pieceSize[0] * puzzlePiece.x * 1.6, 0, puzzleData.pieceSize[1] * puzzlePiece.y * 1.6);

                pieceGeometries.push(geometry);

                const mesh = new Mesh(geometry, material);
                mesh.castShadow = true;
                mesh.visible = false; // @todo: maybe move our single puzzle pieces into another layer?

                mesh.bufferOffset = bufferOffset;
                bufferOffset += geometry.attributes.position.count;

                scene.add(mesh);
                pieceMeshes.push(mesh);
            }

            const wireframe = new WireframeGeometry( pieceGeometries[0] );
            const line = new LineSegments( wireframe );
            line.material.depthTest = false;
            line.material.opacity = 0.8;
            line.material.transparent = true;
            scene.add( line );

            console.time('merge');
            const merged = BufferGeometryUtils.mergeBufferGeometries(pieceGeometries);
            console.timeEnd('merge');
            console.time('newmesh');
            const allMesh = new Mesh(merged, material);
            allMesh.castShadow = true;
            scene.add(allMesh);
            console.timeEnd('newmesh');
            

            // const helper = new CameraHelper(directionalLight.shadow.camera);
            // scene.add(helper);

            const renderer = new WebGLRenderer({
                antialias: true,
                logarithmicDepthBuffer: true,
            });
            // renderer.shadowMap.enabled = true;
            // renderer.shadowMap.type = PCFSoftShadowMap;

            renderer.setSize(window.innerWidth, window.innerHeight);
            canvasDOM.appendChild(renderer.domElement);

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
            // camera.position.set(0, 0, 1);
            camera.position.set(0, 0, pieceMaxSize * 10);
            controls.update();

            let hasChanged = false;
            let lastTime = 0;

            let currentObject = 0;
            let currentTime = 0;
            let curTrans = new Vector3(-1 + Math.random()*2, 0, -1 + Math.random()*2);
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