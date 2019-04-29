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

  for (let i = 0; i < sphere.particles.length; i++) {
    // For each particle in the sphere mesh, create a brush stroke
    let temp: BrushStroke = new BrushStroke(sphere.particles[i], quat.create(), vec3.fromValues(1, 1, 1),
      vec3.fromValues(1, 0, 0));
    brushT.push(temp.getTransformationMatrix());
  }
  setTransformArrays(brushT, vec4.fromValues(1, 0, 0, 0), square);

  // Create textures
  // TODO: why does it only work with 1 set brush stroke type?
  brushStroke1 = new Texture('../textures/brush_stroke_01.png', 0);
  brushStroke2 = new Texture('../textures/brush_stroke_01.png', 0);
  brushStroke3 = new Texture('../textures/brush_stroke_01.png', 0);

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
  setTransformArrays(transforms, vec4.fromValues(1, 0, 0, 1), sphere);
}

function setTransformArrays(transforms: mat4[], col: vec4, geom: any) {
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
    colorsArray.push(col[0]);
    colorsArray.push(col[1]);
    colorsArray.push(col[2]);
    colorsArray.push(col[3]);
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
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE); // Additive blending
  // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  // gl.enable(gl.DEPTH_TEST);

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

  const lambertShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/lambert-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/lambert-frag.glsl')),
  ])

  // Create references images for brush stroke attributes
  colorRef = gl.createTexture();

  // Bind textures to shader
  flatShader.bindTexToUnit(flatShader.unifSampler1, brushStroke1, 0);
  flatShader.bindTexToUnit(flatShader.unifSampler2, brushStroke2, 0);
  flatShader.bindTexToUnit(flatShader.unifSampler3, brushStroke3, 0);

  // Set the plane pos
  terrain3DShader.setPlanePos(vec2.fromValues(0, -100));

  // *** Render pass to fill our texture ***
  const textureShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/terrain-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/terrain-frag.glsl')),
  ]);

  const texturecanvas = canvas;
  const textureRenderer = new OpenGLRenderer(texturecanvas);
  if (textureRenderer == null) {
    console.log('texture renderer null');
  }

  // Resolution for the L-system
  const width = window.innerWidth;
  const height = window.innerHeight;

  textureRenderer.setSize(width, height);
  textureRenderer.setClearColor(0, 0, 0, 1);
  let textureData: Uint8Array = textureRenderer.renderTexture(camera, textureShader, [plane]);

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
