var sharks = new Array ();
var shark_scale = 0.15;
var shark_texture;
var shark_timer_min = 8.0;
var shark_timer_max = 8.0;
var shark_current_timer_limit = 8.0;
var shark_countup = 0.0;
var shark_eat_range = 0.085;
var shark_image_file = "art/shark_anim.png";
var all_sharks_dead = false;
var no_shark_spawn_countdown = 0.0;
var shark_fall_speed = 0.3;

function shark_constructor (level) {
	this.shark_speed_mps = 0.25 + Math.max (0.0, (Math.log (level) + 2.5) * 0.1);
	var min_y = -0.75;
	var max_y = 0.75;
	var range = max_y - min_y;
	this.anim_frame = 0;
	this.move_time = 0.0;

	// level/10 chance of it being up near the boat/air
	//var chance = Math.random() * 10.0;
	//if (level > chance) {
	//	this.y_pos = max_y;
	//} else {
	//	this.y_pos = min_y + Math.random() * range;
	//}

	// 10 lanes
	var lane = Math.floor (Math.random () * 11); // 0-10
	// lanes from -0.75 to 0.75 (range 1.5, .: lanes are 0.15 apart)
	this.y_pos = -0.75 + lane * 0.15;


	var coinflip = -1.0 + Math.random() * 2.0;
	if (coinflip < 0.0) {
		this.x_dir = -1.0;
		this.x_pos = 1.2;
	} else {
		this.x_dir = 1.0;
		this.x_pos = -1.2;
	}

	this.S = [
		shark_scale * this.x_dir, 0.0, 0.0, 0.0,
		0.0, shark_scale, 0.0, 0.0,
		0.0, 0.0, shark_scale, 0.0,
		0.0, 0.0, 0.0, 1.0
	];
	var T = [
		1.0, 0.0, 0.0, 0.0,
		0.0, 1.0, 0.0, 0.0,
		0.0, 0.0, 1.0, 0.0,
		this.x_pos, this.y_pos, 0.0, 1.0
	];
	//console.log ("shark pos=" + shark_x_pos + "," + shark_y_pos);
	this.M = mult_mat4_mat4 (T, this.S);
}

function generate_shark (level) {
	var shark = new shark_constructor (level);
	sharks.push (shark);
	console.log ("curr sharks count: " + sharks.length);
}

function move_sharks () {
	if (all_sharks_dead) {
		no_shark_spawn_countdown -= time_step_size_s;
		if (no_shark_spawn_countdown <= 0.0) {
			all_sharks_dead = false;
			sharks = new Array ();
		}
		for (var i = 0; i < sharks.length; i++) {
			sharks[i].anim_frame = 4;
			sharks[i].y_pos -= shark_fall_speed * time_step_size_s;
			var T = [
				1.0, 0.0, 0.0, 0.0,
				0.0, 1.0, 0.0, 0.0,
				0.0, 0.0, 1.0, 0.0,
				sharks[i].x_pos, sharks[i].y_pos, 0.0, 1.0
			];
			sharks[i].M = mult_mat4_mat4 (T, sharks[i].S);
		}
		return;
	}

	shark_countup += time_step_size_s;
	if (shark_countup >= shark_current_timer_limit) {
		var timer_range = shark_timer_max - shark_timer_min;
		shark_current_timer_limit = shark_timer_min + Math.random() * timer_range;
		for (var i = 0; i < level + 1; i++) {
			generate_shark (i);
		}
		shark_countup = 0.0;
	}

	for (var i = 0; i < sharks.length; i++) {
		sharks[i].move_time += time_step_size_s;
		if (sharks[i].move_time >= 0.75) {
			sharks[i].move_time -= 0.75;
			sharks[i].anim_frame = (sharks[i].anim_frame + 1) % 4;
		}

		sharks[i].x_pos += sharks[i].x_dir * sharks[i].shark_speed_mps * time_step_size_s;
		var T = [
			1.0, 0.0, 0.0, 0.0,
			0.0, 1.0, 0.0, 0.0,
			0.0, 0.0, 1.0, 0.0,
			sharks[i].x_pos, sharks[i].y_pos, 0.0, 1.0
		];
		sharks[i].M = mult_mat4_mat4 (T, sharks[i].S);
		//console.log ("shark moved: " + i);

		// check vs all sailors for chomp
		eat_first_sailor_near (sharks[i].x_pos, sharks[i].y_pos, shark_eat_range);

		// check if chomp dolphin
		
		var xdist = dolphin_x_pos - sharks[i].x_pos;
		var ydist = dolphin_y_pos - sharks[i].y_pos
		var sqdist = xdist * xdist + ydist * ydist;
		if (sqdist < shark_eat_range * shark_eat_range) {
			dolphin_died = true;
			//dolphin_has_sailor = true;
			//play_sound ("help_me");
			return; // only chomp 1 at a time
		}
	}

	// remove any off-screen sharks
	var removed = true;
	while (removed) {
		removed = false;
		for (var i = 0; i < sharks.length; i++) {
			if (Math.abs (sharks[i].x_pos) > 1.2) {
				sharks.splice ([i], 1);
				removed = true;
				break;
			}
		}
	}
}

function kill_all_sharks () {
	all_sharks_dead = true;
	no_shark_spawn_countdown = 7.0;
}
