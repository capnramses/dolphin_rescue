var red_mists = new Array ();
var red_mist_scale = 0.14;
var red_mist_texture;
var red_mist_alpha_decay = 0.05;
var red_mist_sp;
var red_mist_M_loc;
var red_mist_alpha_loc;

function red_mist_constructor (x_pos, y_pos) {
	this.x_pos = x_pos;
	this.y_pos = y_pos;
	this.alpha = 1.0;

	this.S = [
		red_mist_scale, 0.0, 0.0, 0.0,
		0.0, red_mist_scale, 0.0, 0.0,
		0.0, 0.0, red_mist_scale, 0.0,
		0.0, 0.0, 0.0, 1.0
	];
	var T = [
		1.0, 0.0, 0.0, 0.0,
		0.0, 1.0, 0.0, 0.0,
		0.0, 0.0, 1.0, 0.0,
		this.x_pos, this.y_pos, 0.0, 1.0
	];
	//console.log ("red_mist pos=" + red_mist_x_pos + "," + red_mist_y_pos);
	this.M = mult_mat4_mat4 (T, this.S);
}

function generate_red_mist (x_pos, y_pos) {
	var red_mist = new red_mist_constructor (x_pos, y_pos);
	red_mists.push (red_mist);
	console.log ("curr red_mists count: " + red_mists.length);
}

function update_red_mists () {
	for (var i = 0; i < red_mists.length; i++) {
		red_mists[i].alpha -= red_mist_alpha_decay * time_step_size_s;
	}
	var removed = true;
	while (removed) {
		removed = false;
		for (var i = 0; i < red_mists.length; i++) {
			if (red_mists[i].alpha <= 0.0) {
				red_mists.splice ([i], 1);
				removed = true;
				break;
			}
		}
	}
}
