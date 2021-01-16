import { MergeableGameObjectMesh } from 'client/lib/engine/game/MergeableGameObjectMesh';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils';
import { Matrix4 } from 'three';

export class CombinedPuzzlePiece extends MergeableGameObjectMesh {
    constructor(puzzle, puzzlePieceIndexes) {
        puzzlePieceIndexes = puzzlePieceIndexes.filter((p, i, a) => a.indexOf(p) === i);
        // console.log('add pieces', puzzlePieceIndexes, null);
        if (puzzlePieceIndexes.length === 0) return;

        const geometry = BufferGeometryUtils.mergeBufferGeometries(puzzlePieceIndexes.map(idx => {
            const piece = puzzle.pieces[idx];
            const puzzlePiece = piece.puzzlePiece;

            const geo = puzzlePiece.geometry.clone();
            const matrix = new Matrix4().compose(puzzlePiece.targetPosition, puzzlePiece.quaternion, puzzlePiece.scale);
            geo.applyMatrix4(matrix);

            piece.relativePosition = puzzlePiece.targetPosition.clone();
            puzzle.mergeGroup.remove(puzzlePiece);

            return geo;
        }));

        super(puzzle.mergeGroup, geometry);

        this.puzzle = puzzle;
        this.pieces = puzzlePieceIndexes;
        this.pieces.forEach(idx => {
            const piece = puzzle.pieces[idx];
            piece.combinedPiece = this;
        });
    }

    addPieces(pieceIndexes) {
        pieceIndexes = pieceIndexes.filter((p, i, a) => a.indexOf(p) === i && this.pieces.indexOf(p) === -1);
        // console.log('add pieces', pieceIndexes, this);
        if (pieceIndexes.length === 0) return;

        const newGeometry = BufferGeometryUtils.mergeBufferGeometries(pieceIndexes.map(idx => {
            const piece = this.puzzle.pieces[idx];
            const puzzlePiece = piece.puzzlePiece;

            const geo = puzzlePiece.geometry.clone();
            const matrix = new Matrix4().compose(puzzlePiece.targetPosition, puzzlePiece.quaternion, puzzlePiece.scale);
            geo.applyMatrix4(matrix);

            piece.relativePosition = puzzlePiece.targetPosition.clone();
            piece.combinedPiece = this;
            this.puzzle.mergeGroup.remove(puzzlePiece);

            return geo;
        }));
        this.pieces.push(...pieceIndexes);

        this.geometry = BufferGeometryUtils.mergeBufferGeometries([this.geometry, newGeometry]);
    }

    onDrop(event) {
        super.onDrop(event);
        const newNeighbours = this.pieces.reduce((acc, idx) => {
            return [...acc, ...this.puzzle.pieces[idx].puzzlePiece.checkNeighbours(true)];
        }, []).filter((p, i, arr) => arr.indexOf(p) === i && this.pieces.indexOf(p) === -1);
        console.log('new pieces to connect', newNeighbours, this.pieces);
    }
}