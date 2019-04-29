#version 300 es
precision highp float;

uniform sampler2D u_BrushStroke1, u_BrushStroke2, u_BrushStroke3, u_ColorRef;
uniform vec3 u_Eye, u_Ref, u_Up;
uniform vec2 u_Dimensions;

in vec4 fs_Col;
in vec4 fs_Pos;
in vec2 fs_TextureCoord;
in vec4 fs_Nor;
in vec2 fs_ScreenSpace01;

out vec4 out_Col;

/*
 * Noise functions
 */

float random1( vec2 p , vec2 seed) {
  return fract(sin(dot(p + seed, vec2(127.1, 311.7))) * 43758.5453);
}

float random1( vec3 p , vec3 seed) {
  return fract(sin(dot(p + seed, vec3(987.654, 123.456, 531.975))) * 85734.3545);
}

vec2 random2( vec2 p , vec2 seed) {
  return fract(sin(vec2(dot(p + seed, vec2(311.7, 127.1)), dot(p + seed, vec2(269.5, 183.3)))) * 85734.3545);
}

float randv(vec2 n) {
  float v = (fract(cos(dot(n, vec2(12.9898, 4.1414))) * 43758.5453));
  return v;
}

float interpNoise2D(vec2 p) {
    float intX = floor(p.x);
    float intY = floor(p.y);
    float fractX = fract(p.x);
    float fractY = fract(p.y);

    float v1 = randv(vec2(intX,intY));
    float v2 = randv(vec2(intX + 1.0,intY));
    float v3 = randv(vec2(intX,intY + 1.0));
    float v4 = randv(vec2(intX + 1.0,intY + 1.0));

    float i1 = mix(v1, v2, fractX);
    float i2 = mix(v3, v4, fractX);

    return mix(i1, i2, fractY);
}

// Normal fbm
float fbm(vec2 p, float persistence, int octaves) {
    p /= 10.0f; // higher divisor = less variability of land; lower = really random/jumpy
    float total = 0.0;

    float counter = 0.0;
    for (int i = 0; i < octaves; i++) {
        float freq = pow(2.0, counter);
        float amp = pow(persistence, counter);
        total += interpNoise2D(vec2(p.x * freq, p.y * freq)) * amp;
        counter++;
    }
    return total;
}

/* noise() and pNoise() from https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83 */
float noise(vec2 p, float freq){
    float unit = 64.0/freq; // TODO: is 64.0 the proper width?
    vec2 ij = floor(p / unit);
    vec2 xy = mod(p , unit) / unit;
    //xy = 3.*xy*xy-2.*xy*xy*xy;
    float x = .5*(1.-cos(3.141592653589 * xy[0]));
    float y = .5*(1.-cos(3.141592653589 * xy[1]));
    xy = vec2(x, y);
    float a = randv((ij + vec2(0.0, 0.0)));
    float b = randv((ij + vec2(1.0, 0.0)));
    float c = randv((ij + vec2(0.0, 1.0)));
    float d = randv((ij + vec2(1.0, 1.0)));
    float x1 = mix(a, b, xy.x);
    float x2 = mix(c, d, xy.x);
    return mix(x1, x2, xy.y);
}

// Perlin noise function
float pNoise(vec2 p, int res) {
    float persistance = .5;
    float n = 0.;
    float normK = 0.;
    float f = 4.;
    float amp = 1.;
    int iCount = 0;
    for (int i = 0; i<50; i++){
        n+=amp*noise(p, f);
        f*=2.;
        normK+=amp;
        amp*=persistance;
        if (iCount == res) break;
        iCount++;
    }
    float nf = n/normK;
    return nf*nf*nf*nf;
}

vec3 palette(in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ) {
    return a + b*cos( 6.28318*(c*t+d) );
}

/*
* Main
*/
void main()
{
    float dist = 1.0 - (length(fs_Pos.xyz) * 2.0);
    //out_Col = fs_Col;
    // if (texColor == vec4(0.0, 0.0, 0.0, 1.0)) {
    //   out_Col = vec4(0.0, 0.0, 0.0, 0.0);
    //   return;
    // } else if (texColor == vec4(0.0, 0.0, 0.0, 0.0)) {
    //   out_Col = vec4(0.0, 1.0, 0.0, 1.0);
    //   return;
    // }

    // vec2 uv = 0.5 * (fs_Pos.xy + vec2(1.0));
    // uv.x *= u_Dimensions.x / u_Dimensions.y;
    // uv.x -= 0.25 * u_Dimensions.x / u_Dimensions.y;
    // uv.y *= 0.5;

   // (2i + 1)/(2N)
   // TODO: confirm that these UV coordinates are correct 
   // We are transforming from pixel space to uv space
   vec2 uv = (2.0f * fs_Pos.xy) + vec2(1.0);
   uv.x /= u_Dimensions[0];
   uv.y /= u_Dimensions[1];
   uv += vec2(0.5);
   uv *= 2.0;


    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(2.0, 1.0, 0.0);
    vec3 d = vec3(0.50, 0.20, 0.25);

    vec4 lambertCol = texture(u_ColorRef, fs_ScreenSpace01);
    lambertCol[3] = 1.0;

    vec4 testCol = vec4(1.0, 0.5 * (fs_Pos.xy + vec2(1.0)), 1.0); // TEST
    vec4 finalColor = texture(u_BrushStroke1, fs_TextureCoord);
    out_Col = vec4(finalColor.rgb * lambertCol.rgb, finalColor.a);
}
