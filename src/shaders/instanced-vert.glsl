#version 300 es

uniform mat4 u_ViewProj;
uniform float u_Time;
uniform vec2 u_Dimensions;

uniform mat3 u_CameraAxes; // Used for rendering particles as billboards (quads that are always looking at the camera)
// gl_Position = center + vs_Pos.x * camRight + vs_Pos.y * camUp;

in vec4 vs_Pos; // Non-instanced; each particle is the same quad drawn in a different place
in vec4 vs_Nor; // Non-instanced, and presently unused
in vec4 vs_Col; // An instanced rendering attribute; each particle instance has a different color
in vec3 vs_Translate; // Another instance rendering attribute used to position each quad instance in the scene
in vec2 vs_UV; // Non-instanced, and presently unused in main(). Feel free to use it for your meshes.
in vec4 vs_Transform1;
in vec4 vs_Transform2;
in vec4 vs_Transform3;
in vec4 vs_Transform4;
in vec2 vs_TextureCoord;

out vec4 fs_Col;
out vec4 fs_Pos;
out vec4 fs_Nor;
out vec2 fs_TextureCoord;
out vec2 fs_ScreenSpace01;

// We are assuming dimensions for map are 1000x1000
vec4 screenToQuad(vec4 pos) 
{
    vec3 newPos = pos.xyz / 50.0 - 1.0;
    return vec4(newPos, 1.0);
}

void main()
{
    fs_Col = vs_Col;
    fs_Pos = vs_Pos;
    fs_Nor = vs_Nor;

    mat4 t = mat4(vs_Transform1, vs_Transform2, vs_Transform3, vs_Transform4);
    vec4 newPos = t * vs_Pos;
    //newPos = screenToQuad(newPos);
    //newPos = vec4(newPos.x * 50.0, 0.1, newPos.z * 50.0, 1.0);
    vec4 pixelCoord = u_ViewProj * newPos;
    vec4 strokeCenter = u_ViewProj * vs_Transform4;

    // Pass texture sample position to fragment shader
    // float texcoordX = fs_Pos.x / (32.0  - 1.0f);
    // float texcoordY = fs_Pos.y / (32.0 - 1.0f);
    float texcoordX = fs_Pos.x + 0.5;
    float texcoordY = fs_Pos.y + 0.5;
    fs_TextureCoord = vec2(texcoordX, texcoordY);

    gl_Position = pixelCoord;
    vec3 ndc = strokeCenter.xyz / strokeCenter.w; //perspective divide/normalize
    vec2 viewportCoord = ndc.xy * 0.5 + 0.5; //ndc is -1 to 1 in GL. scale for 0 to 1
    fs_ScreenSpace01 = viewportCoord;

    fs_Pos = pixelCoord;
    //gl_Position = u_ViewProj * vs_Pos;

    

}
