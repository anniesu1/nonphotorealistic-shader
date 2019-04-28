#version 300 es
precision highp float;

uniform vec3 u_Eye, u_Ref, u_Up;

in vec4 fs_Col;
in vec4 fs_Pos;
in vec2 fs_TextureCoord;
in vec4 fs_Nor;

out vec4 out_Col;

/*
* Main
*/
void main()
{
    out_Col = fs_Nor;
}
