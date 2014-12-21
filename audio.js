// collection of sounds that are playing
var playing = {};
// collection of sounds
var sounds = {help_me:"sfx/help_me.wav", eaten:"sfx/eaten.wav", blow_hole:"sfx/blow_hole.wav", oob:"sfx/oob.wav", ship_crash:"sfx/ship_crash.wav", scream:"sfx/scream2.wav", end:"sfx/end.wav"};

function play_sound (x) {
	var a, b;
	b = new Date();
	a = x + b.getTime();
	playing[a] = new Audio (sounds[x]);
	// with this we prevent playing-object from becoming a memory-monster:
	playing[a].onended = function () {delete playing[a]};
	playing[a].play ();
}

// play_sound ("help_me");
