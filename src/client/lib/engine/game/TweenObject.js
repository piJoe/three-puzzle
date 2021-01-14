import { Object3D, Quaternion, Vector3 } from 'three';
import { getGlobalTime } from 'client/lib/engine/game/GlobalTime';

export class TweenObject extends Object3D {
    constructor() {
        super();

        this.startPosition = this.position.clone();
        this.targetPosition = this.position.clone();
        this.startQuaternion = this.quaternion.clone();
        this.targetQuaternion = this.quaternion.clone();
        this.startTimePos = {
            x: -1,
            y: -1,
            z: -1,
        };
        this.startTimeQuat = getGlobalTime();
        this.animDurationPos = {
            x: 50,
            y: 50,
            z: 50,
        };
        this.animDurationQuat = 50;
    }

    moveToTargetPos(vec3, duration = 50) {
        const time = getGlobalTime();
        if (updateAxis('x', vec3, this.targetPosition)) {
            this.startPosition.x = this.position.x;
            this.animDurationPos.x = duration;
            this.startTimePos.x = time;
        }
        if (updateAxis('y', vec3, this.targetPosition)) {
            this.startPosition.y = this.position.y;
            this.animDurationPos.y = duration;
            this.startTimePos.y = time;
        }
        if (updateAxis('z', vec3, this.targetPosition)) {
            this.startPosition.z = this.position.z;
            this.animDurationPos.z = duration;
            this.startTimePos.z = time;
        }
    }

    updatePositionAxis(axis, time) {
        if (this.startTimePos[axis] === -1) return false;
        const alpha = this.animDurationPos[axis] === 0
            ? 1 // always force 1 as alpha when duration is zero
            : (time - this.startTimePos[axis]) / this.animDurationPos[axis];

        if (alpha >= 1.0 || this.startPosition[axis] === this.targetPosition[axis]) {
            this.position[axis] = this.targetPosition[axis];
            this.startTimePos[axis] = -1; //-1 disables updates
            return true;
        }
        this.position[axis] = (1 - alpha) * this.startPosition[axis] + alpha * this.targetPosition[axis];
        // this.position[axis] = this.startPosition[axis] +
        // console.log('updating!', this.position[axis]);
        return true;
    }

    updatePosition(time) {
        let hasChanged = false;
        this.updatePositionAxis('x', time) ? hasChanged = true : undefined;
        this.updatePositionAxis('y', time) ? hasChanged = true : undefined;
        this.updatePositionAxis('z', time) ? hasChanged = true : undefined;
        return hasChanged;
    }

    // updateQuaternion(alpha) {
    //     if (!this.startQuaternion || !this.targetQuaternion || this.startQuaternion.equals(this.targetQuaternion)) {
    //         return;
    //     }
    //     if (alpha >= 1.0) {
    //         this.quaternion.copy(this.targetQuaternion);
    //         this.startQuaternion = null;
    //         this.targetQuaternion = null;
    //         return;
    //     }
    //     const diffQuat = this.startQuaternion.clone().slerp(this.targetQuaternion, alpha);
    //     this.quaternion.copy(diffQuat);
    // }

    tick() {
        const time = getGlobalTime();
        return this.updatePosition(time);
        // this.updateQuaternion(time);
    }
}

export function setTargetPositionGroup(group, propName, anchor, targetVec, duration = 50) {
    if (group.length < 1) return;
    const relVec = targetVec.clone().sub(anchor);
    for (let i = 0; i < group.length; i++) {
        const obj = group[i];
        const pos = obj[propName];
        obj.moveToTargetPos(pos.clone().add(relVec), duration);
    }
}


function updateAxis(axis, inVec, outVec) {
    if (inVec[axis] - outVec[axis] !== 0) {
        outVec[axis] = inVec[axis];
        return true;
    }
    return false;
}
