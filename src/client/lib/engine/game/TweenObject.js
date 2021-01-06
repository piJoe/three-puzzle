import { Object3D, Vector3 } from 'three';
import { getGlobalTime } from 'client/lib/engine/game/GlobalTime';

export class TweenObject extends Object3D {
    constructor() {
        super();

        this.startPosition = null;
        this.targetPosition = null;
        this.startQuaternion = null;
        this.targetQuaternion = null;
        this.startTime = null;
        this.animDuration = 50;
    }

    setTargetPosition(vec3) {
        this.startPosition = this.position.clone();
        this.targetPosition = vec3;
        this.startTime = getGlobalTime();
    }

    setTargetPositionX(x) {
        let vec = this.position.clone();
        if (this.targetPosition) {
            vec.copy(this.targetPosition);
        }
        vec.x = x;
        this.setTargetPosition(vec);
    }

    setTargetPositionY(y) {
        let vec = this.position.clone();
        if (this.targetPosition) {
            vec.copy(this.targetPosition);
        }
        vec.y = y;
        this.setTargetPosition(vec);
    }

    setTargetPositionZ(z) {
        let vec = this.position.clone();
        if (this.targetPosition) {
            vec.copy(this.targetPosition);
        }
        vec.z = z;
        this.setTargetPosition(vec);
    }

    setTargetQuaternion(quat) {
        this.startQuaternion = this.quaternion.clone();
        this.targetQuaternion = quat;
        this.startTime = getGlobalTime();
    }

    updatePosition(alpha) {
        if (!this.startPosition || !this.targetPosition || this.startPosition.equals(this.targetPosition)) {
            return;
        }
        if (alpha >= 1.0) {
            this.position.copy(this.targetPosition);
            this.startPosition = null;
            this.targetPosition = null;
            return;
        }
        this.position.lerpVectors(this.startPosition, this.targetPosition, alpha);
    }

    updateQuaternion(alpha) {
        if (!this.startQuaternion || !this.targetQuaternion || this.startQuaternion.equals(this.targetQuaternion)) {
            return;
        }
        if (alpha >= 1.0) {
            this.quaternion.copy(this.targetQuaternion);
            this.startQuaternion = null;
            this.targetQuaternion = null;
            return;
        }
        const diffQuat = this.startQuaternion.clone().slerp(this.targetQuaternion, alpha);
        this.quaternion.copy(diffQuat);
    }

    tick() {
        if (!this.startTime) {
            return;
        }
        const time = getGlobalTime();
        const alpha = (time - this.startTime) / this.animDuration;
        this.updatePosition(alpha);
        this.updateQuaternion(alpha);
    }
}
