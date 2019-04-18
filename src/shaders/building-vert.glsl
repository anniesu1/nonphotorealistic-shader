#version 300 es

uniform mat4 u_ViewProj;
uniform float u_Time;

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

out vec4 fs_Col;
out vec4 fs_Pos;
out vec4 fs_Nor;
out float fs_BuildingHeight;

// We are assuming dimensions for map are 100x100
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
    fs_BuildingHeight = vs_Transform2[1];

    mat4 t = mat4(vs_Transform1, vs_Transform2, vs_Transform3, vs_Transform4);
    vec4 newPos = t * vs_Pos;
    //newPos = screenToQuad(newPos);
    //newPos = vec4(newPos.x * 50.0, 0.1, newPos.z * 50.0, 1.0);
    gl_Position = u_ViewProj * newPos;
    //gl_Position = u_ViewProj * vs_Pos;

}
