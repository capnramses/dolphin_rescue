precision mediump float;

varying vec2 st;
uniform sampler2D tex;
uniform float alpha;

void main () {
	gl_FragColor = texture2D (tex, st);
	gl_FragColor.a *= alpha;
}
