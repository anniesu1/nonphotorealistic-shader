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
  "particles per mesh": 100000,
  "brush stroke texture": 0,
  "brush stroke size": 0.25
};

// Geometry
let square: Square; // Brush stroke
let screenQuad: ScreenQuad;
let plane: Plane;
let cube: Cube;
let sphereObj: string = readTextFile('./src/sphere.obj');
let sphere: Mesh;
let lotusObj: string = readTextFile('./src/lotus.obj');
let lotus: Mesh;
let lotus1: Mesh;
let lotus2: Mesh;
let lotus3: Mesh;

// Textures
let brushStroke1: Texture;
let brushStroke2: Texture;
let brushStroke3: Texture;

// Reference pictures for the brush stroke
const targetTextureWidth = 256;
const targetTextureHeight = 256;
let colorRef: WebGLTexture;
let fbColor: WebGLFramebuffer;
let rbColor: WebGLRenderbuffer;

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
  sphere = new Mesh(sphereObj, vec3.fromValues(0.0, 0.0, 0.0), controls["particles per mesh"]);
  sphere.create();
  lotus = new Mesh(lotusObj, vec3.fromValues(2, -2, 0), controls["particles per mesh"]);
  lotus.create();
  lotus2 = new Mesh(lotusObj, vec3.fromValues(0, 0, 0), controls["particles per mesh"]);
  lotus2.create();
  lotus3 = new Mesh(lotusObj, vec3.fromValues(0, 0, 0), controls["particles per mesh"]);
  lotus3.create();
  
  // Create textures
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

  // Create a sphere to represent a lily pad
  let sphereT: mat4[] = [];
  let sphereT1: mat4 = mat4.create();
  mat4.rotateX(sphereT1, sphereT1, -Math.PI / 2.0);
  mat4.scale(sphereT1, sphereT1, vec3.fromValues(1, 1, 0.2));
  sphereT.push(sphereT1);
  setTransformArrays(sphereT, vec4.fromValues(10.0 / 255.0, 130.0 / 255.0, 94.0 / 255.0, 1.0), sphere);

  // Create a lotus
  let lotusT: mat4[] = [];
  let identity: mat4 = mat4.create();
  lotusT.push(identity);
  setTransformArrays(lotusT, vec4.fromValues(242.0 / 255.0, 174.0 / 255.0, 192.0 / 255.0, 1.0), lotus);
}

// Should get its own transformation matrix
function getTransformationMatrix(pos: vec3, orientation: quat, scale: vec3) : mat4 {
  // Translate
  let T: mat4 = mat4.create();
  mat4.fromTranslation(T, pos); 

  // Rotate
  let R: mat4 = mat4.create();
  mat4.fromQuat(R, orientation);

  // Scale
  let S: mat4 = mat4.create();
  mat4.fromScaling(S, scale);
  S[0] = 0.5;
  S[5] = 0.5;

  // Multiply together to form transformation matrix
  let transformation: mat4 = mat4.create();
  mat4.multiply(transformation, R, S);
  return mat4.multiply(transformation, T, transformation);
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
  gui.add(controls, 'particles per mesh', 10, 100000);
  gui.add(controls, "brush stroke texture", [0, 1, 2]);
  gui.add(controls, 'brush stroke size', 0.05, 5.0);

  // Get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  // const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  const gl = canvas.getContext("webgl2", {
    alpha: false  // Ask for non-premultiplied alpha
  });

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
  renderer.setClearColor(0.0, 0.0, 0.0, 0.0);
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

  const lambertShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/lambert-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/lambert-frag.glsl')),
  ])

  // Bind textures to shader
  instancedShader.bindTexToUnit(instancedShader.unifSampler1, brushStroke1, 0);
  instancedShader.bindTexToUnit(instancedShader.unifSampler2, brushStroke2, 1);
  instancedShader.bindTexToUnit(instancedShader.unifSampler3, brushStroke3, 2);

  // Set the plane pos
  terrain3DShader.setPlanePos(vec2.fromValues(0, -100));

  // Set up brush strokes:

  // Sort the particles by their z-value before getting their transforms and vbo data
  sphere.particles.sort(function(a, b) {
    // Sort by using the dot product between the camera's z axis and the particle position
    let sub1: vec3 = vec3.create();
    let dot1: number = vec3.dot(camera.forward, a);
    let distance1: number = vec3.sqrLen(vec3.subtract(sub1, a, camera.position));
    
    let sub2: vec3 = vec3.create();
    let dot2: number = vec3.dot(camera.forward, b);
    let distance2: number = vec3.sqrLen(vec3.subtract(sub2, b, camera.position));

    // return (distance2 - distance1);
    return dot2 - dot1;
  });
  lotus.particles.sort(function(a, b) {
    let sub1: vec3 = vec3.create();
    let dot1: number = vec3.dot(camera.forward, a);
    let distance1: number = vec3.sqrLen(vec3.subtract(sub1, a, camera.position));
    
    let sub2: vec3 = vec3.create();
    let dot2: number = vec3.dot(camera.forward, b);
    let distance2: number = vec3.sqrLen(vec3.subtract(sub2, b, camera.position));

    return (dot2 - dot1);
  });

  let inputSize: number = controls["brush stroke size"];
  let brushStrokeSize: vec3 = vec3.fromValues(inputSize, inputSize, inputSize);

  for (let i = 0; i < sphere.particles.length; i++) {
    // For each particle in the sphere mesh, create a brush stroke
    let temp: BrushStroke = new BrushStroke(sphere.particles[i], quat.create(), brushStrokeSize,
      vec3.fromValues(1, 0, 0));
    brushT.push(temp.getTransformationMatrix());
  }

  for (let i = 0; i < lotus.particles.length; i++) {
    // For each particle in the lotus mesh, create a brush stroke
    let brush: BrushStroke = new BrushStroke(lotus.particles[i], quat.create(), brushStrokeSize,
      vec3.fromValues(0, 0, 1));
    brushT.push(brush.getTransformationMatrix());
  }
  setTransformArrays(brushT, vec4.fromValues(1, 0, 0, 1), square);

  // Render pass to fill the color reference texture
  const texturecanvas = canvas;
  const textureRenderer = new OpenGLRenderer(texturecanvas);
  if (textureRenderer == null) {
    console.log('texture renderer null');
  }

  // *** NEW TEXTURE SET-UP ***
  // Instantiate textures, fbs, rbs
  colorRef = gl.createTexture();
  fbColor = gl.createFramebuffer();
  rbColor = gl.createRenderbuffer();

  function textureSetup() {
    const texWidth = window.innerWidth;
    const texHeight = window.innerHeight;
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texWidth, texHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);   
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);   
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);   
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);   
  }

  function fbrbSetup(texture: WebGLTexture, fb: WebGLFramebuffer, rb: WebGLRenderbuffer) {
    const texWidth = window.innerWidth;
    const texHeight = window.innerHeight;

    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, texWidth, texHeight);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
    if(gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE) {
      console.log("error");
    }
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  // Set flags so we know whether to redraw the LSystem or not
  let flagNumParticles = controls["particles per mesh"];
  let flagBrushStrokeType = controls["brush stroke texture"];
  let flagBrushStrokeSize = controls["brush stroke size"];


  // *** TICK FUNCTION *** This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    instancedShader.setTime(time);
    flatShader.setTime(time++);
    terrain3DShader.setTime(time++);
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();

    /*
      1. Color reference image with simple lambert shading
    */
    renderer.render(camera, flatShader, [screenQuad]);
    gl.bindTexture(gl.TEXTURE_2D, colorRef);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbColor);
    gl.bindRenderbuffer(gl.RENDERBUFFER, rbColor);

    // Set up the texture, frame buffer, and render buffer 
    textureSetup();
    fbrbSetup(colorRef, fbColor, rbColor);  

    // Render the scene with basic lambertian lighting to a texture
    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
    renderer.render(camera, lambertShader, [sphere, lotus]);

    // Check if flags have changed and if particles need to be re-sorted
    if (flagBrushStrokeType != controls["brush stroke texture"]) {
      // Pass to shader the new selected brush stroke
      instancedShader.setSelectedBrush(controls["brush stroke texture"]);

      // Update
      flagBrushStrokeType = controls["brush stroke texture"];
    }

    if (flagBrushStrokeSize != controls["brush stroke size"]) {
      // Re-render all brush strokes with the appropriate 
      let inputSize: number = controls["brush stroke size"];
      let brushStrokeSize: vec3 = vec3.fromValues(inputSize, inputSize, inputSize);
      brushT = []; // Clear
      for (let i = 0; i < sphere.particles.length; i++) {
        // For each particle in the sphere mesh, create a brush stroke
        let temp: BrushStroke = new BrushStroke(sphere.particles[i], quat.create(), brushStrokeSize,
          vec3.fromValues(1, 0, 0));
        brushT.push(temp.getTransformationMatrix());
      }
    
      for (let i = 0; i < lotus.particles.length; i++) {
        // For each particle in the lotus mesh, create a brush stroke
        let brush: BrushStroke = new BrushStroke(lotus.particles[i], quat.create(), brushStrokeSize,
          vec3.fromValues(0, 0, 1));
        brushT.push(brush.getTransformationMatrix());
      }
      setTransformArrays(brushT, vec4.fromValues(1, 0, 0, 1), square);

      // Update
      flagBrushStrokeSize = controls["brush stroke size"];
    }

    /*
       2. Brush Strokes
     */
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, colorRef);
    instancedShader.setColorRef(); // Bind previous color reference to the shader
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);//gl.ONE, gl.ONE); // Additive blending
    // gl.blendFunc(gl.ONE, gl.ONE);
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
