import {vec2, vec3, vec4, mat4, quat} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Square from './geometry/Square';
import ScreenQuad from './geometry/ScreenQuad';
import Cube from './geometry/Cube';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL, readTextFile} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import Texture from './rendering/gl/Texture';
import Mesh from './geometry/Mesh';
import BrushStroke from './painterly/BrushStroke';

// TODO: GET RID OF LEGACY CODE 
import Plane from './geometry/Plane';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
};

// Geometry
let square: Square; // Brush stroke
let screenQuad: ScreenQuad;
let plane: Plane;
let cube: Cube;
let sphereObj: string = readTextFile('./src/sphere.obj');
let sphere: Mesh;

// Textures
let brushStroke1: Texture;
let brushStroke2: Texture;
let brushStroke3: Texture;

// Reference pictures for the brush stroke
const targetTextureWidth = 256;
const targetTextureHeight = 256;
let colorRef: WebGLTexture;

// Transforms
let brushT: mat4[] = [];
let brushCol: vec4[] = [];

// Misc.
let time: number = 0.0;

function loadScene() {
  // Create geometry
  square = new Square();
  square.create();
  cube = new Cube(vec3.fromValues(0, 0, 0));
  cube.create();
  sphere = new Mesh(sphereObj, vec3.fromValues(0.0, 0.0, 0.0));
  sphere.create();

  // Create textures
  // TODO: why does it only work with 1 set brush stroke type?
  brushStroke1 = new Texture('../textures/brush_stroke_01.png', 0);
  brushStroke2 = new Texture('../textures/brush_stroke_02.png', 0);
  brushStroke3 = new Texture('../textures/brush_stroke_03.png', 0);

  // Create background
  screenQuad = new ScreenQuad();
  screenQuad.create();
  plane = new Plane(vec3.fromValues(0,0,0), vec2.fromValues(100,100), 20);
  plane.create();

  // Create a dummy square
  // let identity: mat4 = mat4.create();
  // let transforms: mat4[] = [];
  // transforms.push(identity);
  // setTransformArrays(transforms, vec4.fromValues(1, 0, 0, 1));

  // Create a dummy sphere
  let identity: mat4 = mat4.create();
  let transforms: mat4[] = [];
  transforms.push(identity);
  let sphereCol: vec4[] = [];
  sphereCol.push(vec4.fromValues(1, 0, 0, 1));
  setTransformArrays(transforms, sphereCol, sphere);
}

function setTransformArrays(transforms: mat4[], col: vec4[], geom: any) {
  // Debug
  if (transforms.length != col.length) {
    console.log('WARNING: number of transformations and colors do not match for VBO');
  }

  // Set up instanced rendering data arrays here.
  let colorsArray = [];
  let n: number = 100.0;
  let transform1Array = [];
  let transform2Array = [];
  let transform3Array = [];
  let transform4Array = [];

  for (let i = 0; i < transforms.length; i++) {
    let T = transforms[i];

    // Column 1
    transform1Array.push(T[0]);
    transform1Array.push(T[1]);
    transform1Array.push(T[2]);
    transform1Array.push(T[3]);

    // Column 2
    transform2Array.push(T[4]);
    transform2Array.push(T[5]);
    transform2Array.push(T[6]);
    transform2Array.push(T[7]);

    // Column 3
    transform3Array.push(T[8]);
    transform3Array.push(T[9]);
    transform3Array.push(T[10]);
    transform3Array.push(T[11]);

    // Column 4
    transform4Array.push(T[12]);
    transform4Array.push(T[13]);
    transform4Array.push(T[14]);
    transform4Array.push(T[15]);

    // Color
    let currCol: vec4 = col[i];
    // TODO: delete line below
    currCol = vec4.fromValues(1.0, 0.0, 0.0, 1.0);
    colorsArray.push(currCol[0]);
    colorsArray.push(currCol[1]);
    colorsArray.push(currCol[2]);
    colorsArray.push(currCol[3]);
  }

  let colors: Float32Array = new Float32Array(colorsArray);
  let transform1: Float32Array = new Float32Array(transform1Array);
  let transform2: Float32Array = new Float32Array(transform2Array);
  let transform3: Float32Array = new Float32Array(transform3Array);
  let transform4: Float32Array = new Float32Array(transform4Array);

  geom.setInstanceVBOs(colors, transform1, transform2, transform3, transform4);
  geom.setNumInstances(transforms.length);
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();

  // Get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  // const gl = canvas.getContext("webgl2", {
  //   premultipliedAlpha: false  // Ask for non-premultiplied alpha
  // });

  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  // Set up camera and shaders
  const camera = new Camera(vec3.fromValues(10, 10, 10), vec3.fromValues(0, 0, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  // gl.enable(gl.BLEND);
  // gl.blendFunc(gl.ONE, gl.ONE); // Additive blending
  // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.enable(gl.DEPTH_TEST);

  // Create shaders
  const instancedShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/instanced-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/instanced-frag.glsl')),
  ]);

  const flatShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/flat-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/flat-frag.glsl')),
  ]);

  const terrain3DShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/terrain-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/terrain-frag.glsl')),
  ])

  // const painterlyShader = new ShaderProgram([
  //   new Shader(gl.VERTEX_SHADER, require('./shaders/painterly-vert.glsl')),
  //   new Shader(gl.FRAGMENT_SHADER, require('./shaders/painterly-frag.glsl')),
  // ])

  const normalShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/normal-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/normal-frag.glsl')),
  ])

  // Create references images for brush stroke attributes
  //colorRef = gl.createTexture();

  // Bind textures to shader
  flatShader.bindTexToUnit(flatShader.unifSampler1, brushStroke1, 0);
  flatShader.bindTexToUnit(flatShader.unifSampler2, brushStroke2, 1);
  flatShader.bindTexToUnit(flatShader.unifSampler3, brushStroke3, 2);
  instancedShader.bindTexToUnit(instancedShader.unifSampler1, brushStroke1, 0);
  instancedShader.bindTexToUnit(instancedShader.unifSampler2, brushStroke2, 1);
  instancedShader.bindTexToUnit(instancedShader.unifSampler3, brushStroke3, 2);

  // Set the plane pos
  terrain3DShader.setPlanePos(vec2.fromValues(0, -100));

  // Render pass to fill the color reference texture
  const lambertShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/lambert-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/lambert-frag.glsl')),
  ])
  const texturecanvas = canvas;
  const textureRenderer = new OpenGLRenderer(texturecanvas);
  if (textureRenderer == null) {
    console.log('texture renderer null');
  }

  const width = window.innerWidth;
  const height = window.innerHeight;

  textureRenderer.setSize(width, height);
  textureRenderer.setClearColor(0, 0, 0, 1);
  let textureData: Uint8Array = textureRenderer.renderTexture(camera, lambertShader, [sphere]);
  console.log('width: ' + width);
  console.log('height: ' + height);
  console.log('textureData: ' + textureData.length);

  // Set up brush stroke attributes
  // For each particle in the sphere mesh, create a brush stroke
  for (let i = 0; i < sphere.particles.length; i++) {
    // Transform particle position to screen space 
    let pos = sphere.particles[i];
    let pos4 = vec4.fromValues(pos[0], pos[1], pos[2], 1.0);
    let screenPos: vec4 = vec4.create();
    camera.updateProjectionMatrix();
    vec4.transformMat4(screenPos, pos4, camera.projectionMatrix);
    vec4.scale(screenPos, screenPos, 1.0 / screenPos[3]); // Divide by the homogeneous coordinate
    // ---should be in NDC now------TODO: this is not proper NDC
    // e.g. NDC: [0.35244664549827576,-1.2078800201416016,1.1444306373596191,1]
    console.log('NDC: ' + screenPos);

    let xy: vec2 = vec2.fromValues(screenPos[0], screenPos[1]);
    vec2.scale(xy, xy, 0.5);
    vec2.add(xy, xy, vec2.fromValues(0.5, 0.5));
    xy[0] = (xy[0] + 1) * width / 2;
    xy[1] = (1 - xy[1]) * height / 2;
    console.log('xPos screen: ' + xy[0]);
    console.log('yPos screen: ' + xy[1]);

    // Look up color of brush stroke in color texture data
    let xpos = Math.floor(xy[0]);
    let ypos = Math.floor(xy[1]);
    let index = Math.floor(ypos * width * 4 + xpos * 4);
    if (index >= textureData.length) {
      console.log('ERROR: index of textureData is out of bounds');
    }
    let r = textureData[index] / 255.0;
    let g = textureData[index + 1] / 255.0;
    let b = textureData[index + 2] / 255.0;

    // PRINTING FOR DEBUGGING
    console.log('****** PARTICLE #' + i);
    console.log('xy screen space: ' + xy);
    console.log('pos: ' + pos4);
    console.log('r for particle #' + i + ' = ' + r);
    console.log('index for particle #' + i + ' = ' + index);
    console.log('g = ' + g);
    console.log('b = ' + b);

    let col: vec4 = vec4.fromValues(r, g, b, 1);

    let temp: BrushStroke = new BrushStroke(sphere.particles[i], quat.create(), vec3.fromValues(1, 1, 1), col);
    brushT.push(temp.getTransformationMatrix());
    brushCol.push(col);
  }
  setTransformArrays(brushT, brushCol, square);

  // *** TICK FUNCTION *** This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    instancedShader.setTime(time);
    flatShader.setTime(time++);
    terrain3DShader.setTime(time++);
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();

    // Render pass
    renderer.render(camera, flatShader, [screenQuad]); // Sky
    // renderer.render(camera, instancedShader, [cube]);
    //renderer.render(camera, terrain3DShader, [plane]); // Ground

    // gl.enable(gl.BLEND);
    // gl.blendFunc(gl.ONE, gl.ONE); // Additive blending
    gl.disable(gl.DEPTH_TEST);
    renderer.render(camera, instancedShader, [square]); // Brush strokes
    // renderer.render(camera, lambertShader, [sphere]);

    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
    flatShader.setDimensions(window.innerWidth, window.innerHeight);
    instancedShader.setDimensions(window.innerWidth, window.innerHeight);
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();
  flatShader.setDimensions(window.innerWidth, window.innerHeight);
  instancedShader.setDimensions(window.innerWidth, window.innerHeight);

  
  // Start the render loop
  tick();
}

main();
