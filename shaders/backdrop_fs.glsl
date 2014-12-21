precision mediump float;

varying vec2 st;
uniform float level;
uniform sampler2D tex;

void main () {
	gl_FragColor = texture2D (tex, st);
	float sub = 1.0 - level * 0.1;
	gl_FragColor.rgb *= sub;
}
