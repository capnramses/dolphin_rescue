var dolphin_x_pos = -0.5;
var dolphin_y_pos = 0.75;
var dolphin_x_dir = 1.0;
var dolphin_air_fac = 1.0;
var dolphin_died = false;
var dolphin_texture;
var dolphin_grab_range = 0.05;
var dolphin_has_sailor = false;
var dolphin_at_surface = true;
var dolphin_image_file = "art/dolphin_anims.png";
var dolphin_anim_frame = 0;
var dolphin_move_time = 0.0;
var dolphin_moving = false;
var used_scream = false;
var crazy_dolphin_mode = false;
var crazy_dolphin_countdown = 0.0;

var dolphin_S = [
	0.09, 0.0, 0.0, 0.0,
	0.0, 0.09, 0.0, 0.0,
	0.0, 0.0, 1.0, 0.0,
	0.0, 0.0, 0.0, 1.0
];

var dolphin_T = [
	1.0, 0.0, 0.0, 0.0,
	0.0, 1.0, 0.0, 0.0,
	0.0, 0.0, 1.0, 0.0,
	dolphin_x_pos, dolphin_y_pos, 0.0, 1.0
];
var dolphin_M = mult_mat4_mat4 (dolphin_T, dolphin_S);

function move_dolphin () {
	if (crazy_dolphin_mode) {
		crazy_dolphin_countdown -= time_step_size_s;
		if (crazy_dolphin_countdown <= 0.0) {
			crazy_dolphin_mode = false;
			dolphin_anim_frame = 0;
			return;
		}
		dolphin_anim_frame = 3; // top-left
		var r = Math.sin (current_millis / 25.0);
		if (r > 0.0) {
			dolphin_anim_frame = 4;
		}
		return;
	}

	var keyed = false;
	var dolphin_x_speed_mps = 0.55; // whole width in 3 secs
	var dolphin_y_speed_mps = 0.33; // whole width in 3 secs
	// left
	if (keys_down[37] || keys_down[65]) {
		dolphin_x_pos -= dolphin_x_speed_mps * time_step_size_s;
		keyed = true;
		dolphin_x_dir = -1.0;
	}

	// up arrow or w
	if (keys_down[38] || keys_down[87]) {
		dolphin_y_pos += dolphin_y_speed_mps * time_step_size_s;
		keyed = true;
	}

	// right
	if (keys_down[39] || keys_down[68]) {
		dolphin_x_pos += dolphin_x_speed_mps * time_step_size_s;
		keyed = true;
		dolphin_x_dir = 1.0;
	}
	
	// down arrow or s
	if (keys_down[40] || keys_down[83]) {
		dolphin_y_pos -= dolphin_y_speed_mps * time_step_size_s;
		keyed = true;
	}
	if (keys_down[32]) {
		if (!used_scream) {
			kill_all_sharks ();
			crazy_dolphin_mode = true;
			crazy_dolphin_countdown = 1.0;
			used_scream = true;
			// sound
			play_sound ("scream");
			// also refill air to be nice and make related effects completely separate
			dolphin_air_fac = 1.0;
			// TODO fbuffer
		}
	}
	if (keyed) {
		dolphin_x_pos = Math.max(-1.0, Math.min (1.0, dolphin_x_pos));
		dolphin_y_pos = Math.max(-1.0, Math.min (0.75, dolphin_y_pos));
		dolphin_S = [
			0.09 * dolphin_x_dir, 0.0, 0.0, 0.0,
			0.0, 0.09, 0.0, 0.0,
			0.0, 0.0, 1.0, 0.0,
			0.0, 0.0, 0.0, 1.0
		];
		dolphin_T = [
			1.0, 0.0, 0.0, 0.0,
			0.0, 1.0, 0.0, 0.0,
			0.0, 0.0, 1.0, 0.0,
			dolphin_x_pos, dolphin_y_pos, 0.0, 1.0
		];
		dolphin_M = mult_mat4_mat4 (dolphin_T, dolphin_S);

		if (!dolphin_moving) {
			dolphin_move_time = 0.0;
			dolphin_moving = true;
			dolphin_anim_frame = 0;
		}

		dolphin_move_time += time_step_size_s;
		if (dolphin_move_time > 0.25) {
			dolphin_move_time -= 0.25;
			dolphin_anim_frame = (dolphin_anim_frame + 1) % 2;
		}
	} else {
		dolphin_moving = false;
	}

	grab_first_sailor_near (dolphin_x_pos, dolphin_y_pos, dolphin_grab_range);

	if (dolphin_y_pos > 0.74) {
		dolphin_air_fac = 1.0;
		if (!dolphin_at_surface) {
			dolphin_at_surface = true;
			play_sound ("blow_hole");
		}
	} else {
		dolphin_at_surface = false;
		var was_above = false;
		if (dolphin_air_fac > 0.25) {
			was_above = true;
		}
		dolphin_air_fac -= 0.075 * time_step_size_s;
		if (dolphin_air_fac < 0.25 && was_above) {
			play_sound ("oob");
		}
		if (dolphin_air_fac <= 0.0) {
			dolphin_died = true;
		}
	}
}
