import { Shape, Vector2 } from 'three';

/**
 * Generates a shape from a path in the format [[x,y],[x,y],[x,y],...]
 * @param {*} path
 */
export function createShapeFromPath(path) {
    return new Shape(path.map((p) => new Vector2(p[0], p[1])));
}

function getPositionsFromOutline(inx, iny, inx2, iny2) {
    const positions = [];
    for (let x = inx; x <= inx2; x++) {
        for (let y = iny; y <= iny2; y++) {
            positions.push({ x, y });
        }
    }
    return positions;
}

/**
 * generates spawn positions of size 1,1 based on the outside of the defined area
 * @param {number} x - x pos of inside area
 * @param {number} y - y pos of inside area
 * @param {number} x2 - x2 pos of inside area
 * @param {number} y2 - y2 pos of inside area
 * @param {number} length - how many spawn positions we need
 */
export function createSpawnPositionsOutsideArea(x, y, x2, y2, length) {
    const positions = [];
    while (positions.length < length) {
        positions.push(
            ...getPositionsFromOutline(x - 1, y - 1, x2 + 1, y - 1),
            ...getPositionsFromOutline(x - 1, y, x - 1, y2 + 1),
            ...getPositionsFromOutline(x, y2 + 1, x2, y2 + 1),
            ...getPositionsFromOutline(x2 + 1, y, x2 + 1, y2 + 1),
        );

        x -= 1;
        y -= 1;
        x2 += 1;
        y2 += 1;
    }
    return positions.slice(0, length);
}
