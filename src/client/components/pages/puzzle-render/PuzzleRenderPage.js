import './style.scss';

import m from 'mithril';
import { store } from 'client/store';
import { Scene, PerspectiveCamera, WebGLRenderer, Mesh, Shape, Vector2, ExtrudeGeometry, MeshBasicMaterial, OrthographicCamera, TextureLoader, MeshStandardMaterial, AmbientLight, DirectionalLight, MathUtils, PlaneGeometry, PCFSoftShadowMap, CameraHelper, Vector3, ExtrudeBufferGeometry } from 'three';
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
            const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 50000);
            // const camera = new OrthographicCamera(window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 0.01, 1000);

            // const geometry = new BoxGeometry();
            // const material = new MeshBasicMaterial( { color: 0x00ff00 } );
            // const cube = new Mesh( geometry, material );
            // scene.add( cube );

            // const axesHelper = new AxesHelper(5);
            // scene.add(axesHelper);

            const ambientLight = new AmbientLight(0x404040); // soft white light
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
                bevelOffset: -(pieceMaxSize / 200),
                bevelSegments: 1,
            };

            const planeMaterial = new MeshStandardMaterial({
                //map: loader.load(puzzleData.puzzleImage),
                color: 0xd0d0d0,
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
                mesh.visible = false;
                scene.add(mesh);
                pieceMeshes.push(mesh);
            }

            console.time('merge');
            const mesh = new Mesh(BufferGeometryUtils.mergeBufferGeometries(pieceGeometries), material);
            mesh.castShadow = true;
            scene.add(mesh);
            console.timeEnd('merge');

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
            function animate() {
                requestAnimationFrame(animate);

                if (hasChanged) {
                    renderer.render(scene, camera);
                }
                hasChanged = false;
            }
            controls.addEventListener('change', () => {
                hasChanged = true;
            });
            requestAnimationFrame(animate);
        },
        onremove: () => {

        },
        view: function () {
            return m('.puzzle-canvas');
        },
    };
};