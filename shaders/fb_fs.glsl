precision mediump float;

varying vec2 st;
uniform sampler2D tex;
uniform float air_fac;
uniform float t;
uniform float scream;

void main () {
	// sample scene texture
	vec2 coords = st;

	if (st.t < 0.88) {
		coords.s += 0.005 * sin (t * 2.0 + st.t * 2.0);
	}

	vec4 texel = texture2D (tex, coords);
	gl_FragColor.rgb = texel.rgb;

	// blacken screen
	if (air_fac < 0.5) {
		float light = air_fac * 2.0;
		gl_FragColor.rgb *= light;
	}

	// sonic scream seizure
	gl_FragColor.rgb += sin (scream) * vec3 (1.0, 1.0, 1.0);

	// prevent white showing through transp bits
	gl_FragColor.a = 1.0;
}
