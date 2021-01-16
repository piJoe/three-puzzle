import { MergeableGameObjectMesh } from 'client/lib/engine/game/MergeableGameObjectMesh';
import { SimpleExtrudeBufferGeometry } from 'client/lib/engine/SimpleExtrudeBufferGeometry';
import { Vector2 } from 'three';

/*
puzzle -> {
    width, height,
    pieceSize,
    pieces, => {
        neighbours,
        shape
    }
    mergeGroup
} ==> Wird beim spawn aus der PuzzleBox angelegt/ergänzt?
 */

export class PuzzlePiece extends MergeableGameObjectMesh {
    constructor(puzzle, pieceIndex) {
        const { shape } = puzzle.pieces[pieceIndex];

        extrudeSettings.UVGenerator = PuzzleUVGenerator(puzzle, pieceIndex);
        const geometry = new SimpleExtrudeBufferGeometry(
            shape,
            extrudeSettings,
        );
        // geometry.center();
        geometry.rotateX(Math.PI / 2);
        // geometry.rotateY(MathUtils.degToRad(Math.round(Math.random() * 8) * 45));

        //@todo: fix outline and shadow geometries
        // const outlineGeo = new SimpleExtrudeBufferGeometry(
        //     shape,
        //     {
        //         ...extrudeSettings,
        //         offset: pieceMaxSize / 100,
        //         depth: pieceMaxSize / 15,
        //     },
        // );
        // outlineGeo.rotateX(Math.PI / 2);
        // const outlineMesh = new Mesh(outlineGeo, outlineMat);
        // outlineMesh.name = 'outline';
        // outlineMesh.position.set(
        //     0,
        //     pieceMaxSize / 100,
        //     0,
        // );
        // outlineMesh.layers.set(LayerDefintion.DEFAULT);
        // outlineMesh.visible = false;
        //
        // // const shadowMesh = new Mesh(shadowGeo, fakeShadowMat);
        // const shadowMesh = new Mesh(outlineGeo, fakeFullShadowMat);
        // shadowMesh.name = 'shadow';
        // // shadowMesh.rotateX(-Math.PI / 2);
        // // shadowMesh.position.set(pieceMaxSize / 2 - puzzleData.pieceSize[0] / 2, -0.0098, pieceMaxSize / 2 - puzzleData.pieceSize[1] / 2);
        // shadowMesh.position.set(
        //     0,
        //     -0.0099,
        //     0,
        // );
        // shadowMesh.layers.set(LayerDefintion.DEFAULT);
        // shadowMesh.visible = false;

        super(puzzle.mergeGroup, geometry);
    }
}


const extrudeSettings = {
    steps: 1,
    depth: 0.0012,
    offset: -0.00003,
};

const PuzzleUVGenerator = (puzzleData, i) => {
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
