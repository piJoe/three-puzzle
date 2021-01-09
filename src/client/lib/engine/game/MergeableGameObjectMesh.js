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

    tick() {
        const changed = super.tick();

        if (changed && this.visible === false) {
            this.visible = true;
            this.mergeGroup.hideVertices(this);
            this.lastChanged = getGlobalTime();
            return;
        }

        if (!changed &&
            this.visible === true &&
            !this.isPicked &&
            !this.isSelected &&
            getGlobalTime() - this.lastChanged > CHANGE_TRESHOLD) {

            this.visible = false;
            this.mergeGroup.updateVertices(this);
        }
    }
}