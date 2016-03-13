var canvas = document.getElementById('watcher-canvas');
var canvas4Meters = document.getElementById('meter-canvas');
var ctx = canvas.getContext("2d");
var ctx4Meters = canvas4Meters.getContext("2d");

function drawTerrain(ctx) {
	var row, c, x, y;

	for (var j=0; j < World.tiles.length; j++) {
		row = World.tiles[j];
		y = j * 16;
		for (var i=0; i < row.length; i++) {
			x = i * 16;
			c = row[i].char;
			if (c == 'T') {
				ctx.fillStyle="#222222";
			} else if (c == 'A') {
				ctx.fillStyle="#F7F7FA";
			} else if (c == 'S') {
				ctx.fillStyle="#EE1111";
			} else if (c == 'E') {
				ctx.fillStyle="#1111EE";
			} else {
				ctx.fillStyle="#FFFFFF";
			}
			ctx.fillRect(x, y, 16, 16);
		}
	}
}

function drawBodies(ctx) {
	var body;
	for (var i = 0; i < World.bodies.length; i++) {
		body = World.bodies[i];
		if (i == 0) {
			ctx.fillStyle = "#00FF00"; //green
		} else if (i < 10) {
			ctx.fillStyle = "#00FFFF"; //cyan
		} else {
			ctx.fillStyle = "#FFFF00"; //yellow
		}

		x = body.position.x - body.halfWidth;
		y = body.position.y - body.halfHeight;

		if (body.pose) {
			// ctx.beginPath();
			// ctx.strokeStyle = "green";
			// ctx.rect(x, y, body.size.width + 2, body.size.height + 2);
			// ctx.stroke();

			var sprite;
			var pose = body.pose;
			var frames = body.poseSpriteCycleFrames;
			var cycles = body.poseSpriteCycles;
			if (cycles[pose]) {
				if (frames[pose] == undefined)
					frames[pose] = 0;
				sprite = cycles[pose][frames[pose]][body.isFacingRight];
				if (World.tick % 5 == 0) {
					console.log(body.name + " " + cycles[pose].length);
					frames[pose] = (frames[pose] + 1) % cycles[pose].length;
					console.log(frames[pose]);
				}

			} else if (body.poseSprites[body.pose]) {
				sprite = body.poseSprites[body.pose][body.isFacingRight];
				//console.log(sprite);
			} else {
				console.log("no-sprite"); //
			}

			var spritePosX = body.position.x - body.halfWidth;
			var spritePosY = body.position.y - body.halfHeight;

			if (sprite.sheight > body.size.height) {
				spritePosY -= (sprite.sheight - body.size.height);
			}
			if (body.isFacingRight && sprite.swidth > body.size.width) {
				spritePosX -= (sprite.swidth - body.size.width);
			}

			ctx.drawImage(
				sprite.texture
				,sprite.sx
				,sprite.sy
				,sprite.swidth
				,sprite.sheight
				,spritePosX
				,spritePosY
				,sprite.swidth
				,sprite.sheight
			);
		} else {
			ctx.fillRect(x, y, body.size.width, body.size.height);
		}
	}
}

function drawMeters(ctx) {
	var body;
	var x = 10;
	var y = 10;
	var brickAmt, accumAmt;
	for (var i = 0; i < World.bodies.length; i++) {
		body = World.bodies[i];
		if (!body.robot) continue;

		//INTEG BAR

		//Backing
		ctx.fillStyle = "#080808"
		ctx.fillRect(x, y, 8, 28 * 3 + 27 + 2)

		//Full Portion
		var brickAmt = Math.floor(body.esinks.integ.max / 28);
		var accumAmt = 0;
		ctx.fillStyle = "#F8F8F8"
		for (var i = 0; i < 28; i++) {
			var amt = brickAmt * i;
			if (body.esinks.integ.free >= amt) {
				ctx.fillRect(x + 1, y + 28 * 3 + 25 - 4 * i, 6, 3);
			} else {
				ctx.fillStyle = "#202020";
				ctx.fillRect(x + 1, y + 28 * 3 + 25 - 4 * i, 6, 3);
			}
		}

		//BRACE BAR

		//Backing
		ctx.fillStyle = "#080808"
		ctx.fillRect(x + 10, y, 8, 28 * 3 + 27 + 2)

		//Full Portion
		var brickAmt = Math.floor(body.esinks.bracing.max / 28);
		var accumAmt = 0;
		ctx.fillStyle = "#000088"
		for (var i = 0; i < 28; i++) {
			var amt = brickAmt * i;
			if (body.esinks.bracing.free >= amt) {
				ctx.fillRect(x + 10 + 1, y + 28 * 3 + 25 - 4 * i, 6, 3);
			} else {
				ctx.fillStyle = "#202020";
				ctx.fillRect(x + 10 + 1, y + 28 * 3 + 25 - 4 * i, 6, 3);
			}
		}

		//MOVE BAR

		//Backing
		ctx.fillStyle = "#080808"
		ctx.fillRect(x + 20, y, 8, 28 * 3 + 27 + 2)

		//Full Portion
		var brickAmt = Math.floor(body.estores.move.max / 28);
		var accumAmt = 0;
		ctx.fillStyle = "#F88808"
		for (var i = 0; i < 28; i++) {
			var amt = brickAmt * i;
			if (body.estores.move.free >= amt) {
				ctx.fillRect(x + 20 + 1, y + 28 * 3 + 25 - 4 * i, 6, 3);
			} else {
				ctx.fillStyle = "#202020"
				ctx.fillRect(x + 20 + 1, y + 28 * 3 + 25 - 4 * i, 6, 3);
				;//console.log("##")
			}
		}

	}
}

function redraw() {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Clears the canvas

  // This is currently inefficient and silly - the whole terrain is being redrawn
  // each step. TODO: Draw it once to a background canvas and keep it there
  // until disrupted.
	drawTerrain(ctx);

	// Although our other layers SHOULD be set up to faithfully send animate messages,
	// our renderer right now mostly ignores those messages
	// and instead just redraws everything which can move
	// at its current location each frame.
	drawBodies(ctx);

	// As with the terrain, these bars are being competely redrawn every tick right now
	drawMeters(ctx4Meters);
	
}