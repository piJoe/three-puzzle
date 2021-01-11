import { GameObjectMesh } from 'client/lib/engine/game/GameObjectMesh';
import { ObjectTypes } from 'client/lib/engine/objectTypes';

export class Container extends GameObjectMesh {
    constructor(geometry, material, options) {
        super(geometry, material, options);
        this.objectType = ObjectTypes.CONTAINER;
        this.contents = options.contents ? options.contents : [];
    }

    spawnContent() {
        //@todo: spawn contents in world
        console.log('TODO: spawn contents in world!');
    }
}