attribute vec2 vp;
attribute vec2 vt;
varying vec2 st;

uniform mat4 M;
uniform float frame;

void main () {
	st = vt * 0.5;

	if (frame > 3.9) {
		st += 0.5;
	} else if (frame > 2.9) {
		st.t += 0.5;
	} else if (frame > 1.9) {
		//st.t += 0.5;
	} else if (frame > 0.9) {
		st.s += 0.5;
	}
	gl_Position = M * vec4 (vp, 0.0, 1.0);
}
