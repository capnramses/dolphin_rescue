var sailors = new Array ();
var sailor_scale = 0.07;
var sailor_texture;
var sailor_speed_mps = 0.06;
var sailor_timer_min = 8.0;
var sailor_timer_max = 8.0;
var sailor_current_timer_limit = 0.0;
var sailor_countup = 0.0;
var sailor_image_file = "art/sailor_anim.png";

function sailor_constructor () {
	this.grabbed = false;


	var min_y = -0.75;
	var max_y = 0.75;
	//var range = max_y - min_y;
	//this.y_pos = min_y + Math.random() * range;

	// 10 lanes
	var lane = Math.floor (Math.random () * 11); // 0-10
	// lanes from -0.75 to 0.75 (range 1.5, .: lanes are 0.15 apart)
	this.y_pos = -0.75 + lane * 0.15;


	this.anim_frame = 0;
	this.move_time = 0.0;

	var coinflip = -1.0 + Math.random() * 2.0;
	if (coinflip < 0.0) {
		this.x_dir = -1.0;
		this.x_pos = 1.2;
	} else {
		this.x_dir = 1.0;
		this.x_pos = -1.2;
	}

	this.S = [
		sailor_scale * this.x_dir, 0.0, 0.0, 0.0,
		0.0, sailor_scale, 0.0, 0.0,
		0.0, 0.0, sailor_scale, 0.0,
		0.0, 0.0, 0.0, 1.0
	];
	var T = [
		1.0, 0.0, 0.0, 0.0,
		0.0, 1.0, 0.0, 0.0,
		0.0, 0.0, 1.0, 0.0,
		this.x_pos, this.y_pos, 0.0, 1.0
	];
	//console.log ("sailor pos=" + sailor_x_pos + "," + sailor_y_pos);
	this.M = mult_mat4_mat4 (T, this.S);
}

function generate_sailor () {
	var sailor = new sailor_constructor ();
	sailors.push (sailor);
	console.log ("curr sailors count: " + sailors.length);
}

function move_sailors () {
	sailor_countup += time_step_size_s;
	if (sailor_countup >= sailor_current_timer_limit) {
		generate_sailor ();
		//if (0 == level) {
			var timer_range = sailor_timer_max - sailor_timer_min;
			sailor_current_timer_limit = sailor_timer_min + Math.random() * timer_range;
		//}
		sailor_countup = 0.0;
	}

	for (var i = 0; i < sailors.length; i++) {

		if (sailors[i].grabbed) {
			sailors[i].x_pos = dolphin_x_pos;
			sailors[i].y_pos = dolphin_y_pos;
		} else {
			sailors[i].move_time += time_step_size_s;
			if (sailors[i].move_time >= 0.25) {
				sailors[i].move_time -= 0.25;
				sailors[i].anim_frame = (sailors[i].anim_frame + 1) % 2;
			}
			sailors[i].x_pos += sailors[i].x_dir * sailor_speed_mps * time_step_size_s;
		}

		var T = [
			1.0, 0.0, 0.0, 0.0,
			0.0, 1.0, 0.0, 0.0,
			0.0, 0.0, 1.0, 0.0,
			sailors[i].x_pos, sailors[i].y_pos, 0.0, 1.0
		];
		sailors[i].M = mult_mat4_mat4 (T, sailors[i].S);
		//console.log ("sailor moved: " + i);
	}

	// remove any off-screen sailors
	var removed = true;
	while (removed) {
		removed = false;
		for (var i = 0; i < sailors.length; i++) {
			if (Math.abs (sailors[i].x_pos) > 1.2) {
				sailors.splice ([i], 1);
				removed = true;
				break;
			}

			// check if surfaced
			if (dolphin_has_sailor && sailors[i].y_pos > 0.74 && sailors[i].x_pos < -0.7) {
				console.log ("sailor saved!");
				dolphin_has_sailor = false;
				// TODO adjust score and level
				rescue_count++;
				saved++;
				sailors.splice ([i], 1);
				removed = true;
				break;
			}

		}
	}
}

function eat_first_sailor_near (x, y, range) {
	for (var i = 0; i < sailors.length; i++) {
		var xdist = x - sailors[i].x_pos;
		var ydist = y - sailors[i].y_pos;
		var sqdist = xdist * xdist + ydist * ydist;
		if (sqdist < range * range) {

			// if dolph was carrying, uncarry
			if (sailors[i].grabbed) {
				dolphin_has_sailor = false;
			}

			generate_red_mist (sailors[i].x_pos, sailors[i].y_pos)
			// CHOMP!
			sailors.splice ([i], 1);
			play_sound ("eaten");

			console.log ("CHOMP!");
			return; // only chomp 1 at a time
		}
	}
}

function grab_first_sailor_near (x, y, range) {
	if (dolphin_has_sailor) {
		return; // 1 at a time
	}
	for (var i = 0; i < sailors.length; i++) {
		var xdist = x - sailors[i].x_pos;
		var ydist = y - sailors[i].y_pos;
		var sqdist = xdist * xdist + ydist * ydist;
		if (sqdist < range * range) {
			sailors[i].grabbed = true;
			console.log ("GRAB!");
			dolphin_has_sailor = true;
			play_sound ("help_me");
			return; // only chomp 1 at a time
		}
	}
}
