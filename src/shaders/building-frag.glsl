#version 300 es
precision highp float;

uniform float u_Time;
uniform vec3 u_Eye, u_Ref, u_Up;

in vec4 fs_Col;
in vec4 fs_Pos;
in vec4 fs_Nor;
in float fs_BuildingHeight;

out vec4 out_Col;

/*
 * Toolbox functions
 */ 
float triangleWave(float x, float freq, float amplitude) {
  return abs(mod((x * freq), amplitude) - (0.5 * amplitude));
}

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

vec3 tallBuildingWindows(vec2 pos, float flag) {
    if (flag > 0.5) {
        return vec3(fs_Col);
    }
    float width = 0.5;
    float height = 1.0;
    float winWidth = 0.38;
    float winHeight = 0.76;
    float x = pos.x - width * floor(pos.x / width);
    float y = pos.y - height * floor(pos.y / height);

    float timeVar = u_Time / 1000.0;

    if (y > (height - winHeight) * 0.5 && y < (height + winHeight) * 0.5) {
        float attenuation = 1.0 - triangleWave(timeVar, 2.8, 1.0);
        return vec3(fs_Col) * attenuation;
    } else {
        return vec3(0.1, 0.20, 0.27);
    }
}

vec3 mediumBuildingWindows(vec2 pos) {
    float width = 2.0;
    float height = 5.0;
    float winWidth = 0.38;
    float winHeight = 0.46;
    float x = pos.x - width * floor(pos.x / width);
    float y = pos.y - height * floor(pos.y / height);

    float timeVar = sin(u_Time) / 2.0;

    if (y > (height - winHeight) * 0.5 && y < (height + winHeight) * 0.5 &&
        timeVar < 0.5) {
        return vec3(242.0 / 255.0, 238.0 / 255.0, 128.0 / 255.0);
    } else {
        return vec3(fs_Col);
    }
}

vec3 shortBuildingWindows(vec2 pos, float lightIntensity) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.30, 0.20, 0.20);
    vec3 palette = a + b * cos(2.0 * 3.141592653589 * (c * lightIntensity + d));

    float width = 15.85;
    float height = 15.0;
    float winWidth = 5.55;
    float winHeight = 2.70;
    float x = pos.x - width * floor(pos.x / width);
    float y = pos.y - height * floor(pos.y / height);

    if (x > (width - winWidth) * 0.5 && x < (width + winWidth) * 0.5 &&
        y > (height - winHeight) * 0.5 && y < (height + winHeight) * 0.5)
    {
        float attenuation = 1.0 - triangleWave(u_Time / 100.0, 1.8, 0.7);
        return vec3(1.0, 1.0, 1.0) * attenuation;
    }
    else {
        return vec3(fs_Col);
    }
}

/*
* Main
*/
void main()
{
    // Apply lambertian contribution from light 1
    vec4 lightPos1 = vec4(4.0, 8.0, -15.0, 1.0);
    float diffuseTerm = 0.0;

    vec4 lightVec1 = fs_Pos - lightPos1;
    diffuseTerm = dot(normalize(fs_Nor), normalize(lightVec1));
    diffuseTerm = clamp(diffuseTerm, 0.0, 1.0);

    // Apply lambertian contribution from light 1
    vec4 lightPos2 = vec4(-14.0, 15.0, 10.0, 1.0);
    vec4 lightVec2 = fs_Pos - lightPos2;
    diffuseTerm += dot(normalize(fs_Nor), normalize(lightVec2));
    diffuseTerm = clamp(diffuseTerm, 0.0, 1.0);

    //float ambientTerm = 0.4;
    vec3 ambientTerm = vec3(0.16, 0.20, 0.28) * min(max(fs_Nor.y, 0.0) + 0.2, 1.0);
    float lightIntensity = diffuseTerm + 0.2;

    float timeVar = sin(u_Time) / 2.0;

    vec3 col;
    if (fs_BuildingHeight > 9.0) {
        col = tallBuildingWindows(vec2(fs_Pos.x * 100.0, fs_Pos.y * 100.0), timeVar);
    } else if (fs_BuildingHeight > 6.0) {
        col = mediumBuildingWindows(vec2(fs_Pos.x * 100.0, fs_Pos.y * 100.0));
    } else {
        col = shortBuildingWindows(vec2(fs_Pos.x * 100.0, fs_Pos.y * 100.0), lightIntensity);
    }

    // Specular
    float exp = 200.0;
    vec4 cameraPos = vec4(u_Eye, 1.0);
    vec4 H = normalize((cameraPos + fs_Pos - lightPos2) / 2.0);
    vec4 lightVec = fs_Pos - lightPos2;
    float specularIntensity = max(pow(dot(normalize(fs_Nor), normalize(lightVec)), exp), 0.1);

    col = clamp(vec3(col * (lightIntensity + specularIntensity * 2.0)) + ambientTerm, 0.0, 1.0);

    /* TESTING DUMP */
    ivec2 size = ivec2(20, 20);
    float total = floor(fs_Pos.x*float(size.x)) +
                  floor(fs_Pos.y*float(size.y));
    bool isEven = mod(total,2.0)==0.0;
    vec4 col1 = vec4(0.0,0.0,0.0,1.0);
    vec4 col2 = vec4(1.0,1.0,1.0,1.0);
    // if (isEven) {
    //     out_Col = vec4(249.0 / 255.0, 250.0 / 255.0, 252.0 / 255.0, 1.0);
    //     return;
    // }

    // if (fs_BuildingHeight > 10.0) {
    //     out_Col = vec4(0.0, 1.0, 0.0, 1.0);
    //     return;
    // }
    /* END TESTING DUMP */


    //float transparency = 1.0 - triangleWave(u_Time * fs_Pos.y / 1000.0, 1.0, 0.2);
    out_Col = vec4(col, 1.0);
}
