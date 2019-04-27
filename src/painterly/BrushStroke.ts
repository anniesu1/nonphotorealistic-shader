import { vec2, vec3, mat4, quat } from "gl-matrix";

class BrushStroke {
    pos: vec3;
    orientation: quat;
    scale: vec3;
    transform: mat4;
    color: vec3;

    constructor(pos: vec3, orientation: quat, scale: vec3, color: vec3) {
        this.pos = pos;
        this.orientation = orientation;
        this.scale = scale;
        this.color = color; // TODO: perturb color a bit ?

        // Set the transformation matrix
        this.transform = this.getTransformationMatrix();
    }

    // Should get its own transformation matrix
    getTransformationMatrix() : mat4 {
        // Translate
        let T: mat4 = mat4.create();
        mat4.fromTranslation(T, this.pos); 

        // Rotate
        let R: mat4 = mat4.create();
        mat4.fromQuat(R, this.orientation);

        // Scale
        let S: mat4 = mat4.create();
        mat4.fromScaling(S, this.scale);
        S[0] = 0.5;
        S[5] = 0.5;

        // Multiply together to form transformation matrix
        let transformation: mat4 = mat4.create();
        mat4.multiply(transformation, R, S);
        return mat4.multiply(transformation, T, transformation);
    }
}

export default BrushStroke;