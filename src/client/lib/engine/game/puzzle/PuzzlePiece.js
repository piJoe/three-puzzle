import { MergeableGameObjectMesh } from 'client/lib/engine/game/MergeableGameObjectMesh';
import { SimpleExtrudeBufferGeometry } from 'client/lib/engine/SimpleExtrudeBufferGeometry';
import { Vector2 } from 'three';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils';
import { GameObjectMesh } from 'client/lib/engine/game/GameObjectMesh';
import { LayerDefintion } from 'client/lib/engine/layers';

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

        //@todo: fix shadow geometries
        // const shadowMesh = new Mesh(geometry, fakeFullShadowMat);
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

        this.mergedMesh = null;
    }

    select() {
        if (this.group === null) {
            return [this];
        }

        // @todo: create merged mesh, hide all pieces, add merge mesh to scene and return as well, improve performance by reusing existing mesh?
        console.time('merge');
        const mergeGeos = [];
        for (let i = 0; i < this.group.length; i++) {
            const piece = this.group[i];
            const matrix = piece.matrix;
            mergeGeos.push(this.group[i].geometry.clone().applyMatrix4(matrix));
            piece.layers.set(LayerDefintion.INVISIBLE);
        }
        const selectGroupGeo = BufferGeometryUtils.mergeBufferGeometries(mergeGeos);
        const mergedPiece = new GameObjectMesh(selectGroupGeo, this.material, {
            name: 'Merged Piece',
        });
        window.scene.add(mergedPiece);
        this.getGroupLeader().mergedMesh = mergedPiece;
        console.timeEnd('merge');
        return [...this.group, mergedPiece]; // return as new array, so we're safe from mutation
    }

    attachToMergeGroup() {
        super.attachToMergeGroup();

        // drop complete, check if we are merged with other pieces, clear merged geo and set every piece back to be interactable
        if (this.mergedMesh !== null && this.isGroupLeader()) { // @todo: remove mergedMesh EVERY TIME, not only for group leader
            for (let i = 0; i < this.group.length; i++) {
                const piece = this.group[i];
                piece.layers.set(LayerDefintion.INTERACTABLE);
            }
            this.mergedMesh.geometry.dispose();
            window.scene.remove(this.mergedMesh); // @todo: fix discouraged behaviour! scene graph should not be changed when inside a `traverse`
            this.mergedMesh = null;
        }
    }
}

const extrudeSettings = {
    steps: 1,
    depth: 0.0014,
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
        generateBotUV: function() {
            const nullVec = new Vector2(0, 1);
            return [nullVec, nullVec, nullVec, nullVec];
        },

        generateSideWallUV: function() {
            const nullVec = new Vector2(0, 1);
            return [nullVec, nullVec, nullVec, nullVec];
        },
    };
};
