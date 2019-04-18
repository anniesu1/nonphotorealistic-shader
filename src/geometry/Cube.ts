import {vec3, vec4} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';

class Cube extends Drawable {
  indices: Uint32Array;
  positions: Float32Array;
  normals: Float32Array;
  center: vec4;

  colors: Float32Array;
  transform1: Float32Array; // Data for first col of transformation matrix
  transform2: Float32Array;
  transform3: Float32Array;
  transform4: Float32Array;

  constructor(center: vec3) {
    super(); // Call the constructor of the super class. This is required.
    this.center = vec4.fromValues(center[0], center[1], center[2], 1); // Add a homogenous coord
  }

  create() {
    let vertices = [
      [-0.5, 0, -0.5],
      [0.5, 0, -0.5],
      [0.5, 1, -0.5],
      [-0.5, 1, -0.5],
      [-0.5, 0, 0.5],
      [0.5, 0, 0.5],
      [0.5, 1, 0.5],
      [-0.5, 1, 0.5],
    ];
    let vertIndices = [
      0, 1, 3, 3, 1, 2, // Front quad
      1, 5, 2, 2, 5, 6, // Right quad
      5, 4, 6, 6, 4, 7, // Back quad
      4, 0, 7, 7, 0, 3, // Left quad
      3, 2, 7, 7, 2, 6, // Top quad
      4, 5, 0, 0, 5, 1, // Bottom quad
    ];
    let vertNormals = [
      [0, 0, 1], 
      [1, 0, 0], 
      [0, 0, -1], 
      [-1, 0, 0], 
      [0, 1, 0], 
      [0, -1, 0],
    ];

    this.indices = new Uint32Array(36);

    for (let i = 0; i < 36; i++) {
      this.indices[i] = i;
    }

    this.positions = new Float32Array(4 * 36);

    for (let i = 0; i < 36; i++) {
      this.positions[i * 4 + 0] = vertices[vertIndices[i]][0] + this.center[0];
      this.positions[i * 4 + 1] = vertices[vertIndices[i]][1] + this.center[1];
      this.positions[i * 4 + 2] = vertices[vertIndices[i]][2] + this.center[2];
      this.positions[i * 4 + 3] = 1;
    }

    this.normals = new Float32Array(4 * 36);

    for (let i = 0; i < 36; i++) {
      let faceNumber = Math.floor(i / 6);
      this.normals[i * 4 + 0] = vertNormals[faceNumber][0];
      this.normals[i * 4 + 1] = vertNormals[faceNumber][1];
      this.normals[i * 4 + 2] = vertNormals[faceNumber][2];
      this.normals[i * 4 + 3] = 0;
    }

    this.generateIdx();
    this.generatePos();
    this.generateNor();
    this.generateCol();
    this.generateTransform1();
    this.generateTransform2();
    this.generateTransform3();
    this.generateTransform4();

    this.count = this.indices.length;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
    gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
    gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);

    console.log(`Created cube`);
  }

  setInstanceVBOs(colors: Float32Array, transform1: Float32Array,
    transform2: Float32Array, transform3: Float32Array, transform4: Float32Array) {
    this.colors = colors;
    this.transform1 = transform1;
    this.transform2 = transform2;
    this.transform3 = transform3;
    this.transform4 = transform4;
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufCol);
    gl.bufferData(gl.ARRAY_BUFFER, this.colors, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufTransform1);
    gl.bufferData(gl.ARRAY_BUFFER, this.transform1, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufTransform2);
    gl.bufferData(gl.ARRAY_BUFFER, this.transform2, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufTransform3);
    gl.bufferData(gl.ARRAY_BUFFER, this.transform3, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufTransform4);
    gl.bufferData(gl.ARRAY_BUFFER, this.transform4, gl.STATIC_DRAW);
    console.log('Set instance VBOs for cube');
  }
};

export default Cube;
