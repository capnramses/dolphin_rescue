precision mediump float;

varying vec2 st;
uniform sampler2D fulltex, emptytex;
uniform float air_fac;

void main () {
	// adjust so factor relates to part with air meter in it, not including title
	float st_fac = st.t / 0.786;
	if (st_fac > air_fac) {
		gl_FragColor = texture2D (emptytex, st);
	} else {
		gl_FragColor = texture2D (fulltex, st);
	}

	if (air_fac < 0.25) {
		gl_FragColor.rgb *= vec3 (0.8, 0.0, 0.0);
	}

	gl_FragColor.a *= 0.65;
}
