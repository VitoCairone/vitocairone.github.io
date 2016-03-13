/*
 * While actor.js, sprite.js, robot.js, etcetera contain procedures
 * and code for setting up and manipulating those types of things,
 * the actual setting up of some particular things - creation of
 * instances - occurs here, in scene.js
 */

createTiles();

// in this example the billiardBalls array isn't really used, but
// gives us a handy way to modify the balls later if desired.
// The actual store used internally for moving bodies is World.bodies

var billiardBalls = [];
var names = ["A", "B", "C", "D", "E"];

for (var i = 0; i < 5; i++) {
	var body = createBody(
		names[i],
		{dtype: 'size', width: 8, height: 8},
		{dtype: 'position', x: 100 + i * 16, y: 100 + i * 8},
		{dtype: 'options', terrainBounce: 1.0}
	)
	body.velocity = {dtype: 'vector', x: 1, y: 1};
	billiardBalls.push(body);
}