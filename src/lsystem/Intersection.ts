import {vec3, vec4, mat4, quat, glMatrix, vec2} from 'gl-matrix';
import Edge from './Edge'; 


class Intersection {
    position: vec2;

    constructor () {
        // Set a default location
        this.position = vec2.fromValues(1.0, 1.0);
    }

    getPos() : vec2 {
        return vec2.fromValues(this.position[0], this.position[1]);
    }

    setPos(newPos: vec2) {
        let input: vec2 = vec2.fromValues(newPos[0], newPos[1]);
        this.position =  input;
    }

    // Return whether the two input edges intersect (referenced from Emily's senior design)
    intersect(edge1: Edge, edge2: Edge) : boolean {
        let x11 = edge1.origin[0];
        let y11 = edge1.origin[1];
        let x12 = edge1.endpoint[0];
        let y12 = edge1.endpoint[1];

        let x21 = edge2.origin[0];
        let y21 = edge2.origin[1];
        let x22 = edge2.endpoint[0];
        let y22 = edge2.endpoint[1];

        let X: number;
        let Y: number;
        let epsilon = 0.00000001

        if (Math.abs(x11 - x12) < epsilon) {
            X = x11;
            if (Math.abs(x21 - x22) < epsilon) {
                return false;
            }
            let m2 = (y21 - y22) / (x21 - x22);
            Y = m2 * (X - x21) + y21;
        } else if (Math.abs(x21 - x22) < epsilon) {
            X = x21;
            let m1 = (y11 - y12) / (x11 - x12);
            Y = m1 * (X - x11) + y11;
        } else {
            let m1 = (y11 - y12) / (x11 - x12);
            let m2 = (y21 - y22) / (x21 - x22);
            if (Math.abs(m1 - m2) < epsilon) {
                return false;
            } else {
                X = (m2 * x21 - m1 * x11 + y11 - y21) / (m2 - m1);
                Y = m1 * (X - x11) + y11;
            }
        }

        if (X < Math.min(x11, x12) || X > Math.max(x11, x12) || Y < Math.min(y11, y12) || Y > Math.max(y11, y12) || 
            X < Math.min(x21, x22) || X > Math.max(x21, x22) || Y < Math.min(y21, y22) || Y > Math.max(y21, y22)) {
                return false;
        }

        // Update the position of the intersection accordingly
        this.position = vec2.fromValues(X, Y);

        return true;
    }

}

export default Intersection;