import { vec2, vec3, vec4, mat4, quat, glMatrix } from 'gl-matrix';
import Turtle from './Turtle';
import ExpansionRule from './ExpansionRule';
import DrawingRule from './DrawingRule';
import ShaderProgram from '../rendering/gl/ShaderProgram';
import Intersection from './Intersection';
import Edge from './Edge';
import TextureHelper from './TextureHelper';
//import { transformMat2 } from 'gl-matrix/src/gl-matrix/vec2';

export default class LSystem {
    highwayTurtle: Turtle = new Turtle(vec3.fromValues(0, 0, 0), 
                                quat.create(), 0); // Current turtle
    roadTurtle: Turtle = new Turtle(vec3.fromValues(0, 0, 0), 
                                quat.create(), 0); // Current turtle
    currTurtle: Turtle = new Turtle(vec3.fromValues(0, 0, 0), 
                                    quat.create(), 0); // Current turtle
    firstHighway: boolean = false;
    turtleHistory: Turtle[] = []; // Stack of turtle history
    drawingRules: Map<string, any> = new Map(); // Map of drawing rules
    expansionRules : Map<string, any> = new Map();
    grammar: string;
    numIterations: number;
    rotationAngle: number;
    highwayT: mat4[] = [];
    roadT: mat4[] = [];

    highwayEdges: Array<Edge> = new Array<Edge>();
    intersections: Array<Intersection> = new Array<Intersection>();
    edges: Array<Edge> = new Array<Edge>();

    width: number;
    height: number;
    texture: Uint8Array;
    textureHelper: TextureHelper;

    city1: vec2 = vec2.fromValues(-0.8, -0.5);
    city2: vec2 = vec2.fromValues(-0.3, 0.2);
    city3: vec2 = vec2.fromValues(0.9, -0.8);

    highwayLength: number = 0.1;

    constructor(axiom: string, numIterations: number, rotationAngle: number, 
                highwayT: mat4[], roadT: mat4[], width: number, height: number, 
                texture: Uint8Array) {
        // Set some member vars
        this.grammar = axiom;
        this.numIterations = numIterations;
        this.rotationAngle = rotationAngle;
        this.highwayT = highwayT;
        this.roadT = roadT;
        this.highwayTurtle = new Turtle(vec3.fromValues(0.0, 0.0, 0.0),
                                 quat.create(), 0);
        this.roadTurtle = new Turtle(vec3.fromValues(0.0, 0.0, 0.0), quat.create(), 0); // TODO: make starting location random
        this.width = width;
        this.height = height;

        // Copy the texture input into LSystem object
        this.texture = new Uint8Array(texture.length);
        for (var i = 0; i < texture.length; i++) {
          this.texture[i] = texture[i];
        }

        this.textureHelper = new TextureHelper(this.texture, this.width, this.height);

        // Set drawing rules
        this.setInitialDrawingRules();

        // Set expansion rules
        let fExpansions = new Map();
        fExpansions.set(.35, "FFL[+FL][-FL][+FL]"); // y direction
        fExpansions.set(.32, "FF[&FL][^FL]"); // z direction
        fExpansions.set(.33, "FF[,FL][/FL]"); // x direction

        let fRule = new ExpansionRule("F", fExpansions);
        this.expansionRules.set("F", fRule);

        let aExpansions = new Map();
        aExpansions.set(1.0, "[&FL!A]/////’[&FL!A]///////’[&FL!A]");
        let aRule = new ExpansionRule("A", aExpansions);
        this.expansionRules.set("A", aRule);
        
        let sExpansions = new Map();
        sExpansions.set(1.0, "FL");
        let sRule = new ExpansionRule("S", sExpansions);
        this.expansionRules.set("S", sRule);

        // Set up highway turtles at each city center
        this.currTurtle = new Turtle(vec3.fromValues(-0.8, -0.5, 1), quat.create(), 1);
        // this.highwayT.push(this.currTurtle.getTransformationMatrix('square'));
        this.currTurtle.target = this.city2;
        this.turtleHistory.push(this.currTurtle);
        let intersection1 = new Intersection();
        intersection1.setPos(vec2.fromValues(this.currTurtle.position[0], this.currTurtle.position[1]));
        this.intersections.push(intersection1);

        this.currTurtle = new Turtle(vec3.fromValues(-0.3, 0.2, 1), quat.create(), 1);
        this.currTurtle.target = this.city3;
        this.turtleHistory.push(this.currTurtle);
        // this.highwayT.push(this.currTurtle.getTransformationMatrix('square'));

        let intersection2 = new Intersection();
        intersection2.setPos(vec2.fromValues(this.currTurtle.position[0], this.currTurtle.position[1]));
        this.intersections.push(intersection2);

        this.currTurtle = new Turtle(vec3.fromValues(.9, -0.8, 1), quat.create(), 1);
        this.currTurtle.rotate(0, 0, 60);
        this.currTurtle.target = this.city1;
        this.turtleHistory.push(this.currTurtle);
        // this.highwayT.push(this.currTurtle.getTransformationMatrix('square'));
        this.currTurtle.moveForward(0.1);
//        this.highwayT.push(this.currTurtle.getTransformationMatrix('highway'));

        let intersection3 = new Intersection();
        intersection3.setPos(vec2.fromValues(this.currTurtle.position[0], this.currTurtle.position[1]));
        this.intersections.push(intersection3);

        // Begin expansion
        this.expandHighway(numIterations);
    }

    expandHighway(numIterations: number) {
        let counter = 0;
        while (this.turtleHistory.length != 0 && counter < numIterations) {
            counter++; 

            this.currTurtle = this.turtleHistory.pop();

            if (this.firstHighway) {
                this.firstHighway = false;

                // Branching of 3
                let theta1 = this.rotationAngle;
                let theta2 = 0;
                let theta3 = -this.rotationAngle;

                let realTurtle1 = new Turtle(vec3.fromValues(this.currTurtle.position[0], this.currTurtle.position[1], this.currTurtle.position[2]), 
                                            this.currTurtle.orientation,
                                            this.currTurtle.branchNumber - 1);
                
                let realTurtle2 = new Turtle(vec3.fromValues(this.currTurtle.position[0], this.currTurtle.position[1], this.currTurtle.position[2]),
                                                this.currTurtle.orientation, 
                                                this.currTurtle.branchNumber - 1);

                let realTurtle3 = new Turtle(vec3.fromValues(this.currTurtle.position[0], this.currTurtle.position[1], this.currTurtle.position[2]), 
                                                this.currTurtle.orientation,
                                                this.currTurtle.branchNumber - 1);    
                // Move pivot
                realTurtle1.moveForward(-0.05);
                realTurtle2.moveForward(-0.05);
                realTurtle3.moveForward(-0.05);
                                                
                realTurtle1.rotate(0, 0, theta1);
                realTurtle2.rotate(0, 0, theta2);
                realTurtle3.rotate(0, 0, theta3);

                realTurtle1.moveForward(0.05);
                realTurtle2.moveForward(0.05);
                realTurtle3.moveForward(0.05);

                this.currTurtle = realTurtle1;
                if (this.satisfyConstraints()) {
                    this.turtleHistory.push(realTurtle1);
                }
                this.currTurtle = realTurtle2;
                if (this.satisfyConstraints()) {
                    this.turtleHistory.push(realTurtle2);
                }
                this.currTurtle = realTurtle3;
                if (this.satisfyConstraints()) {
                    this.turtleHistory.push(realTurtle3);
                }
            } else {
                // Branching of 1
                let rotateAmt1 = (this.rotationAngle * Math.random() - 60);
                let rotateAmt2 = 0

                let testTurtle1 = new Turtle(vec3.fromValues(this.currTurtle.position[0], this.currTurtle.position[1], this.currTurtle.position[2]), 
                                            this.currTurtle.orientation,
                                            this.currTurtle.branchNumber - 1);
                testTurtle1.target = this.currTurtle.target;
                let testTurtle2 = new Turtle(vec3.fromValues(this.currTurtle.position[0], this.currTurtle.position[1], this.currTurtle.position[2]), 
                                            this.currTurtle.orientation,
                                            this.currTurtle.branchNumber - 1);
                testTurtle2.target = this.currTurtle.target;

                // testTurtle1.rotate(0, 0, rotateAmt2);
                // testTurtle2.rotate(0, 0, rotateAmt2);

                testTurtle1.moveForward(0.05);
                testTurtle2.moveForward(0.05);

                testTurtle1.rotate(0, 0, rotateAmt1);
                testTurtle2.rotate(0, 0, rotateAmt2);

                testTurtle1.moveForward(-0.05);
                testTurtle2.moveForward(-0.05);

                let distance1 = vec2.distance(vec2.fromValues(testTurtle1.position[0], testTurtle1.position[1]), 
                                              this.currTurtle.target);
                let distance2 = vec2.distance(vec2.fromValues(testTurtle2.position[0], testTurtle2.position[1]), 
                                              this.currTurtle.target);

                let pop1 = this.textureHelper.getPopulation(testTurtle1.position[0], testTurtle1.position[1]);
                let pop2 = this.textureHelper.getPopulation(testTurtle2.position[0], testTurtle2.position[1]);

                if (pop1 > pop2) {
                    this.currTurtle.rotate(0, 0, rotateAmt1);  
                }  else {
                    this.currTurtle.rotate(0, 0, rotateAmt2);
                }

                if (this.satisfyConstraints()) {
                    this.turtleHistory.push(this.currTurtle);
                }
            }
        }
    }

    outOfBounds(x: number, y: number) : boolean {
        if (x < -1 || x > 1 || y < -1 || y > 1) {
            return true;
        }
        return false;
    }

    intersect(testEdge: Edge) {
        let minIntersection = new Intersection();
        let intersect: boolean = false;
        for (var i = 0; i < this.edges.length; i++) {
            let currIntersection = new Intersection();
            if (currIntersection.intersect(testEdge, this.edges[i])) {
                intersect = true;
                let currDist = vec2.distance(vec2.fromValues(testEdge.origin[0], testEdge.origin[1]), currIntersection.getPos()); 
                let prevDist = vec2.distance(vec2.fromValues(testEdge.origin[0], testEdge.origin[1]), minIntersection.getPos());
                if (currDist < prevDist) {
                    minIntersection.position = vec2.fromValues(currIntersection.position[0], currIntersection.position[1]);
                }
            }
        }
        if (!intersect) {
            return;
        }
        let distance = vec2.distance(vec2.fromValues(testEdge.origin[0], testEdge.origin[1]), minIntersection.getPos());
        if (distance < 0.000000000000001) {
            return;
        }
        testEdge.setLength(distance);
    }

    snapToIntersection(e: Edge) {
        let endpointX = e.endpoint[0];
        let endpointY = e.endpoint[1];
        let radius = e.length / 2.0;
        let snap = false;
        

        let minIntersection = new Intersection();
        let minDist = 1000000;
        for (var i = 0; i < this.intersections.length; i++) {
            let intersectionPoint = vec2.fromValues(this.intersections[i].getPos()[0], this.intersections[i].getPos()[1]);
            let currDist = vec2.distance(vec2.fromValues(endpointX, endpointY), intersectionPoint); 
            if (currDist < radius && currDist < minDist) {
                snap = true;
                minIntersection = this.intersections[i];
                minDist = currDist;
            } 
        }
        if (snap) {
            let newDirection = vec2.fromValues(minIntersection.position[0] - e.origin[0], minIntersection.position[1] - e.origin[1]);
            let oldDirection = vec2.fromValues(e.direction[0], e.direction[1]);
            let angle = vec2.angle(oldDirection, newDirection);
            angle = 180.0 * angle / Math.PI;
            this.currTurtle.rotate(0, 0, angle);
            let forward = this.currTurtle.getForward();
            e.setDirection(vec3.fromValues(forward[0], forward[1], 0));
            e.setLength(vec2.distance(vec2.fromValues(e.origin[0], e.origin[1]), minIntersection.getPos()));
        }
    }


    satisfyConstraints() : boolean {
        let forward = this.currTurtle.getForward(); 
        let newEdge = new Edge(this.currTurtle.position, this.highwayLength + Math.random() * 0.02 - 0.01,
                               vec3.fromValues(forward[0], forward[1], forward[2]), this.width);
        let prevLength = newEdge.length;
        this.intersect(newEdge);
        this.snapToIntersection(newEdge);
        let newLength = newEdge.length;

        // if (this.textureHelper.getElevation(newEdge.origin[0], newEdge.origin[1]) < 0.35 || 
        //     this.textureHelper.getElevation(newEdge.endpoint[0], newEdge.endpoint[1]) < 0.35) {
        //     // Check if road is under the sea
        //     return false;
        // } 
        if (this.outOfBounds(newEdge.endpoint[0], newEdge.endpoint[1])) {
            // Check if road is out of bounds
            return false;
        } else {
            this.highwayEdges.push(newEdge);
            let currIntersection = new Intersection();
            currIntersection.setPos(vec2.fromValues(newEdge.endpoint[0], newEdge.endpoint[1]));
            this.intersections.push(currIntersection);
            let transform = this.currTurtle.getTransformationMatrix('highway');

            this.highwayT.push(transform);
            this.currTurtle.moveForward(newEdge.length);
            return true;
        }
    }

    setInitialDrawingRules() {
        // let self = this;

        // function popTurtle() {
        //     let poppedTurtle = self.turtleHistory.pop();
        //     self.turtle.writeOver(poppedTurtle);
        // };

        // function pushTurtle() {
        //     let copiedTurtle = self.turtle.makeCopy();
        //     self.turtleHistory.push(copiedTurtle);
        //     self.turtle.depth++;
        // };

        // function turnLeft() {
        //     self.turtle.rotate(self.rotationAngle, 0.0, 0.0);
        // }; // +x

        // function turnRight() {
        //     self.turtle.rotate(-self.rotationAngle, 0.0, 0.0);
        // }; // -x

        // function pitchDown() {
        //     self.turtle.rotate(0.0, self.rotationAngle, 0.0);
        // }; // +y

        // function pitchUp() {
        //     self.turtle.rotate(0.0, -self.rotationAngle, 0.0);
        // }; // -y

        // function rollLeft() {
        //     self.turtle.rotate(0.0, 0.0, self.rotationAngle);
        // }; // +z

        // function rollRight() {
        //     self.turtle.rotate(0.0, 0.0, -self.rotationAngle);
        // }; // -z

        // function turnAround() {
        //     self.turtle.rotate(0.0, Math.PI, 0.0);
        // }; // +y 180 degrees

        // function drawBranch() {
        //     self.turtle.moveForward(0.6 * Math.pow(0.8, self.turtle.depth));
        //     self.branchT.push(self.turtle.getTransformationMatrix("branch"));
        // };

        // function drawLeaf() {
        //     let branchHeight = 3.0 * Math.pow(self.turtle.heightFalloff, self.turtle.depth);
        //     self.turtle.moveForward(branchHeight + 1.2 * Math.pow(0.8, self.turtle.depth));
        //     self.leafT.push(self.turtle.getTransformationMatrix("leaf"));
        // };

        // let popTurtleDR = new DrawingRule(popTurtle.bind(this));
        // let pushTurtleDR = new DrawingRule(pushTurtle.bind(this));
        // let turnLeftDR = new DrawingRule(turnLeft.bind(this)); 
        // let turnRightDR = new DrawingRule(turnRight.bind(this));
        // let pitchDownDR = new DrawingRule(pitchDown.bind(this));
        // let pitchUpDR = new DrawingRule(pitchUp.bind(this));
        // let rollLeftDR = new DrawingRule(rollLeft.bind(this));
        // let rollRightDR = new DrawingRule(rollRight.bind(this));
        // let turnAroundDR = new DrawingRule(turnAround.bind(this));

        // let drawBranchDR = new DrawingRule(drawBranch);
        // let drawLeafDR = new DrawingRule(drawLeaf);

        // this.drawingRules.set("[", pushTurtleDR);
        // this.drawingRules.set("]", popTurtleDR);
        // this.drawingRules.set("+", turnLeftDR);
        // this.drawingRules.set("-", turnRightDR);
        // this.drawingRules.set("&", pitchDownDR);
        // this.drawingRules.set("^", pitchUpDR);
        // this.drawingRules.set(',', rollLeftDR);
        // this.drawingRules.set("/", rollRightDR);
        // this.drawingRules.set("|", turnAroundDR);

        // this.drawingRules.set("F", drawBranchDR);
        // this.drawingRules.set("L", drawLeafDR);
    }


    draw() : void {
        for (let i = 0; i < this.grammar.length; i++) {
            let currChar = this.grammar.charAt(i);
            let dr = this.drawingRules.get(currChar);
            if (!dr) {
                return;
            }
            let func = dr.drawFunc;
            if (func) {
                func();
            }
        }
    }

    
}