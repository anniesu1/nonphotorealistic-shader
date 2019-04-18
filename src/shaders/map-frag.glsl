#version 300 es
precision highp float;

uniform float u_ShowPopulation;
uniform float u_ShowTerrainGradient;
uniform float u_ShowTerrainBinary;

in vec2 fs_Pos;

out vec4 out_Col;

/*
 * Noise functions
 */

float random(vec2 ab) {
    float f = (cos(dot(ab ,vec2(21.9898,78.233))) * 43758.5453);
	return fract(f);
}

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

float noise(in vec2 xy) {
	vec2 ij = floor(xy);
	vec2 uv = xy-ij;
	uv = uv*uv*(3.0-2.0*uv);
	
	float a = random(vec2(ij.x, ij.y ));
	float b = random(vec2(ij.x+1., ij.y));
	float c = random(vec2(ij.x, ij.y+1.));
	float d = random(vec2(ij.x+1., ij.y+1.));
	float k0 = a;
	float k1 = b-a;
	float k2 = c-a;
	float k3 = a-b-c+d;
	return (k0 + k1*uv.x + k2*uv.y + k3*uv.x*uv.y);
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

float worley(float x, float y, float rows, float cols) {
    float xPos = x * float(rows) / 20.0;
    float yPos = y * float(cols) / 20.0;

    float minDist = 60.0;
    vec2 minVec = vec2(0.0, 0.0);

    // Find closest point
    for (int i = -1; i < 2; i++) {
        for (int j = -1; j < 2; j++) {
            vec2 currGrid = vec2(floor(float(xPos)) + float(i), floor(float(yPos)) + float(j));
            vec2 currNoise = currGrid + random2(currGrid, vec2(2.0, 1.0));
            float currDist = distance(vec2(xPos, yPos), currNoise);
            if (currDist <= minDist) {
                minDist = currDist;
                minVec = currNoise;
            }
        }
    }
    return minDist;
}

float bias(float b, float t) {
    return pow(t, log(b) / log(0.5f));
}

float gain(float g, float t) {
    if(t < 0.5f) {
        return bias(1.f-g, 2.f*t) / 2.f;
    } else {
        return 1.f - bias(1.f-g, 2.f - 2.f * t) / 2.f;
    }
}

float falloff(float t) {
    return t*t*t*(t*(t*6.f - 15.f) + 10.f);
}

float lerp(float a, float b, float t) {
    return (1.0 - t) * a + t * b;
}

float dotGridGradient(int ix, int iy, float x, float y, float seed) {
    vec2 dist = vec2(x - float(ix), y - float(iy));
    vec2 rand = (random2(vec2(ix, iy), vec2(seed, seed * 2.139)) * 2.f) - 1.f;
    return dist[0] * rand[0] + dist[1] * rand[1];
}

// Note: returns a float in the range [-0.5, 0.5]
float perlin(vec2 pos, float seed) {
    //Pixel lies in (x0, y0)
    int x0 = int(floor(pos[0]));
    int x1 = x0 + 1;
    int y0 = int(floor(pos[1]));
    int y1 = y0 + 1;

    float wx = falloff(pos[0] - float(x0));
    float wy = falloff(pos[1] - float(y0));

    float n0, n1, ix0, ix1, value;
    n0 = dotGridGradient(x0, y0, pos[0], pos[1], seed);
    n1 = dotGridGradient(x1, y0, pos[0], pos[1], seed);
    ix0 = lerp(n0, n1, wx);
    n0 = dotGridGradient(x0, y1, pos[0], pos[1], seed);
    n1 = dotGridGradient(x1, y1, pos[0], pos[1], seed);
    ix1 = lerp(n0, n1, wx);
    value = lerp(ix0, ix1, wy);

    return value;
}

float dampen(float t) {
    if(t < 0.4) {
        return pow(t / 0.4, 3.f) * 0.4;
    }
    return t;
}

float fbmPerlin(vec2 pos, float octaves, float seed) {
    float total = 0.f;
    float persistence = 0.5;

    for(float i = 0.f; i < octaves; i++) {
        float freq = pow(2.f, i);
        //divide by 2 so that max is 1
        float amp = pow(persistence, i) / 2.f;
        total += ((perlin(pos * float(freq), seed) + 1.f) / 2.f) * amp;
    }

    return clamp(total, 0.f, 1.f);
}

/*
* Main
*/
void main()
{
    if (u_ShowPopulation == 0.0f && u_ShowTerrainBinary == 0.0f && u_ShowTerrainGradient == 0.0f) {
        out_Col = vec4(0.f, 0.1f, 0.5f, 1.f);
        return;
    }

    vec3 landCol = vec3(128.f, 200.f, 101.f) / 255.0;
    vec3 waterCol = vec3(0.0, 0.0, 0.5);
    //vec3 populationCol1 = vec3(102.f, 71.f, 127.f) / 255.0;
    vec3 populationCol1 = vec3(1.0, 1.0, 1.0);
    vec3 populationCol2 = vec3(68.f, 48.f, 44.f) / 255.0;

    float height = dampen(gain(0.98, fbmPerlin(vec2(fs_Pos.x, fs_Pos.y) / 2.0f, 10.f, 1.328)));
    float population = perlin(vec2(fs_Pos.x, fs_Pos.y) / 1.0, 3.206) + 0.5;

    // Debugging: ensure population is in correct range
    // if (population < 0.0) {
    //     out_Col = vec4(1.0, 0.0, 0.0, 1.0);
    //     return;
    // }

    vec3 terrainCol;
    vec3 finalCol;

    // Calculate terrain color
    if (height < 0.35) {
        // Water
        terrainCol = waterCol;
    } else {
        // Land
        if (u_ShowTerrainBinary == 1.0) {
            height = 1.0;
        }
        terrainCol = landCol * height;
    }

    // Calculate population color 
    //vec3 populationCol = mix(populationCol1, populationCol2, population);
    vec3 populationCol = populationCol1 * population;

    // Case on which combination of terrain/population to display
    if (u_ShowPopulation == 1.0 && (u_ShowTerrainBinary == 1.0 || u_ShowTerrainGradient == 1.0)) {
        finalCol = mix(terrainCol, populationCol, 0.5);
    } else if (u_ShowPopulation == 1.0) {
        finalCol = populationCol;
    } else if (u_ShowTerrainBinary == 1.0 || u_ShowTerrainGradient == 1.0) {
        finalCol = terrainCol;
    } else {
        finalCol = vec3(0.0, 0.0, 0.0);
    }

    out_Col = vec4(finalCol, 1.0);
}