import { GameObjectMesh } from 'client/lib/engine/game/GameObjectMesh';
import { getGlobalTime } from 'client/lib/engine/game/GlobalTime';

const CHANGE_TRESHOLD = 100;

export class MergeableGameObjectMesh extends GameObjectMesh {
    constructor(mergeGroup, geometry, options) {
        super(geometry, mergeGroup.material, options);
        this.mergeGroup = mergeGroup;
        this.lastChanged = 0;
        this.mergeOffset = 0;
        this.visible = false;

        this.mergeGroup.add(this);
    }

    detachFromMergeGroup() {
        this.visible = true;
        this.mergeGroup.hideVertices(this);
        this.lastChanged = getGlobalTime();
    }

    attachToMergeGroup() {
        this.visible = false;
        this.mergeGroup.updateVertices(this);
    }

    tick() {
        const changed = super.tick();

        if (changed && this.visible === false) {
            this.detachFromMergeGroup();
            return true;
        }

        if (!changed &&
            this.visible === true &&
            !this.isPicked &&
            !this.isSelected &&
            getGlobalTime() - this.lastChanged > CHANGE_TRESHOLD) {
            this.attachToMergeGroup();
        }
        return changed;
    }
}