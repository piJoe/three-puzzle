import { SVGPathUtils } from "svg-path-utils";
import { svgPathBbox } from "svg-path-bbox";
import svgpath from "svgpath";
import { flattenSVG } from "flatten-svg";
const utils = new SVGPathUtils();

let pieces = [];
var seed = 1;
// function random() { var x = Math.sin(seed) * 10000; seed += 1; return x - Math.floor(x); }
function random() { return Math.random(); };
function uniform(min, max) { var r = random(); return min + r * (max - min); }
function rbool() { return random() > 0.5; }

var a, b, c, c2, d, e, t, t2, j, flip, xi, yi, xn, yn, vertical, width, height, tSize, tVar, mid, mid2, midVar, nipW, nipVar;
function first() { e = uniform(-j, j); next(); }
function next() { var flipold = flip; flip = rbool(); a = (flip == flipold ? -e : e); b = uniform(-j, j); c = uniform(-j, j); c2 = uniform(-j, j); d = uniform(-j, j); e = uniform(-j, j); t = uniform(tSize - tVar, tSize + tVar); t2 = uniform(tSize - tVar, tSize + tVar); mid = uniform(0.5 - midVar, 0.5 + midVar); mid2 = uniform(0.5 - midVar, 0.5 + midVar); nipW = uniform(-nipVar, nipVar); }
// function next() { var flipold = flip; flip = rbool(); a = (flip == flipold ? -e : e); b = uniform(-j, j); c = uniform(-j, j); d = uniform(-j, j); e = uniform(-j, j); }
function sl() { return vertical ? height / yn : width / xn; }
function sw() { return vertical ? width / xn : height / yn; }
function ol() { return sl() * (vertical ? yi : xi); }
function ow() { return sw() * (vertical ? xi : yi); }
// function l(v) { var ret = ol() + sl() * v; return Math.round(ret * 100) / 100; }
function l(v) { var ret = ol() + sl() * v; return (Math.round(ret * 100) / 100); }
function w(v) { var ret = ow() + sw() * v * (flip ? -1.0 : 1.0); return (Math.round(ret * 100) / 100); }

// function p0l() { return l(0.0); }
// function p0w() { return w(0.0); }
// function p1l() { return l(0.2 - Math.abs(mid / 10)); }
// function p1w() { return w(a); }
// function p2l() { return l(mid + b + d); }
// function p2w() { return w(-t + c); }
// function p3l() { return l(mid - t + b); }
// function p3w() { return w(t + c); }
// function p4l() { return l(mid - (2.0 + nipW2) * t + b - d); }
// function p4w() { return w((3.0 + nipW) * t + c); }
// function p5l() { return l(mid2 + (2.0 + nipW) * t2 + b - d); }
// function p5w() { return w((3.0 + nipW2) * t2 + c2); }
// function p6l() { return l(mid2 + t2 + b); }
// function p6w() { return w(t2 + c2); }
// function p7l() { return l(mid2 + b + d); }
// function p7w() { return w(-t2 + c2); }
// function p8l() { return l(0.8 + Math.abs(mid2 / 10)); }
// function p8w() { return w(e); }
// function p9l() { return l(1.0); }
// function p9w() { return w(0.0); }


function p0l() { return l(0.0); }
function p0w() { return w(0.0); }

function p1l() { return l(0.2 - Math.abs(mid / 10)); }
function p1w() { return w(a); }

function p2l() { return l(mid + b + d); }
function p2w() { return w(-t + c); }

function p3l() { return l(mid - (t * 0.6) + b); }
function p3w() { return w((t * 0.6) + c); }

function p4l() { return l(mid - (2.6 + nipW) * t + b - d); }
function p4w() { return w((3.0 + nipW) * t + c); }

function p5l() { return l(mid2 + (2.6 + nipW) * t2 + b - d); }
function p5w() { return w((3.0 + nipW) * t2 + c2); }

function p6l() { return l(mid2 + (t2 * 0.6) + b); }
function p6w() { return w((t2 * 0.6) + c2); }

function p7l() { return l(mid + b + d); }
function p7w() { return w(-t2 + c2); }

function p8l() { return l(0.8 + Math.abs(mid2 / 10)); }
function p8w() { return w(e); }

function p9l() { return l(1.0); }
function p9w() { return w(0.0); }

function parse_input() {
    seed = parseInt($("seed").value);
    t = parseFloat($("tabsize").value) / 200.0;
    j = parseFloat($("jitter").value) / 100.0;
    xn = parseInt($("xn").value);
    yn = parseInt($("yn").value);
}

function gen_dh() {
    var cols = [];
    var str = "";
    vertical = 0;

    xi = 0;
    first();
    for (; xi < xn; ++xi) {
        str += "M " + p0l() + " " + 0 + " ";
        str += "L " + p9l() + " " + 0 + " ";
        cols.push({
            left: [p0l(), 0],
            right: [p9l(), 0],
            path: str
        });
        str = "";
        next();
    }

    for (yi = 1; yi < yn; ++yi) {
        xi = 0;
        first();

        for (; xi < xn; ++xi) {
            str += "M " + p0l() + " " + p0w() + " ";

            str += "C " + p1l() + " " + p1w() + " " + p2l() + " " + p2w() + " " + p3l() + " " + p3w() + " ";
            str += "C " + p4l() + " " + p4w() + " " + p5l() + " " + p5w() + " " + p6l() + " " + p6w() + " ";
            str += "C " + p7l() + " " + p7w() + " " + p8l() + " " + p8w() + " " + p9l() + " " + p9w() + " ";

            cols.push({
                left: [p0l(), p0w()],
                right: [p9l(), p9w()],
                path: str
            });
            next();
            str = "";
        }

    }

    xi = 0;
    first();
    for (; xi < xn; ++xi) {
        str += "M " + p0l() + " " + p0w() + " ";
        str += "L " + p9l() + " " + p9w() + " ";
        cols.push({
            left: [p0l(), p0w()],
            right: [p9l(), p9w()],
            path: str
        });
        next();
        str = "";
    }

    return cols;
}

function gen_dv() {
    var rows = [];
    var str = "";
    vertical = 1;

    yi = 0;
    first();
    for (; yi < yn; ++yi) {
        str += "M " + 0 + " " + p0l() + " ";
        str += "L " + 0 + " " + p9l() + " ";
        rows.push({
            top: [0, p0l()],
            bottom: [0, p9l()],
            path: str
        });
        str = "";
        next();
    }

    for (xi = 1; xi < xn; ++xi) {
        yi = 0;
        first();

        for (; yi < yn; ++yi) {
            str += "M " + p0w() + " " + p0l() + " ";
            str += "C " + p1w() + " " + p1l() + " " + p2w() + " " + p2l() + " " + p3w() + " " + p3l() + " ";
            str += "C " + p4w() + " " + p4l() + " " + p5w() + " " + p5l() + " " + p6w() + " " + p6l() + " ";
            str += "C " + p7w() + " " + p7l() + " " + p8w() + " " + p8l() + " " + p9w() + " " + p9l() + " ";


            rows.push({
                top: [p0w(), p0l()],
                bottom: [p9w(), p9l()],
                path: str
            });
            next();
            str = "";
        }
    }

    yi = 0;
    first();
    for (; yi < yn; ++yi) {
        str += "M " + p0w() + " " + p0l() + " ";
        str += "L " + p9w() + " " + p9l() + " ";
        rows.push({
            top: [p0w(), p0l()],
            bottom: [p9w(), p9l()],
            path: str
        });
        next();
        str = "";
    }

    return rows;
}

const ROUND_PRECISION = 3;
function roundNumber(n) {
    // return n;
    const power = Math.pow(10, ROUND_PRECISION);
    return Math.round((n + Number.EPSILON) * power) / power;
}

function removeM(path) {
    return path.replace(/M[\s]*[0-9\.]+[\s\,]*[0-9\.]+[\s]+/g, '');
}

function calculatePieceCount(fullWidth, fullHeight, targetCount) {

    const ratio_w = fullWidth / fullHeight;
    const ratio_h = fullHeight / fullWidth;

    let pieceCountW = Math.round(Math.sqrt(targetCount * ratio_w));
    let pieceCountH = Math.round(Math.sqrt(targetCount * ratio_h));

    // fixes min target count
    while (pieceCountH * pieceCountW < targetCount) {
        if (pieceCountH < pieceCountW) {
            pieceCountW++;
        }
        else {
            pieceCountH++;
        }
    }

    return {
        x: pieceCountW,
        y: pieceCountH,
        total: pieceCountH * pieceCountW,
    };
}

export const generatePuzzleData = function generatePuzzleData(config) {
    width = config.width;
    height = config.height;

    tSize = (config.tabSize || 20) / 200.0;
    tVar = ((config.tabVar || 0) / 200.0);
    // t = (config.tabSize || 20) / 200.0;

    midVar = config.midVar || 0.0;
    nipVar = config.nipVar || 0.0;

    j = (config.jitter || 4) / 100.0;

    // xn = config.tilesX;
    // yn = config.tilesY;
    ({ x: xn, y: yn } = calculatePieceCount(width, height, config.pieceCount));

    const columns = gen_dh();
    const rawRows = gen_dv();

    const pH = roundNumber(height / yn);
    const pW = roundNumber(width / xn);

    pieces = [];
    for (let x = 0; x < yn; x++) {
        for (let y = 0; y < xn; y++) {
            const c = columns[y + xn * x + xn].path;
            const c2 = columns[y + xn * x].path;
            const r = rawRows[x + y * yn].path;
            const r2 = rawRows[x + y * yn + yn].path;

            const path = svgpath(
                (utils.inversePath(c) + " " +
                    removeM(utils.inversePath(r)) + " " +
                    removeM(c2) + " " +
                    removeM(r2)).trim() + " Z")
                .translate(-(y * pW), -(x * pH))
                .scale(1 / pW, 1 / pH)
                .rel()
                .round(ROUND_PRECISION)
                .toString();

            const piece = {
                x: y, // x and y is swapped
                y: x, // x and y is swapped
                path,
                // pathSides: {
                //     bottom: utils.inversePath(c).trim(),
                //     left: utils.inversePath(r).trim(),
                //     top: c2.trim(),
                //     right: r2.trim(),
                // },
            };
            pieces.push(piece);

            let bBox = svgPathBbox(piece.path);
            bBox = bBox.map(n => roundNumber(n));

            piece.bBox = { x: bBox[0], y: bBox[1], width: roundNumber(bBox[2] - bBox[0]), height: roundNumber(bBox[3] - bBox[1]) };
            //@todo: fix bBox and offset (sizing is way off because of scaling)
            piece.offset = {
                x: roundNumber(piece.bBox.x - piece.x * pW),
                y: roundNumber(piece.bBox.y - piece.y * pH),
            };
        }
    }
    pieces = pieces.map((p, i) => {
        const neighbours = [-1, -1, -1, -1]; //left top right bottom
        if (p.x > 0) {
            neighbours[0] = i - 1;
        }
        if (p.x < xn - 1) {
            neighbours[2] = i + 1;
        }

        if (p.y > 0) {
            neighbours[1] = i - 1 * xn;
        }
        if (p.y < yn - 1) {
            neighbours[3] = i + 1 * xn;
        }
        p.neighbours = neighbours;
        return p;
    });

    /* path generation */
    // const window = createSVGWindow();
    // let svgStr = '';
    // for (let i = 0; i < pieces.length; i++) {
    //     const piece = pieces[i];
    //     svgStr += `<path d="${piece.path}" stroke="0.1"></path>`;

    // }
    // window.document.documentElement.innerHTML = svgStr;

    // console.log('flatten');
    // const paths = flattenSVG(window.document.documentElement, { maxError: 0.5 });

    /* byte parsing? */
    // const pieceParser = new Parser()
    //     .endianess("big")
    //     .uint16be('x')
    //     .uint16be('y')
    //     .array('bBox', {
    //         type: 'floatbe',
    //         length: 4,
    //     })
    //     .uint8('neighboursCount')
    //     .array('neighbours', {
    //         type: 'uint16be',
    //         length: 'neighboursCount'
    //     })
    //     .floatbe('offsetX')
    //     .floatbe('offsetY')
    //     .string('path', {
    //         zeroTerminated: true,
    //     })
    //     // .uint16be('polygonCount')
    //     // .array('polygon', {
    //     //     type: 'floatbe',
    //     //     length: 'polygonCount',
    //     // });

    // const puzzleParser = new Parser()
    //     .endianess("big")
    //     .uint16be('width')
    //     .uint16be('height')
    //     .uint16be('pieceSizeX')
    //     .uint16be('pieceSizeY')
    //     .uint16be('piecesCount')
    //     .array('pieces', {
    //         type: pieceParser,
    //         length: 'piecesCount'
    //     });

    // for (let i = 0; i < pieces.length; i++) {
    //     const piece = pieces[i];

    //     // piece.polygon = [];
    //     // for (let j = 0; j < paths[i].points.length; j++) {
    //     //     const [x, y] = paths[i].points[j];
    //     //     piece.polygon.push(roundNumber(x - (piece.x * pW)), roundNumber(y - (piece.y * pH)));
    //     // }
    //     // delete piece.path;

    //     // const pieceBytes = {
    //     //     x: piece.x,
    //     //     y: piece.y,
    //     //     bBox: [piece.bBox.x, piece.bBox.y, piece.bBox.width, piece.bBox.height],
    //     //     neighboursCount: piece.neighbours.length,
    //     //     neighbours: piece.neighbours,
    //     //     offsetX: piece.offset.x,
    //     //     offsetY: piece.offset.y,
    //     //     path: piece.path,
    //     //     // polygonCount: piece.polygon.length,
    //     //     // polygon: piece.polygon,
    //     // };
    //     // pieces[i] = pieceBytes;
    // }

    return {
        width: width / 100,
        height: height / 100,
        pieceSize: [pW / 100, pH / 100], // convert cm to m
        pieces,

        // puzzleBytes: puzzleParser.encode({
        //     width,
        //     height, 
        //     pieceSizeX: pW,
        //     pieceSizeY: pH,
        //     piecesCount: pieces.length,
        //     pieces,
        // })
    };
}

/**
 * 
 * @param {*} puzzle - puzzle data loaded from json
 * @param {number} quality - default is 75, below 50 results in garbage, above 100 is probably not useful
 * @param {HTMLElement} workingDOM - defaults to document.body, is needed to create the temporary svg element for path calculations
 */
export const generatePuzzlePaths = function generatePuzzlePaths(puzzle, quality = 75, workingDOM = document.body) {
    const { pieces, pieceSize } = puzzle;

    const pieceMaxSize = Math.min(pieceSize[0], pieceSize[1]);
    // console.log(realPieceSize);

    const svg = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
    const g = document.createElementNS("http://www.w3.org/2000/svg", 'g');
    g.setAttribute('transform', `scale(${(pieceSize[0])},${(pieceSize[1])})`);
    g.setAttribute('style', 'visibility: hidden; height: 0; width: 0;');
    svg.append(g);
    workingDOM.append(svg);

    for (let i = 0; i < pieces.length; i++) {
        const piece = pieces[i];

        const p = document.createElementNS("http://www.w3.org/2000/svg", 'path');

        p.setAttribute('d', piece.path);
        p.dataset.no = pieces.length - 1;

        g.append(p);
    }

    const flattenedPaths = flattenSVG(svg, {
        maxError: pieceMaxSize / quality,
    });
    const cleanPaths = flattenedPaths.map(p => p.points);

    svg.remove();

    return cleanPaths;
};