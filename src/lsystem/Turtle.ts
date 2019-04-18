// A Turtle class to represent the current drawing state of your L-System. 
// It should at least keep track of its current position, current orientation, 
// and recursion depth (how many [ characters have been found while drawing before ]s)

import { vec2, vec3, vec4, quat, mat4 } from 'gl-matrix';

export default class Turtle {
    position: vec3 = vec3.fromValues(0.0, 0.0, 0.0);
    up: vec3 = vec3.fromValues(0, 1, 0);
    orientation: quat;
    scaleFalloff: number = 0.8;
    heightFalloff: number = 0.5;
    branchNumber: number;
    target: vec2 = vec2.create();

    constructor(pos: vec3, orient: quat, branchNumber: number) {
        this.position = pos;
        this.orientation = orient;
        this.branchNumber = branchNumber;
    }

    rotate(alpha: number, beta: number, gamma: number) {
        // Add a bit of noise to the angles
        // var randX = Math.random();
        // randX *= 10; 
        // randX -= 5; // [-5, 5]
        // alpha += randX;
        
        // var randY = Math.random();
        // randY *= 10;
        // randY -= 5; // [-5, 5]
        // beta += randY;
        
        // var randZ = Math.random();
        // randZ *= 10;
        // randZ -= 5; // [-5, 5]
        // gamma += randZ;

        // Create a quaternion to represent the rotation
        let outQuat: quat = quat.create();
        quat.fromEuler(outQuat, alpha, beta, gamma); // Should be in degrees

        // Update the orientation of the turtle
        quat.multiply(this.orientation, this.orientation, outQuat);
    }

    rotateByUp(degrees: number) {
        let q: quat = quat.create();
        quat.setAxisAngle(q, this.up, degrees * Math.PI / 180.0);

        quat.multiply(this.orientation, this.orientation, q);
    
      }

    // Translate the turtle along the input vector.
    // Does NOT change the turtle's _dir_ vector
    moveTurtle(x: number, y: number, z: number) {
        // NOTE: THIS IS UNUSED. NOT DEBUGGED. 
        var newVec = vec3.fromValues(x, y, z);
        let output: vec3 = vec3.create();
        vec3.add(output, this.position, newVec);
        return output;
    };

    // Translate the turtle along its _dir_ vector by the distance indicated
    moveForward(dist: number) {
        let localForward: vec4 = vec4.create();
        let R: mat4 = mat4.create();
        mat4.fromQuat(R, this.orientation);

        // Update forward by the orientation quaternion matrix
        vec4.transformMat4(localForward, vec4.fromValues(this.up[0],
                                                         this.up[1],
                                                         this.up[2],
                                                         1.0), R);
        
        let offset: vec3 = vec3.create();
        offset = vec3.fromValues(localForward[0] * dist,
                                 localForward[1] * dist,
                                 localForward[2] * dist);
        let output: vec3 = vec3.create();
        vec3.add(this.position, this.position, offset);
        return output;
    };

    // Return vec4 forward 
    getForward() : vec4 {
        let localForward: vec4 = vec4.create();
        let R: mat4 = mat4.create();
        mat4.fromQuat(R, this.orientation);

        // Update forward by the orientation quaternion matrix
        vec4.transformMat4(localForward, vec4.fromValues(this.up[0],
                                                         this.up[1],
                                                         this.up[2],
                                                         1.0), R);
        return localForward;
    }

    // Should get its own transformation matrix TODO: update for road branching
    getTransformationMatrix(roadType: string) : mat4 {
        // Translate
        let T: mat4 = mat4.create();
        mat4.fromTranslation(T, this.position); 

        // Rotate
        let R: mat4 = mat4.create();
        mat4.fromQuat(R, this.orientation);

        // Scale
        let S: mat4 = mat4.create();
 
        // Scaling values differ based on road type
        if (roadType === 'highway') {
            mat4.fromScaling(S, vec3.fromValues(.01, 0.1, 1.0));
        } else if (roadType === 'road') {
            mat4.fromScaling(S, vec3.fromValues(0.1, 0.1, 0.1));
        } else if (roadType === 'square') {
            mat4.fromScaling(S, vec3.fromValues(0.05, 0.05, 0.05));
        }

        // Multiply together to form transformation matrix
        let transformation: mat4 = mat4.create();
        mat4.multiply(transformation, R, S);
        return mat4.multiply(transformation, T, transformation);
    }

    // Make a copy of this current Turtle
    makeCopy() : Turtle {
        let posCopy: vec3 = vec3.create();
        vec3.copy(posCopy, this.position);
        let orientCopy: quat = quat.create();
        quat.copy(orientCopy, this.orientation);
    
        return new Turtle(posCopy, orientCopy, this.branchNumber);
    }

    // Write over the current info with that of the input Turtle
    writeOver(turtle: Turtle) {
        vec3.copy(this.position, turtle.position);
        quat.copy(this.orientation, turtle.orientation);
        this.branchNumber = turtle.branchNumber;
    }
}