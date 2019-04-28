#version 300 es
precision highp float;

uniform mat4 u_ViewProj;
uniform float u_Time;
uniform vec2 u_Dimensions;

in vec4 vs_Pos; // Non-instanced; each particle is the same quad drawn in a different place
in vec4 vs_Nor; // Non-instanced, and presently unused
in vec4 vs_Col; // An instanced rendering attribute; each particle instance has a different color
in vec4 vs_Transform1;
in vec4 vs_Transform2;
in vec4 vs_Transform3;
in vec4 vs_Transform4;

out vec4 fs_Pos;
out vec4 fs_Nor;
out vec4 fs_Col;

void main() {
  fs_Pos = vs_Pos;
  fs_Nor = vs_Nor;
  fs_Col = vs_Col;

  mat4 t = mat4(vs_Transform1, vs_Transform2, vs_Transform3, vs_Transform4);
  vec4 newPos = t * vs_Pos;
  vec4 pixelCoord = u_ViewProj * newPos;

  gl_Position = pixelCoord;

}
