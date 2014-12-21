attribute vec2 vp;
uniform mat4 M;
uniform float t;
varying vec2 st;

void main () {
	st = vec2 (vp.x * 4.0, vp.y * 0.5 + 0.5);
	
	vec2 pos = vp;
	if (pos.y > -0.9) {
		pos.x += sin (t + M[3][0] * 4.0 + pos.y * 2.0) * 0.25;
	}
	gl_Position = M * vec4 (pos, 0.0, 1.0);
}
