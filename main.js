var canvas;
var gl; // gl context
var gl_width;
var gl_height;
var initial_time_ms;
var previous_millis;
var current_millis = 0.0;
var time_step_accum = 0.0;
var time_step_size_s = 1.0 / 50.0;
var rescue_count = 0;
var level = 0;
var saved = 0;

var anim_sp;
var anim_M_loc;
var anim_frame_loc;
var basic_sp;
var basic_M_loc;
var backdrop_sp;
var backdrop_level_loc;
var backdrop_vp_vbo;
var backdrop_vt_vbo;
var backdrop_texture;
var iceberg_texture;
var moray_texture;
var ship_texture;
var rocks_vp_vbo;
var rocks_vt_vbo;
var rocks_texture;
var airmeter_sp;
var airmeter_M_loc;
var airmeter_air_fac_loc;
var airempty_texture;
var airfull_texture;
var jolly_boat_textures = new Array();
var boat_away = false;
var shake_timer = 0.0;
var moray_x_pos = -0.1;
var moray_y_pos = -0.79;
var morayb_x_pos = 0.1;
var morayb_y_pos = -0.8;
var moray_a_countdown = 0.0;
var moray_b_countdown = 0.0;
var show_moray_a_time_left = 0.0;
var show_moray_b_time_left = 0.0;

var overlay_visible = true;

var fb;
var fb_texture;
var fb_sp;
var fb_air_fac_loc;
var fb_t_loc;
var fb_scream_loc;
var fb_shake_loc;

function init_fb () {
	console.log ("creating framebuffer");
	fb_texture = gl.createTexture ();
	gl.bindTexture (gl.TEXTURE_2D, fb_texture);
	gl.texParameteri (gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri (gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri (gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri (gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texImage2D (
		gl.TEXTURE_2D,
		0,
		gl.RGBA,
		gl_width,
		gl_height,
		0,
		gl.RGBA,
		gl.UNSIGNED_BYTE,
		null
	);

	fb = gl.createFramebuffer ();
	gl.bindFramebuffer (gl.FRAMEBUFFER, fb);
	gl.framebufferTexture2D (
		gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fb_texture, 0
	);
	// unbind to avoid read-write feedback horror
	gl.bindTexture (gl.TEXTURE_2D, null);
	gl.bindFramebuffer (gl.FRAMEBUFFER, null);
}

function toggle_intro_overlay () {
	if (overlay_visible) {
		document.getElementById('intro_overlay').style.visibility = 'hidden';
		document.getElementById('level_html_div').style.visibility = 'visible';
	}
	overlay_visible = false;
}

function get_level_text () {
	return "I reached level " + level + "in Dolphin Rescue!";
}

function show_death_overlay () {
	overlay_visible = true;
	document.getElementById('death_overlay').style.visibility = 'visible';
	document.getElementById('level_html_div').style.visibility = 'hidden';
	document.getElementById('level_text').innerHTML = 'level ' + level;
	document.getElementById('sailor_text').innerHTML = saved + ' sailors';
}

function main () {
	console.log ("starting dolphin rescue");
	canvas = document.getElementById ("canvas_gl");
	gl = WebGLUtils.setupWebGL (canvas);
	if (!gl) {
		alert("could not start WebGL in your browser. may not work on iOS or older Internet Explorer.");
		return;
	}
	gl_width = canvas.width;
	gl_height = canvas.height;
	create_shaders ();
	create_geometry ();
	create_textures ();
	init_fb ();

	var range = 30.0;
	moray_a_countdown = Math.random() * range;
	moray_b_countdown = Math.random() * range;

	document.getElementById ('level_html').innerHTML = "Level: " + level;

	gl.clearColor (1.0, 1.0, 1.0, 1.0);
	gl.viewport (0, 0, gl_width, gl_height);
	gl.blendFunc (gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

	console.log ("starting game");
	initial_time_ms = (new Date).getTime ();
	previous_millis = (new Date).getTime ();
	main_loop ();
}

function create_shaders () {
	console.log ("creating shaders");

	// backdrop
	backdrop_sp = load_shaders_from_files ("shaders/backdrop_vs.glsl", "shaders/backdrop_fs.glsl");
	gl.bindAttribLocation(backdrop_sp, 0, "vp");
	gl.bindAttribLocation(backdrop_sp, 1, "vt");
	gl.linkProgram (backdrop_sp);
	backdrop_level_loc = gl.getUniformLocation (backdrop_sp, "level");

	// animated sprites
	anim_sp = load_shaders_from_files ("shaders/anim_vs.glsl", "shaders/anim_fs.glsl");
	gl.bindAttribLocation(anim_sp, 0, "vp");
	gl.bindAttribLocation(anim_sp, 1, "vt");
	gl.linkProgram (anim_sp);
	anim_M_loc = gl.getUniformLocation (anim_sp, "M");
	anim_frame_loc = gl.getUniformLocation (anim_sp, "frame");

	// sprites
	basic_sp = load_shaders_from_files ("shaders/basic_vs.glsl", "shaders/basic_fs.glsl");
	gl.bindAttribLocation(basic_sp, 0, "vp");
	gl.bindAttribLocation(basic_sp, 1, "vt");
	gl.linkProgram (basic_sp);
	basic_M_loc = gl.getUniformLocation (basic_sp, "M");

	airmeter_sp = load_shaders_from_files ("shaders/airmeter_vs.glsl", "shaders/airmeter_fs.glsl");
	gl.bindAttribLocation(airmeter_sp, 0, "vp");
	gl.bindAttribLocation(airmeter_sp, 1, "vt");
	gl.linkProgram (airmeter_sp);
	airmeter_M_loc = gl.getUniformLocation (airmeter_sp, "M");
	var airmeter_fulltex_loc = gl.getUniformLocation (airmeter_sp, "fulltex");
	var airmeter_empty_loc = gl.getUniformLocation (airmeter_sp, "emptytex");
	airmeter_air_fac_loc = gl.getUniformLocation (airmeter_sp, "air_fac");
	gl.useProgram (airmeter_sp);
	gl.uniform1i (airmeter_fulltex_loc, 0);
	gl.uniform1i (airmeter_empty_loc, 1);
	gl.uniform1f (airmeter_air_fac_loc, 1.0);

	red_mist_sp = load_shaders_from_files ("shaders/red_mist_vs.glsl", "shaders/red_mist_fs.glsl");
	gl.bindAttribLocation(red_mist_sp, 0, "vp");
	gl.bindAttribLocation(red_mist_sp, 1, "vt");
	gl.linkProgram (red_mist_sp);
	red_mist_M_loc = gl.getUniformLocation (red_mist_sp, "M");
	red_mist_alpha_loc = gl.getUniformLocation (red_mist_sp, "alpha");

	// post-processing
	fb_sp = load_shaders_from_files ("shaders/fb_vs.glsl", "shaders/fb_fs.glsl");
	gl.bindAttribLocation(fb_sp, 0, "vp");
	gl.bindAttribLocation(fb_sp, 1, "vt");
	gl.linkProgram (fb_sp);
	fb_air_fac_loc = gl.getUniformLocation (fb_sp, "air_fac");
	fb_t_loc = gl.getUniformLocation (fb_sp, "t");
	fb_scream_loc = gl.getUniformLocation (fb_sp, "scream");
	fb_shake_loc = gl.getUniformLocation (fb_sp, "shake");
}

function create_geometry () {
	console.log ("creating geometry");

	// just make a -1:1 buffer for all and scale it as required
	var points = [
		-1.0, -1.0,
		1.0, -1.0,
		-1.0, 1.0,
		-1.0, 1.0,
		1.0, -1.0,
		1.0, 1.0
	];
	var texcoords = [
		0.0, 0.0,
		1.0, 0.0,
		0.0, 1.0,
		0.0, 1.0,
		1.0, 0.0,
		1.0, 1.0
	];

	// backdrop
	backdrop_vp_vbo = gl.createBuffer ();
	gl.bindBuffer (gl.ARRAY_BUFFER, backdrop_vp_vbo);
	gl.bufferData (gl.ARRAY_BUFFER, new Float32Array (points), gl.STATIC_DRAW);
	backdrop_vt_vbo = gl.createBuffer ();
	gl.bindBuffer (gl.ARRAY_BUFFER, backdrop_vt_vbo);
	gl.bufferData (gl.ARRAY_BUFFER, new Float32Array (texcoords), gl.STATIC_DRAW);

	points = [
		-1.0, -1.0,
		1.0, -1.0,
		-1.0, -0.5,
		-1.0, -0.5,
		1.0, -1.0,
		1.0, -0.5
	];

	// rocks
	rocks_vp_vbo = gl.createBuffer ();
	gl.bindBuffer (gl.ARRAY_BUFFER, rocks_vp_vbo);
	gl.bufferData (gl.ARRAY_BUFFER, new Float32Array (points), gl.STATIC_DRAW);

	create_weed ();
}

function create_textures () {
	console.log ("loading textures");

	backdrop_texture = create_texture_from_file ("art/backdrop.png");
	iceberg_texture = create_texture_from_file ("art/iceberg.png");
	moray_texture = create_texture_from_file ("art/moray.png");
	ship_texture = create_texture_from_file ("art/ship.png");
	sailor_texture = create_texture_from_file (sailor_image_file);
	shark_texture = create_texture_from_file (shark_image_file);
	dolphin_texture = create_texture_from_file (dolphin_image_file);
	red_mist_texture = create_texture_from_file ("art/red_mist.png");
	rocks_texture = create_texture_from_file ("art/rocks.png");
	jolly_boat_textures[0] = create_texture_from_file ("art/jolly_boat.png");
	jolly_boat_textures[1] = create_texture_from_file ("art/jolly_boat_1.png");
	jolly_boat_textures[2] = create_texture_from_file ("art/jolly_boat_2.png");
	jolly_boat_textures[3] = create_texture_from_file ("art/jolly_boat_3.png");
	jolly_boat_textures[4] = create_texture_from_file ("art/jolly_boat_4.png");
	jolly_boat_textures[5] = create_texture_from_file ("art/jolly_boat_anim.png");
	airempty_texture = create_texture_from_file ("art/airempty.png");
	airfull_texture = create_texture_from_file ("art/airfull.png");
}

function main_loop () {
	current_millis = (new Date).getTime ();
	var elapsed_millis = current_millis - previous_millis;
	previous_millis = current_millis;
	var elapsed_s = elapsed_millis / 1000.0;

	if (!overlay_visible) {
		time_step_accum += elapsed_s;
		while (time_step_accum > time_step_size_s) {
			compute_time_step ();
			time_step_accum -= time_step_size_s;

			if (dolphin_died) {
				//alert ("you dead. game over. you made it to level " + level);
				show_death_overlay ();
				return;
			}
		}
	}

	draw_frame (elapsed_s);
	window.requestAnimFrame (main_loop, canvas); // this function is from webgl-utils
}

var ship_y_pos = 0.75;
var berg_x_pos = 0.55;
var berg_y_pos = 0.35;
var jolly_boat_x_pos = -0.8;
var jolly_boat_y_pos = 0.8;
var full_jolly_boat_x_pos = -0.8;
var full_jolly_boat_y_pos = 0.8;
var jolly_boat_speed_mps = 0.5;
var airmeter_x_pos = 0.9;
var airmeter_y_pos = -0.8;
var airmeter_x_scale = 0.16 * 0.6;
var airmeter_y_scale = 0.30375 * 0.6;

var identity = [
	1.0, 0.0, 0.0, 0.0,
	0.0, 1.0, 0.0, 0.0,
	0.0, 0.0, 1.0, 0.0,
	0.0, 0.0, 0.0, 1.0
];

var ship_scale = 0.27;
var ship_S = [
	ship_scale, 0.0, 0.0, 0.0,
	0.0, ship_scale, 0.0, 0.0,
	0.0, 0.0, 1.0, 0.0,
	0.0, 0.0, 0.0, 1.0
];

var ship_T = [
	1.0, 0.0, 0.0, 0.0,
	0.0, 1.0, 0.0, 0.0,
	0.0, 0.0, 1.0, 0.0,
	0.0, ship_y_pos, 0.0, 1.0
];

var iceberg_S = [
	0.5, 0.0, 0.0, 0.0,
	0.0, 0.5, 0.0, 0.0,
	0.0, 0.0, 1.0, 0.0,
	0.0, 0.0, 0.0, 1.0
];

var iceberg_T = [
	1.0, 0.0, 0.0, 0.0,
	0.0, 1.0, 0.0, 0.0,
	0.0, 0.0, 1.0, 0.0,
	berg_x_pos, berg_y_pos, 0.0, 1.0
];

var moray_S = [
	0.08, 0.0, 0.0, 0.0,
	0.0, 0.08, 0.0, 0.0,
	0.0, 0.0, 1.0, 0.0,
	0.0, 0.0, 0.0, 1.0
];

var moray_T = [
	1.0, 0.0, 0.0, 0.0,
	0.0, 1.0, 0.0, 0.0,
	0.0, 0.0, 1.0, 0.0,
	moray_x_pos, moray_y_pos, 0.0, 1.0
];

var morayb_S = [
	-0.08, 0.0, 0.0, 0.0,
	0.0, 0.08, 0.0, 0.0,
	0.0, 0.0, 1.0, 0.0,
	0.0, 0.0, 0.0, 1.0
];

var morayb_T = [
	1.0, 0.0, 0.0, 0.0,
	0.0, 1.0, 0.0, 0.0,
	0.0, 0.0, 1.0, 0.0,
	morayb_x_pos, morayb_y_pos, 0.0, 1.0
];

var jolly_boat_S = [
	0.125, 0.0, 0.0, 0.0,
	0.0, 0.0625, 0.0, 0.0,
	0.0, 0.0, 1.0, 0.0,
	0.0, 0.0, 0.0, 1.0
];

var jolly_boat_T = [
	1.0, 0.0, 0.0, 0.0,
	0.0, 1.0, 0.0, 0.0,
	0.0, 0.0, 1.0, 0.0,
	jolly_boat_x_pos, jolly_boat_y_pos, 0.0, 1.0
];

var airmeter_S = [
	airmeter_x_scale, 0.0, 0.0, 0.0,
	0.0, airmeter_y_scale, 0.0, 0.0,
	0.0, 0.0, 1.0, 0.0,
	0.0, 0.0, 0.0, 1.0
];

var airmeter_T = [
	1.0, 0.0, 0.0, 0.0,
	0.0, 1.0, 0.0, 0.0,
	0.0, 0.0, 1.0, 0.0,
	airmeter_x_pos, airmeter_y_pos, 0.0, 1.0
];

var ship_crashed = false;
var ship_M = mult_mat4_mat4 (ship_T, ship_S);
var iceberg_M = mult_mat4_mat4 (iceberg_T, iceberg_S);
var moray_M = mult_mat4_mat4 (moray_T, moray_S);
var morayb_M = mult_mat4_mat4 (morayb_T, morayb_S);
var jolly_boat_M = mult_mat4_mat4 (jolly_boat_T, jolly_boat_S);
var full_jolly_boat_M = mult_mat4_mat4 (jolly_boat_T, jolly_boat_S);
var airmeter_M = mult_mat4_mat4 (airmeter_T, airmeter_S);


function compute_time_step () {

	if (boat_away) {
		full_jolly_boat_x_pos += jolly_boat_speed_mps * time_step_size_s;
		full_jolly_boat_T = [
		1.0, 0.0, 0.0, 0.0,
		0.0, 1.0, 0.0, 0.0,
		0.0, 0.0, 1.0, 0.0,
		full_jolly_boat_x_pos, full_jolly_boat_y_pos, 0.0, 1.0
	];
		full_jolly_boat_M = mult_mat4_mat4 (full_jolly_boat_T, jolly_boat_S);
		if (full_jolly_boat_x_pos >= 1.125) {
			boat_away = false;
			full_jolly_boat_x_pos = -0.8;
			level++;
			document.getElementById ('level_html').innerHTML = "Level: " + level;

			if (9 == level) {
				document.getElementById('game_over_title').innerHTML = 'You Win!';
				document.getElementById('dead_dolphin_place').src = 'art/dolphin.png';
				show_death_overlay ();
			}
		}
		return;
	}

	// morays
	if (show_moray_a_time_left > 0.0) {
		show_moray_a_time_left -= time_step_size_s;
	} else {
		moray_a_countdown -= time_step_size_s;
		if (moray_a_countdown <= 0.0) {
			show_moray_a_time_left = 5.0;
			moray_a_countdown = Math.random() * 60.0;
		}
	}
	if (show_moray_b_time_left > 0.0) {
		show_moray_b_time_left -= time_step_size_s;
	} else {
		moray_b_countdown -= time_step_size_s;
		if (moray_b_countdown <= 0.0) {
			show_moray_b_time_left = 5.0;
			moray_b_countdown = Math.random() * 60.0;
		}
	}
	
	

	if (!ship_crashed) {
		ship_y_pos -= 0.0002916;
		if (ship_y_pos < -0.8) {
			ship_y_pos = -0.8;
			ship_crashed = true;
			play_sound ("ship_crash");
			shake_timer = 2.0;
		}
		ship_T = [
			1.0, 0.0, 0.0, 0.0,
			0.0, 1.0, 0.0, 0.0,
			0.0, 0.0, 1.0, 0.0,
			0.0, ship_y_pos, 0.0, 1.0
		];
		ship_M = mult_mat4_mat4 (ship_T, ship_S);
	} else {
		shake_timer = Math.max (0.0, shake_timer - time_step_size_s);
	}

	berg_y_pos = Math.sin (current_millis * 0.00125) * 0.01 + 0.35;
	iceberg_T = [
		1.0, 0.0, 0.0, 0.0,
		0.0, 1.0, 0.0, 0.0,
		0.0, 0.0, 1.0, 0.0,
		0.55, berg_y_pos, 0.0, 1.0
	];
	iceberg_M = mult_mat4_mat4 (iceberg_T, iceberg_S);

	jolly_boat_y_pos = Math.cos (current_millis * 0.00125) * 0.01 + 0.8;
	jolly_boat_T = [
		1.0, 0.0, 0.0, 0.0,
		0.0, 1.0, 0.0, 0.0,
		0.0, 0.0, 1.0, 0.0,
		jolly_boat_x_pos, jolly_boat_y_pos, 0.0, 1.0
	];
	jolly_boat_M = mult_mat4_mat4 (jolly_boat_T, jolly_boat_S);

	move_sailors ();
	if (5 == rescue_count) {
		// just in case 2 boats filled at once
		if (!boat_away) {
			boat_away = true;
			play_sound ("end");
			rescue_count = 0;
		}
	}
	move_sharks ();
	move_dolphin ();
	update_red_mists ();
}

function draw_frame (elapsed_s) {
	gl.bindFramebuffer (gl.FRAMEBUFFER, fb);

	//gl.clear (gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.clear (gl.COLOR_BUFFER_BIT);

	gl.enableVertexAttribArray (0);
	gl.enableVertexAttribArray (1);

	// backdrop
	gl.useProgram (backdrop_sp);
	gl.uniform1f (backdrop_level_loc, level);
	gl.bindBuffer (gl.ARRAY_BUFFER, backdrop_vp_vbo);
	gl.vertexAttribPointer (0, 2, gl.FLOAT, gl.FALSE, 0, 0);
	gl.bindBuffer (gl.ARRAY_BUFFER, backdrop_vt_vbo);
	gl.vertexAttribPointer (1, 2, gl.FLOAT, gl.FALSE, 0, 0);
	gl.activeTexture (gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, backdrop_texture);
	gl.drawArrays(gl.TRIANGLES, 0, 6);

	gl.enable (gl.BLEND);

	// iceberg
	gl.useProgram (basic_sp);
	gl.uniformMatrix4fv (basic_M_loc, gl.FALSE, iceberg_M);
	gl.activeTexture (gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, iceberg_texture);
	gl.drawArrays(gl.TRIANGLES, 0, 6);

	// ship
	gl.useProgram (basic_sp);
	gl.uniformMatrix4fv (basic_M_loc, gl.FALSE, ship_M);
	gl.activeTexture (gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, ship_texture);
	gl.drawArrays(gl.TRIANGLES, 0, 6);

	// sailors
	gl.useProgram (anim_sp);
	gl.activeTexture (gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, sailor_texture);
	for (var i = 0; i < sailors.length; i++) {
		gl.uniformMatrix4fv (anim_M_loc, gl.FALSE, sailors[i].M);
		gl.uniform1f (anim_frame_loc, sailors[i].anim_frame);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}

	// sharks
	gl.useProgram (anim_sp);
	gl.activeTexture (gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, shark_texture);
	for (var i = 0; i < sharks.length; i++) {
		gl.uniformMatrix4fv (anim_M_loc, gl.FALSE, sharks[i].M);
		gl.uniform1f (anim_frame_loc, sharks[i].anim_frame);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}

	// jolly boat
	gl.useProgram (basic_sp);
	gl.uniformMatrix4fv (basic_M_loc, gl.FALSE, jolly_boat_M);
	gl.activeTexture (gl.TEXTURE0);
	if (rescue_count <= 5) {
		gl.bindTexture(gl.TEXTURE_2D, jolly_boat_textures[rescue_count]);
	}
	gl.drawArrays(gl.TRIANGLES, 0, 6);

	if (boat_away) {
		gl.useProgram (anim_sp);
		gl.uniformMatrix4fv (anim_M_loc, gl.FALSE, full_jolly_boat_M);
		var r = Math.sin (current_millis / 50.0);
		if (r > 0.0) {
			gl.uniform1f (anim_frame_loc, 1.0);
		} else {
			gl.uniform1f (anim_frame_loc, 0.0);
		}
		gl.activeTexture (gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, jolly_boat_textures[5]);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}

	// dolphin
	gl.useProgram (anim_sp);
	gl.uniformMatrix4fv (anim_M_loc, gl.FALSE, dolphin_M);
	gl.uniform1f (anim_frame_loc, dolphin_anim_frame);
	gl.activeTexture (gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, dolphin_texture);
	gl.drawArrays(gl.TRIANGLES, 0, 6);

	// red mists
	gl.useProgram (red_mist_sp);
	gl.activeTexture (gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, red_mist_texture);
	for (var i = 0; i < red_mists.length; i++) {
		gl.uniform1f (red_mist_alpha_loc, red_mists[i].alpha);
		gl.uniformMatrix4fv (red_mist_M_loc, gl.FALSE, red_mists[i].M);
		//gl.uniform1f (red_mist_alpha_loc, 1.0);
		//gl.uniformMatrix4fv (red_mist_M_loc, gl.FALSE, identity);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}

	draw_weed ();

	// moray
	gl.bindBuffer (gl.ARRAY_BUFFER, backdrop_vp_vbo);
	gl.vertexAttribPointer (0, 2, gl.FLOAT, gl.FALSE, 0, 0);
	gl.bindBuffer (gl.ARRAY_BUFFER, backdrop_vt_vbo);
	gl.vertexAttribPointer (1, 2, gl.FLOAT, gl.FALSE, 0, 0);
	
	gl.activeTexture (gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, moray_texture);

	gl.useProgram (basic_sp);
	if (show_moray_a_time_left > 0.0) {
		gl.uniformMatrix4fv (basic_M_loc, gl.FALSE, moray_M);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}
	if (show_moray_b_time_left > 0.0) {
		gl.uniformMatrix4fv (basic_M_loc, gl.FALSE, morayb_M);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}

	// rocks
	gl.useProgram (basic_sp);
	gl.uniformMatrix4fv (basic_M_loc, gl.FALSE, identity);
	gl.bindBuffer (gl.ARRAY_BUFFER, rocks_vp_vbo);
	gl.vertexAttribPointer (0, 2, gl.FLOAT, gl.FALSE, 0, 0);
	gl.activeTexture (gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, rocks_texture);
	gl.drawArrays(gl.TRIANGLES, 0, 6);

	gl.disable (gl.BLEND);

	// post processing pass
	gl.bindFramebuffer (gl.FRAMEBUFFER, null);
	gl.clear (gl.COLOR_BUFFER_BIT);
	gl.bindBuffer (gl.ARRAY_BUFFER, backdrop_vp_vbo);
	gl.vertexAttribPointer (0, 2, gl.FLOAT, gl.FALSE, 0, 0);
	gl.useProgram (fb_sp);
	gl.uniform1f (fb_t_loc, (current_millis - initial_time_ms) / 1000.0);
	//console.log ((current_millis - initial_time_ms) / 1000.0);
	gl.uniform1f (fb_air_fac_loc, dolphin_air_fac);
	gl.uniform1f (fb_scream_loc, crazy_dolphin_countdown * 15.0);
	gl.uniform1f (fb_shake_loc, shake_timer);
	gl.activeTexture (gl.TEXTURE0);
	gl.bindTexture (gl.TEXTURE_2D, fb_texture);
	gl.drawArrays(gl.TRIANGLES, 0, 6);

	gl.enable (gl.BLEND);

	// airmeter
	gl.useProgram (airmeter_sp);
	gl.uniformMatrix4fv (airmeter_M_loc, gl.FALSE, airmeter_M);
	gl.uniform1f (airmeter_air_fac_loc, dolphin_air_fac);
	gl.bindBuffer (gl.ARRAY_BUFFER, backdrop_vp_vbo);
	gl.vertexAttribPointer (0, 2, gl.FLOAT, gl.FALSE, 0, 0);
	gl.activeTexture (gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, airfull_texture);
	gl.activeTexture (gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, airempty_texture);
	gl.drawArrays(gl.TRIANGLES, 0, 6);

	gl.disable (gl.BLEND);
}
