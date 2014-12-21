var seaweed = new Array();
var sw_vp_vbo;
var sw_texture;
var sw_sp;
var sw_M_loc;
var sw_t_loc;
var sw_scale = 0.2;

function sw_constructor (x, y) {
	var sw_T = [
		1.0, 0.0, 0.0, 0.0,
		0.0, 1.0, 0.0, 0.0,
		0.0, 0.0, 1.0, 0.0,
		x, y, 0.0, 1.0
	];
	var sw_S = [
		sw_scale, 0.0, 0.0, 0.0,
		0.0, sw_scale, 0.0, 0.0,
		0.0, 0.0, 1.0, 0.0,
		0.0, 0.0, 0.0, 1.0
	];
	this.M = mult_mat4_mat4 (sw_T, sw_S);
}

function create_weed () {
	console.log ("creating seaweed");
	var sw_points = [
		-0.25, -1.0,
		0.25, -1.0,
		0.25, -0.5,
		-0.25, -1.0,
		0.25, -0.5,
		-0.25, -0.5,
		-0.25, -0.5,
		0.25, -0.5,
		0.25, -0.0,
		-0.25, -0.5,
		0.25, -0.0,
		-0.25, -0.0,
		-0.25, 0.0,
		0.25, 0.0,
		0.25, 0.5,
		-0.25, 0.0,
		0.25, 0.5,
		-0.25, 0.5,
		-0.25, 0.5,
		0.25, 0.5,
		0.25, 1.0,
		-0.25, 0.5,
		0.25, 1.0,
		-0.25, 1.0
	];
	// and texcoords are s = x * 4, t = y

	sw_vp_vbo = gl.createBuffer ();
	gl.bindBuffer (gl.ARRAY_BUFFER, sw_vp_vbo);
	gl.bufferData (gl.ARRAY_BUFFER, new Float32Array (sw_points), gl.STATIC_DRAW);

	sw_texture = create_texture_from_file ("art/seaweed.png");

	sw_sp = load_shaders_from_files ("shaders/sw_vs.glsl", "shaders/sw_fs.glsl");
	//gl.bindAttribLocation(backdrop_sp, 0, "vp");
	//gl.bindAttribLocation(backdrop_sp, 1, "vt");
	gl.linkProgram (sw_sp);
	sw_M_loc = gl.getUniformLocation (sw_sp, "M");
	sw_t_loc = gl.getUniformLocation (sw_sp, "t");

	// create instances
	for (var i = 0; i < 32; i++) {
		var sw = new sw_constructor (-1.0 + i / 15 - 0.07, -0.7);
		seaweed.push (sw);
	}
}

function draw_weed () {
	gl.enableVertexAttribArray (0);
	gl.disableVertexAttribArray (1);

	gl.activeTexture (gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, sw_texture);

	gl.useProgram (sw_sp);

	gl.bindBuffer (gl.ARRAY_BUFFER, sw_vp_vbo);
	gl.vertexAttribPointer (0, 2, gl.FLOAT, gl.FALSE, 0, 0);

	gl.uniform1f (sw_t_loc, (current_millis - initial_time_ms) / 1000.0);
	for (var i = 0; i < seaweed.length; i++) {
		gl.uniformMatrix4fv (sw_M_loc, gl.FALSE, seaweed[i].M);
		gl.drawArrays(gl.TRIANGLES, 0, 24);
	}
	gl.enableVertexAttribArray (1);
}
