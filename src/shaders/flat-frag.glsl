#version 300 es
precision highp float;

uniform vec3 u_Eye, u_Ref, u_Up;
uniform vec2 u_Dimensions;
uniform float u_Time;

in vec2 fs_Pos;
out vec4 out_Col;

uniform sampler2D u_BrushStroke1, u_BrushStroke2, u_BrushStroke3;


/**
 * Noise functions
 */
float random(vec2 ab) {
	float f = (cos(dot(ab ,vec2(21.9898,78.233))) * 43758.5453);
	return fract(f);
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

vec2 random2( vec2 p , vec2 seed) {
  return fract(sin(vec2(dot(p + seed, vec2(311.7, 127.1)), dot(p + seed, vec2(269.5, 183.3)))) * 85734.3545);
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

/**
 * Gradiation
 */
// Mountain palette
const vec3 mountain[5] = vec3[](vec3(3, 6, 13) / 255.0,
                                vec3(14, 32, 72) / 255.0,
                                vec3(69, 88, 121) / 255.0,
                                vec3(117, 134, 163) / 255.0,
                                vec3(114, 171, 198) / 255.0);

const vec3 duskyMountain[5] = vec3[](vec3(181, 224, 229) / 255.0,
                                vec3(233, 122, 144) / 255.0,
                                vec3(128, 71, 102) / 255.0,
                                vec3(54, 94, 122) / 255.0,
                                vec3(249, 250, 252) / 255.0);
vec3 getMountainColor() {
  highp float yPos = 0.5 * (fs_Pos[1] + 1.0);

    if (yPos < 0.05) {
        return duskyMountain[3];
    }
    else if (yPos < 0.1) {
        return mix(duskyMountain[3], duskyMountain[3], (yPos - 0.05) / 0.05);
    }
    else if (yPos < 0.2) {
        return mix(duskyMountain[3], duskyMountain[2], (yPos - 0.1) / .1);
    }
    else if (yPos < 0.4) {
        return mix(duskyMountain[2], duskyMountain[1], (yPos - 0.2) / .2);
    }
    else if (yPos < 0.8) {
        //return vec3(1.0, 0.0, 0.0);
        return mix(duskyMountain[1], duskyMountain[4], (yPos - 0.4) / .4);
    } else {
        return duskyMountain[4];
    }
}


void main() {
    // Stars
    float time = 0.8 * u_Time;
	  vec2 position = fs_Pos * 0.5 * u_Dimensions;
	  float color = pow(noise(position), 40.0) * 20.0;
	  float r1 = noise(position*noise(vec2(sin(time*0.01))));
	  float r2 = noise(position*noise(vec2(cos(time*0.01), sin(time*0.01))));
	  float r3 = noise(position*noise(vec2(sin(time*0.05), cos(time*0.05))));
	  vec4 starColor = vec4(vec3(color*r1, color*r2, color*r3), 1.0);

    // Sky
    float noise = dampen(gain(0.98, fbmPerlin(fs_Pos + u_Time / 1500.0f, 10.f, 1.328)));
    vec3 pinkClouds = vec3(252.0, 169.0, 184.0) * noise / 255.f;

    // Apply vignette
    vec2 vigPos = vec2(fs_Pos[0], fs_Pos[1]);
    float distance = sqrt((vigPos[0]) * (vigPos[0]) + (vigPos[1]) * (vigPos[1]));
    // Multiply the color by (1 - distance) -- leverage distance of fragment from screen center
    out_Col = (1.0 - distance * 0.4) * (vec4(getMountainColor(), 1.0) + vec4(pinkClouds * 0.3, 0.3) + (starColor * 0.9));
    
    // Calculate uv coordinates
    vec2 uv = 0.5 * (fs_Pos.xy + vec2(1.0));
    uv.x *= u_Dimensions.x / u_Dimensions.y;
    uv.x -= 0.25 * u_Dimensions.x / u_Dimensions.y;
    uv.y *= 0.5;

    // Set out color to a basic black color
    out_Col = vec4(0.0, 0.0, 0.0, 1.0);
}
