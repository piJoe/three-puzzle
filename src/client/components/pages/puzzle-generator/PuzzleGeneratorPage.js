import './style.scss';

import m from 'mithril';
import { any } from "ramda";

export const PuzzleGeneratorPage = function PuzzleGeneratorPage() {
    let pieceCount = 300;
    let imageSrc = "";
    let puzzleContainer;
    let dragging = 0;

    const updatePieceCount = (value) => {
        pieceCount = parseInt(value);
    }

    const updateImage = (files) => {
        const images = [...files].filter(({ type }) => type.startsWith('image/'));
        if (images.length > 0) {
            imageSrc = URL.createObjectURL(images[0]);
        }
    }

    const generatePuzzle = () => {
        console.log('me generating like a baws!', pieceCount, imageSrc);
    }

    const dragOverEvent = (e) => {
        e.preventDefault();

        const inTarget = any((d) => d === puzzleContainer, e.path);
        if (!inTarget) {
            e.dataTransfer.dropEffect = 'none';
        }
    }
    const pasteEvent = (e) => {
        e.preventDefault();
        updateImage([...e.clipboardData.items].map(i => i.getAsFile()).filter(f => f !== null));
    }

    const preventDefaultEvent = (e) => {
        e.preventDefault();
    }

    return {
        oncreate: (vnode) => {
            console.log('create', vnode);
            puzzleContainer = vnode.dom.querySelector('.puzzle-gen-image-container');
            document.addEventListener('dragover', dragOverEvent);
            document.addEventListener('drop', preventDefaultEvent);
            document.addEventListener('paste', pasteEvent);
        },

        onremove: () => {
            console.log('remove');
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
                        config: (e) => console.log(e),
                        class: dragging > 0 ? 'puzzle-gen-image-container--dragging' : '',
                        ondragenter: (e) => {
                            console.log('dragenter');
                            e.preventDefault();
                            dragging++;
                        },
                        ondragleave: (e) => {
                            console.log('dragleave');
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
                        m('img.puzzle-gen-image', { src: imageSrc }),
                    ]),
                    m('.puzzle-gen-cover-label', 'Raoulensburger'),
                ]),

                m('.puzzle-gen-controls', [
                    'Pieces: ', m('select', {
                        onchange: (e) => updatePieceCount(e.target.value),
                    }, [
                        50, 100, 200, 300, 400, 500, 700, 800, 1000
                    ].map(val => m('option', { selected: val === pieceCount }, val))),
                    ' ',
                    m('input[type="button"]', {
                        value: "Generate",
                        onclick: generatePuzzle
                    })
                ]),
            ];
        }
    }
}