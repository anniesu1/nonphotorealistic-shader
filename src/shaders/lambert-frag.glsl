#version 300 es
precision highp float;

in vec4 fs_Col;
in vec4 fs_Pos;
in vec4 fs_Nor;

out vec4 out_Col;


void main()
{
    /*
     ORIGINAL LAMBERT CODE
    */ 
    // // Apply lambertian lighting
    // vec4 lightPos = vec4(4.0, -8.0, 10.0, 0.0);
    // vec4 lightVec = fs_Pos - lightPos;
    // float diffuseTerm = dot(normalize(fs_Nor), normalize(lightVec));
    // diffuseTerm = clamp(diffuseTerm, 0.0, 1.0);

    // // Dampen the light intensity
    // diffuseTerm *= 1.5;

    // float dist = 1.0 - (length(fs_Pos.xyz) * 2.0);
    // // out_Col = vec4(dist) * fs_Col;
    // out_Col = diffuseTerm * fs_Col;

    /*
     NEW LAMBERT CODE WITH > 1 LIGHT
     */
     // Apply lambertian contribution from light 1
    vec4 lightPos1 = vec4(4.0, 4.0, 15.0, 1.0);
    float diffuseTerm = 0.0;

    vec4 lightVec1 = fs_Pos - lightPos1;
    diffuseTerm = dot(normalize(fs_Nor), normalize(lightVec1));
    diffuseTerm = clamp(diffuseTerm, 0.0, 1.0);

    // Apply lambertian contribution from light 2
    vec4 lightPos2 = vec4(-14.0, -15.0, 10.0, 1.0);
    vec4 lightVec2 = fs_Pos - lightPos2;
    diffuseTerm += dot(normalize(fs_Nor), normalize(lightVec2));
    diffuseTerm = clamp(diffuseTerm, 0.0, 1.0);

    //float ambientTerm = 0.4;
    vec3 ambientTerm = vec3(0.16, 0.20, 0.28) * min(max(fs_Nor.y, 0.0) + 0.2, 1.0);
    float lightIntensity = diffuseTerm + 0.2;

    out_Col = lightIntensity * fs_Col;


}

// TESTING DUMP

// Apply lambertian contribution from light 1
    // vec4 lightPos1 = vec4(4.0, 8.0, -15.0, 1.0);
    // float diffuseTerm = 0.0;

    // vec4 lightVec1 = fs_Pos - lightPos1;
    // diffuseTerm = dot(normalize(fs_Nor), normalize(lightVec1));
    // diffuseTerm = clamp(diffuseTerm, 0.0, 1.0);

    // // Apply lambertian contribution from light 1
    // vec4 lightPos2 = vec4(-14.0, 15.0, 10.0, 1.0);
    // vec4 lightVec2 = fs_Pos - lightPos2;
    // diffuseTerm += dot(normalize(fs_Nor), normalize(lightVec2));
    // diffuseTerm = clamp(diffuseTerm, 0.0, 1.0);

    // //float ambientTerm = 0.4;
    // vec3 ambientTerm = vec3(0.16, 0.20, 0.28) * min(max(fs_Nor.y, 0.0) + 0.2, 1.0);
    // float lightIntensity = diffuseTerm + 0.2;

    // float timeVar = sin(u_Time) / 2.0;

    // vec3 col;
    // if (fs_BuildingHeight > 9.0) {
    //     col = tallBuildingWindows(vec2(fs_Pos.x * 100.0, fs_Pos.y * 100.0), timeVar);
    // } else if (fs_BuildingHeight > 6.0) {
    //     col = mediumBuildingWindows(vec2(fs_Pos.x * 100.0, fs_Pos.y * 100.0));
    // } else {
    //     col = shortBuildingWindows(vec2(fs_Pos.x * 100.0, fs_Pos.y * 100.0), lightIntensity);
    // }

    // // Specular
    // float exp = 200.0;
    // vec4 cameraPos = vec4(u_Eye, 1.0);
    // vec4 H = normalize((cameraPos + fs_Pos - lightPos2) / 2.0);
    // vec4 lightVec = fs_Pos - lightPos2;
    // float specularIntensity = max(pow(dot(normalize(fs_Nor), normalize(lightVec)), exp), 0.1);

    // col = clamp(vec3(col * (lightIntensity + specularIntensity * 2.0)) + ambientTerm, 0.0, 1.0);