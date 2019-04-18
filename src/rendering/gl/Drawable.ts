import {gl} from '../../globals';

abstract class Drawable {
  count: number = 0;

  bufIdx: WebGLBuffer;
  bufPos: WebGLBuffer;
  bufNor: WebGLBuffer;
  bufTranslate: WebGLBuffer;
  bufCol: WebGLBuffer;
  bufUV: WebGLBuffer;
  bufTransform1: WebGLBuffer;
  bufTransform2: WebGLBuffer;
  bufTransform3: WebGLBuffer;
  bufTransform4: WebGLBuffer;

  idxGenerated: boolean = false;
  posGenerated: boolean = false;
  norGenerated: boolean = false;
  colGenerated: boolean = false;
  translateGenerated: boolean = false;
  uvGenerated: boolean = false;

  transform1Generated: boolean = false;
  transform2Generated: boolean = false;
  transform3Generated: boolean = false;
  transform4Generated: boolean = false;


  numInstances: number = 0; // How many instances of this Drawable the shader program should draw

  abstract create() : void;

  destory() {
    gl.deleteBuffer(this.bufIdx);
    gl.deleteBuffer(this.bufPos);
    gl.deleteBuffer(this.bufNor);
    gl.deleteBuffer(this.bufCol);
    gl.deleteBuffer(this.bufTranslate);
    gl.deleteBuffer(this.bufUV);
  }

  generateIdx() {
    this.idxGenerated = true;
    this.bufIdx = gl.createBuffer();
  }

  generatePos() {
    this.posGenerated = true;
    this.bufPos = gl.createBuffer();
  }

  generateNor() {
    this.norGenerated = true;
    this.bufNor = gl.createBuffer();
  }

  generateCol() {
    this.colGenerated = true;
    this.bufCol = gl.createBuffer();
  }

  generateTranslate() {
    this.translateGenerated = true;
    this.bufTranslate = gl.createBuffer();
  }

  generateUV() {
    this.uvGenerated = true;
    this.bufUV = gl.createBuffer();
  }

  generateTransform1() {
    this.transform1Generated = true;
    this.bufTransform1 = gl.createBuffer();
  }

  generateTransform2() {
    this.transform2Generated = true;
    this.bufTransform2 = gl.createBuffer();
  }

  generateTransform3() {
    this.transform3Generated = true;
    this.bufTransform3 = gl.createBuffer();
  }

  generateTransform4() {
    this.transform4Generated = true;
    this.bufTransform4 = gl.createBuffer();
  }

  bindIdx(): boolean {
    if (this.idxGenerated) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
    }
    return this.idxGenerated;
  }

  bindPos(): boolean {
    if (this.posGenerated) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
    }
    return this.posGenerated;
  }

  bindNor(): boolean {
    if (this.norGenerated) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
    }
    return this.norGenerated;
  }

  bindCol(): boolean {
    if (this.colGenerated) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufCol);
    }
    return this.colGenerated;
  }

  bindTranslate(): boolean {
    if (this.translateGenerated) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufTranslate);
    }
    return this.translateGenerated;
  }

  // Things Annie wrote
  bindTransform1() : boolean {
    if (this.transform1Generated) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufTransform1);
    }
    return this.transform1Generated;
  }

  bindTransform2() : boolean {
    if (this.transform2Generated) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufTransform2);
    }
    return this.transform2Generated;
  }

  bindTransform3() : boolean {
    if (this.transform3Generated) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufTransform3);
    }
    return this.transform3Generated;
  }

  bindTransform4() : boolean {
    if (this.transform4Generated) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufTransform4);
    }
    return this.transform4Generated;
  }

  bindUV(): boolean {
    if (this.uvGenerated) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufUV);
    }
    return this.uvGenerated;
  }

  elemCount(): number {
    return this.count;
  }

  drawMode(): GLenum {
    return gl.TRIANGLES;
  }

  setNumInstances(num: number) {
    this.numInstances = num;
  }
};

export default Drawable;
