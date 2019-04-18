// A DrawingRule class to represent the result of mapping a 
// character to an L-System drawing operation (possibly with multiple 
// outcomes depending on a probability)

import { vec3 } from 'gl-matrix';

export default class DrawingRule {    
    drawFunc: any; // This drawing function will modify a given turtle

    // Pass in a drawing function
    constructor(func: any) {
        this.drawFunc = func;
    }
}
