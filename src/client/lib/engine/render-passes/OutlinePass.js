import { Pass } from 'three/examples/jsm/postprocessing/Pass';
import { MeshBasicMaterial } from 'three/src/materials/MeshBasicMaterial';
import { LayerDefintion } from 'client/lib/engine/layers';
import { BufferAttribute, Layers, Vector3 } from 'three';

export class OutlinePass extends Pass {
    constructor(scene, camera, outlinedObjects = []) {
        super();

        this.scene = scene;
        this.camera = camera;
        this.outlinedObjects = outlinedObjects;

        this.blankMaterial = new MeshBasicMaterial({
            color: 0xffffff,
        });

        this.wireframeMaterial = new MeshBasicMaterial({
            color: 0xffff00,
            wireframe: true,
            // depthTest: false,
            depthWrite: false,
        });

        this.ignoreLayers = new Layers();
        this.ignoreLayers.enable(LayerDefintion.INVISIBLE);
    }

    render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
        const oldMaterial = this.scene.overrideMaterial;
        const oldAutoClear = renderer.autoClear;
        const oldLayerMask = this.camera.layers.mask;
        const oldBackground = this.scene.background;
        const oldEnv = this.scene.environment;
        renderer.autoClear = false;

        renderer.setRenderTarget(this.renderToScreen ? null : readBuffer);

        // === render normal scene ===

        renderer.clear(true, true, true);
        renderer.render(this.scene, this.camera);

        // === render outlines ===
        if (this.outlinedObjects.length > 0) {

            for (let obj of this.outlinedObjects) {
                if (obj.layers.test(this.ignoreLayers) || !obj.visible) {
                    continue;
                }
                obj.layers.enable(LayerDefintion.OUTLINE);
            }
            this.camera.layers.set(LayerDefintion.OUTLINE);
            this.scene.background = null;
            this.scene.environment = null;

            // setup mask rendering
            const context = renderer.getContext();
            const state = renderer.state;

            state.buffers.color.setMask(false);
            state.buffers.depth.setMask(false);

            state.buffers.color.setLocked(true);
            state.buffers.depth.setLocked(true);

            // set up stencil

            state.buffers.stencil.setTest(true);
            state.buffers.stencil.setOp(context.KEEP, context.KEEP, context.REPLACE);
            state.buffers.stencil.setFunc(context.ALWAYS, 1, -1);
            state.buffers.stencil.setClear(0);
            state.buffers.stencil.setLocked(true);

            this.scene.overrideMaterial = this.blankMaterial;
            renderer.render(this.scene, this.camera);

            state.buffers.color.setLocked(false);
            state.buffers.depth.setLocked(false);

            state.buffers.stencil.setLocked(false);
            state.buffers.stencil.setFunc(context.NOTEQUAL, 1, -1); // draw if == 1
            state.buffers.stencil.setOp(context.KEEP, context.KEEP, context.REPLACE);
            state.buffers.stencil.setLocked(true);

            this.scene.overrideMaterial = this.wireframeMaterial;
            renderer.render(this.scene, this.camera);

            renderer.state.buffers.stencil.setLocked(false);
            renderer.state.buffers.stencil.setTest(false);

            this.camera.layers.mask = oldLayerMask;
            this.scene.background = oldBackground;
            this.scene.environment = oldEnv;
            for (let obj of this.outlinedObjects) {
                obj.layers.disable(LayerDefintion.OUTLINE);
            }
            this.scene.overrideMaterial = oldMaterial;
        }

        renderer.autoClear = oldAutoClear;
    }
}

export function setupGeometryForOutline(geometry) {
    const vectors = [
        new Vector3(1, 0, 0),
        new Vector3(0, 1, 0),
        new Vector3(0, 0, 1),
    ];

    const position = geometry.attributes.position;
    const centers = new Float32Array(position.count * 3);

    for (let i = 0, l = position.count; i < l; i++) {

        vectors[i % 3].toArray(centers, i * 3);

    }

    geometry.setAttribute('center', new BufferAttribute(centers, 3));
}