import {vec3, vec4, vec2} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';
import * as Loader from 'webgl-obj-loader';
//import BrushStroke from '../painterly/BrushStroke';

class Mesh extends Drawable {
  indices: Uint32Array;
  positions: Float32Array;
  normals: Float32Array;
  colors: Float32Array;
  uvs: Float32Array;
  center: vec4;

  offsets: Float32Array;
  transform1: Float32Array; // Data for first col of transformation matrix
  transform2: Float32Array;
  transform3: Float32Array;
  transform4: Float32Array;

  vertices: vec3[] = [];
  triangleAreas: number[] = [];
  expandedTriangleArr: number[] = [];
  numParticles: number = 100;
  particles: vec3[] = [];
  //brushStrokes: BrushStroke[] = [];

  objString: string;

  constructor(objString: string, center: vec3) {
    super(); // Call the constructor of the super class. This is required.
    this.center = vec4.fromValues(center[0], center[1], center[2], 1);

    this.objString = objString;
  }

  create() {  
    // This way you will be able to at least see one mesh instance being drawn.
    this.numInstances = 1;
    
    let posTemp: Array<number> = [];
    let norTemp: Array<number> = [];
    let uvsTemp: Array<number> = [];
    let idxTemp: Array<number> = [];

    var loadedMesh = new Loader.Mesh(this.objString);

    //posTemp = loadedMesh.vertices;
    for (var i = 0; i < loadedMesh.vertices.length; i++) {
      posTemp.push(loadedMesh.vertices[i]);
      if (i % 3 == 2) {
        // Push 4th coordinate
        posTemp.push(1.0);
        // Push to vertices array
        this.vertices.push(vec3.fromValues(posTemp[i - 2], posTemp[i - 1], posTemp[i]));
      }
    }
    // Debugging
    console.log('Num vertices: ' + this.vertices.length);

    // For each triangle, calculate its area
    for (var i = 0; i <= this.vertices.length - 3; i += 3) {
      let v1: vec3 = this.vertices[i];
      let v2: vec3 = this.vertices[i + 1];
      let v3: vec3 = this.vertices[i + 2];
      let side1: vec3 = vec3.create();
      vec3.subtract(side1, v2, v1);
      let side2: vec3 = vec3.create();
      vec3.subtract(side2, v3, v1);
      let cross: vec3 = vec3.create();
      vec3.cross(cross, side1, side2);
      let area: number = 0.5 * vec3.length(cross);
      this.triangleAreas.push(area);
    }

    // Find the smaller value on the array and divide every element by it, 
    // rounding to the next integer
    let minArea: number = Math.min.apply(null, this.triangleAreas);
    for (var i = 0; i < this.triangleAreas.length; i++) {
      this.triangleAreas[i] = Math.ceil(this.triangleAreas[i] / minArea);
    }

    // Add up the elements of the array and initialize a second array of that length, so that 
    // the index i of a triangle is repeated as many times as it’s corresponding values 
    // on the first array
    for (var i = 0; i < this.triangleAreas.length; i++) {
      let currArea: number = this.triangleAreas[i];
      for (var j = 0; j < currArea; j++) {
        this.expandedTriangleArr.push(i);
      }
    }

    // Pick a random element within A2, t = A2[ random(0,1) * length(A2) ] as our triangle index
    for (var i = 0; i < this.numParticles; i++) {
      let length = this.expandedTriangleArr.length;
      let tIdx = this.expandedTriangleArr[Math.round(Math.random() * length)];
      let startVIdx = tIdx * 3;

      // Sample the surface
      let u = Math.random();
      let v = Math.random();
      if (u + v > 1.0) {
        v = 1 - v;
        u = 1 - u;
      }
      let w = 1 - (u + v);
      let vert1 = this.vertices[startVIdx];
      let vert2 = this.vertices[startVIdx + 1];
      let vert3 = this.vertices[startVIdx + 2];
      if (!vert1 || !vert2 || !vert3) {
        console.log("index: " + startVIdx);
      }
      let add1 = vec3.create();
      vec3.scale(add1, vert1, u);
      let add2 = vec3.create();
      vec3.scale(add2, vert2, v);
      let add3 = vec3.create();
      vec3.scale(add3, vert3, w);
      vec3.add(add2, add1, add2);
      vec3.add(add3, add2, add3);
      let sample = add3;

      this.particles.push(sample);
    }
    console.log("Successfully created " + this.particles.length + " particles on the mesh");


    for (var i = 0; i < loadedMesh.vertexNormals.length; i++) {
      norTemp.push(loadedMesh.vertexNormals[i]);
      if (i % 3 == 2) norTemp.push(0.0);
    }
    console.log('Mesh - Num normals: ' + norTemp.length);

    uvsTemp = loadedMesh.textures;
    idxTemp = loadedMesh.indices;

    // white vert color for now
    this.colors = new Float32Array(posTemp.length);
    for (var i = 0; i < posTemp.length; ++i){
      this.colors[i] = 1.0;
    }

    this.indices = new Uint32Array(idxTemp);
    this.normals = new Float32Array(norTemp);
    this.positions = new Float32Array(posTemp);
    this.uvs = new Float32Array(uvsTemp);

    this.generateIdx();
    this.generatePos();
    this.generateNor();
    this.generateUV();
    this.generateCol();

    this.count = this.indices.length;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
    gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
    gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufCol);
    gl.bufferData(gl.ARRAY_BUFFER, this.colors, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufUV);
    gl.bufferData(gl.ARRAY_BUFFER, this.uvs, gl.STATIC_DRAW);

    console.log(`Created Mesh from OBJ`);
    this.objString = ""; // hacky clear
  }

  setInstanceVBOs(colors: Float32Array, transform1: Float32Array, transform2: Float32Array, 
    transform3: Float32Array, transform4: Float32Array) {
    this.colors = colors;
    this.transform1 = transform1;
    this.transform2 = transform2;
    this.transform3 = transform3;
    this.transform4 = transform4;

    this.generateTranslate();
    this.generateTransform1();
    this.generateTransform2();
    this.generateTransform3();
    this.generateTransform4();
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufCol);
    gl.bufferData(gl.ARRAY_BUFFER, this.colors, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufTranslate);
    gl.bufferData(gl.ARRAY_BUFFER, this.offsets, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufTransform1);
    gl.bufferData(gl.ARRAY_BUFFER, this.transform1, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufTransform2);
    gl.bufferData(gl.ARRAY_BUFFER, this.transform2, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufTransform3);
    gl.bufferData(gl.ARRAY_BUFFER, this.transform3, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufTransform4);
    gl.bufferData(gl.ARRAY_BUFFER, this.transform4, gl.STATIC_DRAW);

    // Print 
    console.log('Set the instance VBOs in our mesh');
  }
};

export default Mesh;
