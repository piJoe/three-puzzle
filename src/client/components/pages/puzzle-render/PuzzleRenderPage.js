// import './style.scss';

import m from 'mithril';
import { store } from 'client/store';
import { Scene, PerspectiveCamera, WebGLRenderer, BoxGeometry, MeshBasicMaterial, Mesh, Shape, Vector2, ExtrudeGeometry } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { generatePuzzlePaths } from 'client/lib/puzzle/puzzle-utils';

function createShape(path) {
    return new Shape(path.map(p => new Vector2(p[0], p[1])));
}

export const PuzzleRenderPage = function PuzzleRenderPage() {

    return {
        oncreate: (vnode) => {
            const canvasDOM = vnode.dom;
            console.log(vnode.dom);

            const puzzleData = store.puzzleData;
            const puzzlePaths = generatePuzzlePaths(puzzleData);
            // console.log(puzzlePaths);

            const scene = new Scene();
            const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);

            // const geometry = new BoxGeometry();
            // const material = new MeshBasicMaterial( { color: 0x00ff00 } );
            // const cube = new Mesh( geometry, material );
            // scene.add( cube );

            const extrudeSettings = {
                steps: 1,
                depth: 0.02,
                bevelEnabled: false,
                // bevelThickness: 1,
                // bevelSize: 1,
                // bevelOffset: 0,
                // bevelSegments: 1
            };

            for (let i = 0; i < puzzlePaths.length; i++) {
                const puzzlePiece = puzzleData.pieces[i];
                const shape = createShape(puzzlePaths[i]);
                const geometry = new ExtrudeGeometry(shape, extrudeSettings);
                geometry.scale(0.96, 0.96, 0.96);
                geometry.translate(puzzleData.pieceSize[0]/300 * puzzlePiece.x, puzzleData.pieceSize[1]/300 * puzzlePiece.y, 0);
                const material = new MeshBasicMaterial({ color: 0x00ff00 });
                const mesh = new Mesh(geometry, material);
                scene.add(mesh);
            }

            const renderer = new WebGLRenderer();
            renderer.setSize(window.innerWidth, window.innerHeight);
            canvasDOM.appendChild(renderer.domElement);

            const controls = new OrbitControls( camera, renderer.domElement );
            //controls.update() must be called after any manual changes to the camera's transform
            camera.position.set( 10, 5, 12 );
            controls.update();

            function animate() {

                requestAnimationFrame( animate );
            
                // required if controls.enableDamping or controls.autoRotate are set to true
                controls.update();
                renderer.render( scene, camera );
            }
            requestAnimationFrame( animate );
        },
        onremove: () => {

        },
        view: function () {
            return m('.puzzle-canvas');
        },
    };
};