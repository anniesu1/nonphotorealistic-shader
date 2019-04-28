#version 300 es
precision highp float;

in vec4 fs_Col;
in vec4 fs_Pos;
in vec4 fs_Nor;

out vec4 out_Col;


void main()
{
    // Apply lambertian lighting
    vec4 lightPos = vec4(4.0, 8.0, -5.0, 0.0);
    vec4 lightVec = fs_Pos - lightPos;
    float diffuseTerm = dot(normalize(fs_Nor), normalize(lightVec));
    diffuseTerm = clamp(diffuseTerm, 0.0, 1.0);

    // Dampen the light intensity
    diffuseTerm *= 1.5;

    float dist = 1.0 - (length(fs_Pos.xyz) * 2.0);
    // out_Col = vec4(dist) * fs_Col;
    out_Col = diffuseTerm * fs_Col;

}
