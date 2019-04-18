import { vec2, mat4 } from "gl-matrix";

class Building {
    x: number;
    y: number;
    gridWidth: number;
    gridHeight: number;
    rotationAngle: number;
    transforms: mat4[];

    constructor(x: number, y: number, gridWidth: number, gridHeight: number) {
        this.x = x;
        this.y = y;
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
        this.rotationAngle = Math.random() * 2 * Math.PI; // Will rotate about Y axis
        this.transforms = [];
    }

    create() : number {
        // Sample noise function to jitter population (but population generally falls off from 
        // the center of the grid)
        let gridCenter: vec2 = vec2.fromValues(this.gridWidth / 2, this.gridHeight / 2);
        let distanceFromCenter: number = vec2.distance(vec2.fromValues(this.x, this.y), gridCenter);
        let height: number;
        if (distanceFromCenter < 20.0) {
            height = Math.max(5.0, 25.0 - Math.pow(distanceFromCenter, 0.8));
        } else if (distanceFromCenter < 30.0) {
            height = Math.max(3.0, 25.0 - Math.pow(distanceFromCenter, 1.2));
        } else {
            height = Math.max(2.0, 25.0 - Math.pow(distanceFromCenter, 1.4));

        }
        height += Math.max(0.0, (Math.random() - 0.5) * 10.0);
        let initialHeight: number = height;

        // Save the transforms state
        let T: mat4 = this.getTransformationMatrix(height, 
            vec2.fromValues(this.x, this.y), this.rotationAngle);
        this.transforms.push(T);
        
        for (let i = 0; i < 3; i++) {
            console.log('initial height: ' + initialHeight);
            // Walk down a random distance based on some height
            height -= Math.random() * 3.5;

            if (height < 1.2) {
                break;
            }

            // At lower height, create a new polygon with a different center (jitter x and z) (save transforms state)
            let rotationAngle: number = Math.random() * 2 * Math.PI;
            let center: vec2 = vec2.fromValues(this.x + (Math.random() - 0.5) * 2.0, this.y + (Math.random() - 0.5) * 2.0);
            let newT: mat4 = this.getTransformationMatrix(height, center, rotationAngle);

            // Modify the scaling based on height
            let xScale: number = 1.0;
            let yScale: number = 1.0;
            let zScale: number = 1.0;
            if (initialHeight > 9.0) {
                xScale = 1.2;
            } else if (initialHeight > 3.0) {
                xScale = 1.1;
            } else {
                xScale = 2.0 * ((Math.random() + 1) / 2.0);
                yScale = 0.65;
                zScale = 2.0 * ((Math.random() + 1) / 2.0);
            }
            newT[0] *= xScale;
            newT[5] *= yScale;
            newT[10] *= zScale;

            let newLength: number = this.transforms.push(newT);
        }
        return height;
    }

    getTransformationMatrix(height: number, center: vec2, rotationAngle: number) : mat4 {
        let transform: mat4 = mat4.create();
        transform[5] = height;
        transform[12] = center[0] - this.gridWidth / 2;
        transform[14] = center[1] - this.gridHeight / 2;
        mat4.rotateY(transform, transform, rotationAngle);

        return transform;
    }

    getTransforms() : mat4[] {
        return this.transforms;
    }
}

export default Building;