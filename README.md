#Dolphin Rescue#

Entry for 48-hour competition Ludum Dare 28. Theme: "You Only Get One",
13-14 December 2013.

* Anton Gerdelan @capnramses

* Entry URL in LD28: http://ludumdare.com/compo/ludum-dare-28/?action=preview&uid=30024
* On-line URL (so you can play it now): http://antongerdelan.net/dolphin_rescue/

##Comments##

This is a 2d WebGL game, and my first Ludum Dare game in this format - I later
did "Mountain Rescue" for LD29.
The game ranked no. 420 and did pretty well for humour.

The game is a remake/re-imagining of Atari 2600 game "Seaquest"
http://youtu.be/ZeRGJk7HQGc except with a dolphin instead of a submarine.
The idea is to rescue the sailors from the sharks and put them in the boat.
When you get 5 in the boat they row off and you get to the next
harder/faster/darker level. There are 9 levels.

The "you only get one" bit was kind of lame - I just added a super dolphin
power that kills everything, refills your air and makes the screen flash when
you press the space bar. This only works once per game.

This was an idea I'd been brewing at work that WebGL would be a great platform
for rapidly doing a 2d game that distributed easily over the web. I was right.

I tried a few neat effects:

* atlas-based sprite animation
* vertex shader animation
* various post-processing framebuffer effects
* shader-based animated GUIs
* screen shake
* HTML5 audio

I had some issues with HTML5 audio not pre-buffering and JavaScript memory
dynamic management doing weird things (there is a bug with sailors getting into
the boat unaided sometimes).
