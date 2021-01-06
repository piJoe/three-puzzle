import { TweenObject } from 'client/lib/engine/game/TweenObject';
import { BufferGeometry } from 'three/src/core/BufferGeometry';
import { MeshBasicMaterial } from 'three/src/materials/MeshBasicMaterial';
import { LayerDefintion } from 'client/lib/engine/layers';

export class GameObject extends TweenObject {
    constructor(options = {}) {
        super();
        this.type = 'Mesh';
        this.name = options.name ? options.name : 'GameObject';

        this.isFrozen = options.frozen ? options.frozen : false;
        this.isSelectable = options.selectable ? options.selectable : true;

        // this.parentGameObject = null;
        this.group = null;

        this.shadowMesh = null;
        this.selectMesh = null;
        if (options.shadowMesh) {
            this.shadowMesh = options.shadowMesh;
            this.shadowMesh.visible = false;
            this.shadowMesh.layers.set(LayerDefintion.IGNORE_RAYCAST);
            this.add(this.shadowMesh);
        }
        if (options.selectMesh) {
            this.selectMesh = options.selectMesh;
            this.selectMesh.visible = false;
            this.selectMesh.layers.set(LayerDefintion.IGNORE_RAYCAST);
            this.add(this.selectMesh);
        }
    }

    select() {
        if (this.selectMesh === null) return;
        this.selectMesh.visible = true;
    }

    unselect() {
        if (this.selectMesh === null) return;
        this.selectMesh.visible = false;
    }

    canBeSelected() {
        if (this.group !== null) {
            return this.getGroupLeader().isSelectable;
        }
        return this.isSelectable;
    }

    onPickUp(event) {

    }

    onDrop(event) {

    }

    updateGroup(newGroup) {
        this.group = newGroup;
    }

    addGroup(otherObject) {
        if (this.group === null) {
            this.group = [this, otherObject];
        }
        for (let i = 0; i < this.group.length; i++) {
            const gObj = this.group[i];
            gObj.updateGroup(this.group);
        }
    }

    removeFromGroup() {
        if (this.group === null) return;
        for (let i = 0; i < this.group.length; i++) {
            const gObj = this.group[i];
            if (gObj === this) {
                this.group.splice(i, 1);
                this.group = null;
                return;
            }
        }
    }

    getGroupLeader() {
        return this.group !== null && this.group.length > 0 ? this.group[0] : this;
    }
}