attribute vec2 vp;
attribute vec2 vt;
varying vec2 st;

uniform mat4 M;

void main () {
	st = vt;
	gl_Position = M * vec4 (vp, 0.0, 1.0);
}
