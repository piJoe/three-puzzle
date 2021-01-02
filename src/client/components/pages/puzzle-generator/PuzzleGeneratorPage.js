import './style.scss';

import m from 'mithril';
import { any } from "ramda";
import { generatePuzzleData } from 'client/lib/puzzle/puzzle-utils';
import { store } from 'client/store';

export const PuzzleGeneratorPage = function PuzzleGeneratorPage() {
    let pieceCount = 300;
    let imageSrc = '';
    let puzzleContainerDOM;
    let imageDOM;
    let dragging = 0;
    let containerSize = [800,600];

    const updatePieceCount = (value) => {
        pieceCount = parseInt(value);
    }

    const updateImage = (files) => {
        const images = [...files].filter(({ type }) => type.startsWith('image/'));
        if (images.length > 0) {
            imageSrc = URL.createObjectURL(images[0]);
        }
    }

    const resizeImageContainer = (boundingBox) => {
        const { width, height } = boundingBox;
        containerSize = [width, height];
    }

    const dragOverEvent = (e) => {
        e.preventDefault();

        const inTarget = any((d) => d === puzzleContainerDOM, e.path);
        if (!inTarget) {
            e.dataTransfer.dropEffect = 'none';
        }
    }
    const pasteEvent = (e) => {
        e.preventDefault();
        updateImage([...e.clipboardData.items].map(i => i.getAsFile()).filter(f => f !== null));
        m.redraw();
    }

    const clickUploadEvent = (e) => {
        e.preventDefault();
        const imgInput = document.createElement('input');
        imgInput.setAttribute('type', 'file');
        imgInput.click();
        
        const changeEvent = (e) => {
            updateImage(imgInput.files);
            imgInput.removeEventListener('change', changeEvent);
            imgInput.remove();
            m.redraw();
        };
        imgInput.addEventListener('change', changeEvent);
    };

    const preventDefaultEvent = (e) => {
        e.preventDefault();
    }

    const generatePuzzle = async () => {
        const {naturalWidth, naturalHeight} = imageDOM;

        let scale = 1;
        if (naturalWidth > naturalHeight && naturalWidth > 4096) {
            scale = 4096/naturalWidth;
        } else if (naturalHeight > naturalWidth && naturalHeight > 4096) {
            scale = 4096/naturalHeight;
        }
        const newWidth = Math.round(naturalWidth*scale), newHeight = Math.round(naturalHeight*scale);
        console.log(naturalWidth, naturalHeight, newWidth, newHeight);

        const c = new OffscreenCanvas(newWidth,newHeight);
        const ctx = c.getContext('2d');
        ctx.imageSmoothingQuality = 'high';
        ctx.fillStyle = "#fff";
        ctx.fillRect(0,0, newWidth, newHeight);
        ctx.drawImage(imageDOM, 0, 0, newWidth, newHeight);

        const finalImage = await c.convertToBlob({
            type: 'image/jpeg',
            quality: 0.9,
        });
        const finalImageURL = URL.createObjectURL(finalImage);

        console.log((finalImage.size/1024/1024).toFixed(2)+'MB', finalImageURL);

        const puzzleData = generatePuzzleData({
            width: newWidth,
            height: newHeight,
            tabSize: 22,
            jitter: 3.5,
            pieceCount: pieceCount,
            tabVar: 1.0,
            midVar: 0.0,
            nipVar: 0.25,
        });

        store.puzzleData = {
            ...puzzleData,
            puzzleImage: finalImageURL,
        };
        console.log(puzzleData);
    }

    return {
        oncreate: (vnode) => {
            puzzleContainerDOM = vnode.dom.querySelector('.puzzle-gen-image-container');
            imageDOM = vnode.dom.querySelector('.puzzle-gen-image');

            document.addEventListener('dragover', dragOverEvent);
            document.addEventListener('drop', preventDefaultEvent);
            document.addEventListener('paste', pasteEvent);
        },

        onremove: () => {
            document.removeEventListener('dragover', dragOverEvent);
            document.removeEventListener('drop', preventDefaultEvent);
            document.removeEventListener('paste', pasteEvent);
        },

        view: function() {
            return [
                m('.puzzle-gen-cover', {
                    onpaste: (e) => {
                        e.preventDefault();
                        updateImage([...e.clipboardData.items].map(i => i.getAsFile()).filter(f => f !== null));
                    },
                }, [
                    m('.puzzle-gen-cover-title', ['Puzzle (', pieceCount, ' pieces)']),
                    m('.puzzle-gen-image-container', {
                        class: dragging > 0 ? 'puzzle-gen-image-container--dragging' : '',
                        style: {
                            width: containerSize[0]+'px',
                            height: containerSize[1]+'px',
                        },
                        onclick: clickUploadEvent,
                        ondragenter: (e) => {
                            e.preventDefault();
                            dragging++;
                        },
                        ondragleave: (e) => {
                            e.preventDefault();
                            dragging--;
                        },
                        ondrop: (e) => {
                            e.preventDefault();
                            updateImage(e.dataTransfer.files);
                            dragging = 0;
                        },
                    }, [
                        m('.puzzle-gen-image-container-helper', ['Drop or paste image here', m('br'), 'click to select file']),
                        m('img.puzzle-gen-image', { 
                            src: imageSrc,
                            onload: function() {
                                resizeImageContainer(this.getBoundingClientRect());
                            }
                        }),
                    ]),
                    m('.puzzle-gen-cover-label', 'Raoulensburger'),
                ]),

                m('.puzzle-gen-controls', [
                    'Pieces: ', m('select', {
                        onchange: (e) => updatePieceCount(e.target.value),
                    }, [
                        50, 100, 200, 300, 400, 500, 700, 800, 1000
                        // @todo: figure out sane values for piece sizes relative to total piece count
                        // (500-1000 pieces = ~ 2*2cm, 200-400 = ~ 3*3cm, 50-100 = ~4*4cm)
                    ].map(val => m('option', { selected: val === pieceCount }, val))),
                    ' ',
                    m('input[type="button"]', {
                        value: "Generate",
                        onclick: generatePuzzle
                    }),
                ]),
            ];
        }
    }
}