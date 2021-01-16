import { Mesh } from 'three';
import { BufferGeometry } from 'three/src/core/BufferGeometry';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils';

export class MergeGameObjectGroup extends Mesh {
    constructor(material) {
        super(new BufferGeometry(), material);
        this.name = 'Merge Group';
        this.geometryNeedsUpdate = false;
    }

    add(...object) {
        super.add(...object);
        this.geometryNeedsUpdate = true;
        return this;
    }

    remove(...object) {
        super.remove(...object);
        this.geometryNeedsUpdate = true;
        return this;
    }

    updateGeometryIfNeeded() {
        if (this.geometryNeedsUpdate) {
            const geometries = [];
            let offset = 0;
            for (let i = 0; i < this.children.length; i++) {
                const gameObject = this.children[i];
                const bufferGeometry = gameObject.geometry.clone();
                // @todo: apply targetposition before applying matrix?
                bufferGeometry.applyMatrix4(gameObject.matrix);
                const bufferSize = bufferGeometry.attributes.position.count;
                gameObject.mergeOffset = offset;
                offset += bufferSize;
                geometries.push(bufferGeometry);
            }
            this.geometry = BufferGeometryUtils.mergeBufferGeometries(geometries);
            this.geometryNeedsUpdate = false;
        }
    }

    hideVertices(gameObject) {
        this.updateGeometryIfNeeded();

        const offset = gameObject.mergeOffset * 3;
        const mergePositionArray = this.geometry.attributes.position.array;

        for (let i = 0; i < gameObject.geometry.attributes.position.count * 3; i++) {
            mergePositionArray[i + offset] = 0;
        }
        this.geometry.attributes.position.needsUpdate = true;
    }

    updateVertices(gameObject) {
        this.updateGeometryIfNeeded();

        const bufferGeometry = gameObject.geometry.clone().applyMatrix4(gameObject.matrix);
        const offset = gameObject.mergeOffset * 3;
        const newPositionArray = bufferGeometry.attributes.position.array;
        const mergePositionArray = this.geometry.attributes.position.array;

        for (let i = 0; i < bufferGeometry.attributes.position.count * 3; i++) {
            mergePositionArray[i + offset] = newPositionArray[i];
        }
        this.geometry.attributes.position.needsUpdate = true;
    }

    tick() {
        this.updateGeometryIfNeeded();
    }
}