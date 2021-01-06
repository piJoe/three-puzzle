import { BufferGeometry } from 'three/src/core/BufferGeometry';
import { MeshBasicMaterial } from 'three/src/materials/MeshBasicMaterial';
import { GameObject } from 'client/lib/engine/game/GameObject';
import { Mesh } from 'three';

export class GameObjectMesh extends GameObject {
    constructor(geometry, material, options = {}) {
        super(options);
        this.type = 'Mesh';

        this.geometry = geometry !== undefined ? geometry : new BufferGeometry();
        this.material = material !== undefined ? material : new MeshBasicMaterial();
    }
}

// extend prototype with methods from mesh
GameObjectMesh.prototype.raycast = Mesh.prototype.raycast;