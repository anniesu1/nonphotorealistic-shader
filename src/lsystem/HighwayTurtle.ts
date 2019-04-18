import { vec3, vec4, quat, mat4 } from 'gl-matrix';
//import Point from '../lsystem/Point';
//import Edge from '../lsystem/Edge';
import TextureHelper from '../lsystem/TextureHelper';
import Turtle from '../lsystem/Turtle';

export default class HighwayTurtle extends Turtle {

    constructor(pos: vec3, orient: quat, depth: number) {
        super(pos, orient, depth);
    }

    // firstExpand(expansionTurtles: any[]) {
    //     if (this.expandFlag && !this.waterFlag) {
    //       if (!this.rotationFlag) {
    //         let cityCenter0: Point = new Point(vec3.fromValues(420, 0, 1890));
    //         let cityCenter1: Point = new Point(vec3. fromValues(380, 0, 2000));
    //         expansionTurtles.push(this.createNextHighwayTurtleNewTarget(cityCenter0, cityCenter1));
    
    //         let cityCenter2: Point = new Point(vec3.fromValues(850, 0, 1600));
    //         expansionTurtles.push(this.createNextHighwayTurtleNewTarget(cityCenter0, cityCenter2));
    
    //         let cityCenter3: Point = new Point(vec3. fromValues(740, 0, 800));
    //         expansionTurtles.push(this.createNextHighwayTurtleNewTarget(cityCenter2, cityCenter3));
    
    //         let cityCenter4: Point = new Point(vec3. fromValues(2000, 0, 80));
    //         expansionTurtles.push(this.createNextHighwayTurtleNewTarget(cityCenter3, cityCenter4));
    
    //         let cityCenter5: Point = new Point(vec3. fromValues(0, 0, 380));
    //         expansionTurtles.push(this.createNextHighwayTurtleNewTarget(cityCenter3, cityCenter5));
    //       }
    //     }
    //   }
}