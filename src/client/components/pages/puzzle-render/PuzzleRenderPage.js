import './style.scss';

import m from 'mithril';
import { store } from 'client/store';
import { Scene, PerspectiveCamera, WebGLRenderer, Mesh, Shape, Vector2, ExtrudeGeometry, MeshBasicMaterial, OrthographicCamera, TextureLoader } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { generatePuzzlePaths } from 'client/lib/puzzle/puzzle-utils';

function createShape(path) {
    return new Shape(path.map(p => new Vector2(p[0], p[1])));
}

const PuzzleUVGenerator = (pieceSize, piece) => {
    const x = pieceSize[0] * piece.x;
    const y = -(pieceSize[1] * piece.y);
    return {
        generateTopUV: function (geometry, vertices, indexA, indexB, indexC) {

            const a_x = vertices[indexA * 3] / x;
            const a_y = vertices[indexA * 3 + 1] / y;
            const b_x = vertices[indexB * 3] / x;
            const b_y = vertices[indexB * 3 + 1] / y;
            const c_x = vertices[indexC * 3] / x;
            const c_y = vertices[indexC * 3 + 1] / y;

            // console.log(vertices[indexA * 3], x);

            return [
                new Vector2(a_x, a_y),
                new Vector2(b_x, b_y),
                new Vector2(c_x, c_y)
            ];

        },

        generateSideWallUV: function (geometry, vertices, indexA, indexB, indexC, indexD) {

            const a_x = vertices[indexA * 3];
            const a_y = vertices[indexA * 3 + 1];
            const a_z = vertices[indexA * 3 + 2];
            const b_x = vertices[indexB * 3];
            const b_y = vertices[indexB * 3 + 1];
            const b_z = vertices[indexB * 3 + 2];
            const c_x = vertices[indexC * 3];
            const c_y = vertices[indexC * 3 + 1];
            const c_z = vertices[indexC * 3 + 2];
            const d_x = vertices[indexD * 3];
            const d_y = vertices[indexD * 3 + 1];
            const d_z = vertices[indexD * 3 + 2];

            if (Math.abs(a_y - b_y) < 0.01) {

                return [
                    new Vector2(a_x, 1 - a_z),
                    new Vector2(b_x, 1 - b_z),
                    new Vector2(c_x, 1 - c_z),
                    new Vector2(d_x, 1 - d_z)
                ];

            } else {

                return [
                    new Vector2(a_y, 1 - a_z),
                    new Vector2(b_y, 1 - b_z),
                    new Vector2(c_y, 1 - c_z),
                    new Vector2(d_y, 1 - d_z)
                ];

            }

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
            // const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
            const camera = new OrthographicCamera(window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 0.01, 1000);

            // const geometry = new BoxGeometry();
            // const material = new MeshBasicMaterial( { color: 0x00ff00 } );
            // const cube = new Mesh( geometry, material );
            // scene.add( cube );

            // const axesHelper = new AxesHelper(5);
            // scene.add(axesHelper);

            const pieceMaxSize = Math.min(puzzleData.pieceSize[0], puzzleData.pieceSize[1]);

            const extrudeSettings = {
                steps: 1,
                depth: 0,

                bevelEnabled: true,
                bevelThickness: 0,
                bevelSize: 0,
                bevelOffset: -(pieceMaxSize / 200),
                bevelSegments: 1,
            };

            // const material = new MeshBasicMaterial({ color: 0x00ff00 });
            const loader = new TextureLoader();
            const material = new MeshBasicMaterial({
                map: loader.load(puzzleData.puzzleImage),
            });

            for (let i = 0; i < puzzlePaths.length; i++) {
                // for (let i = 0; i < 1; i++) {
                const puzzlePiece = puzzleData.pieces[i];
                const shape = createShape(puzzlePaths[i]);

                extrudeSettings.UVGenerator = PuzzleUVGenerator(puzzleData.pieceSize, puzzlePiece);
                const geometry = new ExtrudeGeometry(shape, extrudeSettings);
                geometry.rotateX(Math.PI);

                geometry.translate(puzzleData.pieceSize[0] * puzzlePiece.x, -(puzzleData.pieceSize[1] * puzzlePiece.y), 0);
                const mesh = new Mesh(geometry, material);
                scene.add(mesh);
            }

            const renderer = new WebGLRenderer({
                antialias: true,
            });

            renderer.setSize(window.innerWidth, window.innerHeight);
            canvasDOM.appendChild(renderer.domElement);

            const controls = new OrbitControls(camera, renderer.domElement);
            controls.enableRotate = false;
            controls.enableKeys = true;
            controls.keyPanSpeed = 20;
            controls.keys = {
                LEFT: 65, //left arrow
                UP: 87, // up arrow
                RIGHT: 68, // right arrow
                BOTTOM: 83 // down arrow
            };
            //controls.update() must be called after any manual changes to the camera's transform
            camera.position.set(0, 0, 1);
            controls.update();

            function animate() {
                requestAnimationFrame(animate);

                // required if controls.enableDamping or controls.autoRotate are set to true
                controls.update();
                renderer.render(scene, camera);
            }
            requestAnimationFrame(animate);
        },
        onremove: () => {

        },
        view: function () {
            return m('.puzzle-canvas');
        },
    };
};