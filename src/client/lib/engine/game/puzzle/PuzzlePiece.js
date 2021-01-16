import { MergeableGameObjectMesh } from 'client/lib/engine/game/MergeableGameObjectMesh';
import { SimpleExtrudeBufferGeometry } from 'client/lib/engine/SimpleExtrudeBufferGeometry';
import { Vector2 } from 'three';
import { NEIGHBOUR_SIDES } from 'client/lib/puzzle/puzzle-utils';
import { setTargetPositionGroup } from 'client/lib/engine/game/TweenObject';
import { CombinedPuzzlePiece } from 'client/lib/engine/game/puzzle/CombinedPuzzlePiece';

/*
puzzle -> {
    width, height,
    pieceSize,
    pieces, => {
        neighbours,
        shape,
        puzzlePieceRef
    },
    neighbourOffsets,
    mergeGroup
} ==> Wird beim spawn aus der PuzzleBox angelegt/ergänzt?
 */

export class PuzzlePiece extends MergeableGameObjectMesh {
    constructor(puzzle, pieceIndex) {
        const geometry = createPieceGeometry(puzzle, pieceIndex);
        super(puzzle.mergeGroup, geometry);
        this.name = 'Puzzle Piece';

        this.puzzle = puzzle;
        this.pieceIndex = pieceIndex;

        this.puzzle.pieces[this.pieceIndex].puzzlePiece = this;
    }

    checkNeighbours(returnNeighbours = false) {
        console.log('========= begin check neighbour');
        const puzzlePiece = this.puzzle.pieces[this.pieceIndex];

        const toConnect = [];
        let combinedPiece = null;
        for (
            let i = 0;
            i < puzzlePiece.neighbours.length;
            i++
        ) {
            const neighbourNo =
                puzzlePiece.neighbours[i];
            if (neighbourNo < 0) {
                continue;
            }

            const neighbourPiece = this.puzzle.pieces[neighbourNo];
            const neighbour = neighbourPiece.puzzlePiece;
            const selfOffset = this.puzzle.neighbourOffsets[i];

            let selfPos = this.targetPosition
                .clone()
                .add(selfOffset);
            if (puzzlePiece.combinedPiece) {
                continue;
                // console.log('THIS SHOULD NEVER EVER HAPPEN!');
                // selfPos.add(puzzlePiece.combinedPiece.targetPosition);
                // combinedPiece = puzzlePiece.combinedPiece;
            }

            const neighbourOffset = this.puzzle.neighbourOffsets[(i + 2) % 4];
            const neighbourPos = neighbour.targetPosition.clone().add(neighbourOffset);
            if (neighbourPiece.combinedPiece) {
                neighbourPos.add(neighbourPiece.combinedPiece.targetPosition);
                combinedPiece = neighbourPiece.combinedPiece;
            }

            const distance = selfPos.distanceTo(neighbourPos);

            // if (distance < selfOffset.length() / 2) {
            if (distance < 0.2) {
                // clickSound.play();
                console.log(
                    '*CLICK*',
                    NEIGHBOUR_SIDES.getSideName(i),
                    distance,
                );
                const newPos = neighbour.targetPosition.clone().add(neighbourOffset).sub(selfOffset);

                //@todo: combine as combined puzzle piece, update reference in this.puzzle.pieces, remove ourself from scene
                toConnect.push(neighbour.pieceIndex);
                if (!returnNeighbours) {
                    this.moveToTargetPos(newPos); // do not move directly to this, use combinePuzzlePiece! only move to last target
                    break;
                }
            }
        }
        if (returnNeighbours) {
            return toConnect;
        }

        if (toConnect.length > 0) {
            if (combinedPiece) {
                combinedPiece.addPieces(toConnect);
            } else {
                toConnect.push(this.pieceIndex);
                new CombinedPuzzlePiece(this.puzzle, toConnect);
            }
            console.log('add pieces', toConnect, combinedPiece);
        }
    }

    onDrop(event) {
        super.onDrop(event);
        console.log('check neighbours, combine eventually');
        this.checkNeighbours();
    }
}


function createPieceGeometry(puzzle, pieceIndex) {
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

    return geometry;
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
