attribute vec2 vp;
attribute vec2 vt;
uniform float shake;
varying vec2 st;

void main () {
	st = vt;
	vec2 pos = vp;
	pos.y += sin (shake * shake * 10.0) * 0.02;
	gl_Position = vec4 (pos, 0.0, 1.0);
}
