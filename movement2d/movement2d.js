// A basic implementation of Method #2
// described in this blog post
// http://higherorderfun.com/blog/2012/05/20/the-guide-to-implementing-2d-platformers/

// the character, and every moving body of interest, is an AABB.
// this is the vital difference that reduces our complexity enormously
// versus a general physics or movement engine like Matter.js
// character sprites may be larger than their AABB,
// which is a fairly uniform size not exceeding 1 across x 2 high.

// MOVEMENT:
// PHASE 1
// Decompose movement into X and Y axes, step one at a time, X first then Y
// note to self: this is for slopes and assumes X is the major heading
//
// PHASE 2
// Get coordinate of forward-moving edge in the axis
//
// PHASE 3
// Figure out which lines of tiles the AABB's forward-face intersects with.
// This gets the min and max of the OPPOSITE axis, e.g. when the body
// is moving in X, this is the range over Y (that is, the range in J)
//
// PHASE 4
// Scan in the direction of movement along those lines along the axis
// of movement, e.g. in the previous example, scan forward over I
// for each J the body intersects, until finding the nearest
// static obstacle. 
// Then loop through every moving obstacle (note to self: *perhaps*)
// and determine the nearest actual obstacle. Since all moving bodies
// know their occupied tiles, this should serve as a good first-pass
// via a hash method.
//
// PHASE 5
// The actual movement of the body is the minimum between the intended
// movement (by velocity) and the distance to the obstacle. Therefor
// this is a Continuous method and shouldn't have illegal teleportation at
// any speed, while informing colliders of all required information to
// prevent or react to collision.
//
// PHASE 6
// Move the player to the new position.
//
// Now step the other coordinate if not yet done.
// Note that we are here formally moving every piece as
// a Chess Knight, and so bodies moving extremely fast on diagonals
// will collide entirely wrong, unless the 'forward edge' is increased
// in length to account for the movement in the opposite axis
//
// FUTURE !!!: After building out a small set of test features,
// switch to calculate all AABBs according to their proper actual velocities,
// move both axes in one step rather than two, AND overlay all AABB paths
// simultaneously to process collisions all together rather than
// e.g. the implicit behavior seen here, which is that bodies earlier in
// the list move first and later in the list collide with them.

var World = World || { bodies: [], tick: 0 };
World.xPerTile = 16;
World.yPerTile = 16;

var Convert = {
  getSpeedForMetersPerSecond: function(mps) {
    // return a speed in Pixels per Tick
    return mps * 0.29163;
  },
  getEnergyForJoules: function (joules) {
    var ratio = 1.0 / this.getSpeedForMetersPerSecond(1.0);
    return joules * (ratio * ratio);
  },
  getJoulesForEnergy: function (ergons) {
    // energy is in units of kgs * pixels2/tick2
    // possibly flip this around, maybe unneeded division ?
    var ratio = 1.0 / this.getSpeedForMetersPerSecond(1.0);
    return ergons / (ratio * ratio);
  },
  getSpeedForMilesPerHour: function(mph) {
    return this.getSpeedForMetersPerSecond(mph * 0.44704);
  },
  coercePoint: function (pt) {
    if (pt.x != undefined && pt.y != undefined)
      return pt;
    if (pt.length == 2)
      return {x: pt[0], y: pt[1]};
    console.log("ERROR: Invalid input to coercePoint.");
  }
}

World.Gravity = Convert.getSpeedForMetersPerSecond(9.8) / 60.0;

var createTiles = function() {
	var stage = World.stage;
	var nj = stage.length;
	var ni = stage[0].length;
	var tiles = [];
	for (var j = 0; j < nj; j++) {
		var tileRow = [];
		for (var i = 0; i < ni; i++) {
			tileRow.push({
				dtype: 'tile'
				,char: stage[j][i]
				,terrain: (stage[j][i] == 'T')
				,occupants: []
				,passthrough: []
				,arrivers: []
			});
		}
		tiles.push(tileRow);
	}
	World.tiles = tiles;
	World.tileCount = { dtype: 'count', i: ni, j: nj };
};

var createBody = function(name, size, startPosition, options) {
	var body = {};
	body.name = name;
	body.size = size;
	body.mass = 100;
	body.halfWidth = body.size.width / 2;
	body.halfHeight = body.size.height / 2;
	body.position = startPosition;
	body.runspeed = Convert.getSpeedForMilesPerHour(8.0);
	body.velocity = {dtype: 'vector', x: 0, y: 0};
	body.xFacingSign = 1;
	body.options = options;

	//These values are for Battlerun Robots which we presume
	//are most objects actually being made right now. Everything
	//should have its various energy values set, although not
	//at these levels.
	body.esinks = {
		bracing: { dtype: 'esink', free: 8000, max: 8000 }
		,enduring: { dtype: 'esink', free: 1000, max: 1000 }
		,integ: { dtype: 'esink', free: 28000, max: 28000 }
	}
	body.estores = {
		move: {dtype: 'estore', free: 28000, max: 28000}
		,shoot: {dtype: 'estore', free: 8000, max: 8000}
		,special: {dtype: 'estore', free: 8000, max: 8000}
		,core: {dtype: 'estore', free: 32000, max: 32000, send: 
			{dtype: 'esend', move: 100, shoot: 100, special: 100}
		}
		,battery: {dtype: 'estore', free: 100000, max: 10000, send:
			{dtype: 'esend', core: 300}
		}
	}

	//TODO: Use more procedural object merger here
	if (options.terrain) {
		body.terrain = true;
	}
	if (options.robot) {
		body.robot = true;
	}
	if (options.phasic) {
		body.phasic = true;
	}
	if (options.mass != undefined) {
		body.mass = options.mass;
	}
	if (options.velocity != undefined) {
		body.velocity = options.velocity;
	}
	if (options.estores != undefined) {
		body.estores = options.estores;
	}

	World.maxBodyId++;
	body.id = World.maxBodyId;
	World.idBodyMap[body.id] = body;
	World.bodies.push(body);
	return body;
};

var renderMovement = function(body, oldPosition, newPosition) {
	// pass in oldPosition for reference and future use, not used right now
	// jQuery change inline style position of body by body_id here
	// all bodies are positioned absolutely inside a scene parent element
	var oldStr = oldPosition.x + "," + oldPosition.y;
	var newStr = newPosition.x + "," + newPosition.y;
	//console.log("Moved " + body.name + " from " + oldStr + " to " + newStr);
};

// PHASE 1
// Decompose movement into X and Y axes, step one at a time, X first then Y
// note to self: this is for slopes and assumes X is the major heading
var moveBody = function (body) {
	var oldPosition = {dtype: 'position', x: body.position.x, y: body.position.y};
	var moved = false;

	// because step 4B is done for all bodies at once, in both axises,
	// while terrain-collisions are determined one axis at a time,
	// get the collisions list here first before proceeding into step 2.
	// The information we need from worldwide mover collisions is just
	// the subtick (time-to-collide) and ids of the first impact pair.

	var collisions = getWorldwideMoverCollisions();
	var impacts = getFirstImpacts(collisions);

	// console.log("!!");
	// console.log(collisions);
	// console.log(impacts);

	if (body.velocity.x != 0) {
		body.blocked = false;
		stepMoveBodyX(body, impacts[body.id]);
		moved = true;
	}

	if (body.velocity.y != 0) {
		body.grounded = false;
		stepMoveBodyY(body, impacts[body.id]);
		moved = true;
	}

	if (moved) renderMovement(body, oldPosition, body.position);
};

// PHASE 2
// Get coordinate of forward-facing X

var getBodyForwardFacingX = function (body) {
	return body.position.x + body.halfWidth * body.xFacingSign;
};

var getBodyMovementLeadingX = function (body) {
	return body.position.x + body.halfWidth * (body.velocity.x > 0 ? 1 : -1);
};

var getBodyMovementLeadingY = function (body) {
	return body.position.y + body.halfHeight * (body.velocity.y > 0 ? 1 : -1);
};

// PHASE 3
// Figure out which lines of tiles the AABB's forward-face intersects with.
// This gets the min and max of the OPPOSITE axis, e.g. when the body
// is moving in X, this is the range over Y (that is, the range in J)

var getBodyPositionXRange = function (body) {
	var xMin = body.position.x - body.halfWidth;
	var xMax = body.position.x + body.halfWidth;
	return {dtype: 'range', min: xMin, max: xMax};
}

var getBodyPositionYRange = function (body) {
	var yMin = body.position.y - body.halfHeight;
	var yMax = body.position.y + body.halfHeight;
	return {dtype: 'range', min: yMin, max: yMax};
};

var getIRangeFromXRange = function(range) {
	var iMin = getIFromX(range.min);
	var iMax = getIFromX(range.max);
	return {dtype: 'range', min: iMin, max: iMax};
}

var getJRangeFromYRange = function(range) {
	var jMin = getJFromY(range.min);
	var jMax = getJFromY(range.max);
	return {dtype: 'range', min: jMin, max: jMax};
};

// PHASE 4
// Scan in the direction of movement along those lines along the axis
// of movement, e.g. in the previous example, scan forward over I
// for each J the body intersects, until finding the nearest
// static obstacle.
var findFirstTerrainObstacleI = function (start, direction) {
	var i = start.i;
	var j = start.j;
	var maxTileI = World.tileCount.i - 1;
	//console.log("testing j " + j);
	if (direction == 1) {
		while (i <= maxTileI) {
			//console.log("i = " + i);
			if (World.tiles[j][i].terrain) return i;
			i++;
		}
	} else {
		while (i >= 0) {
			//console.log("i = " + i);
			if (World.tiles[j][i].terrain) return i;
			i--;
		}
	}
	return null;
};

var findFirstTerrainObstacleJ = function (start, direction) {
	var i = start.i;
	var j = start.j;
	var maxTileJ = World.tileCount.j - 1;
	if (direction == 1) {
		while (j <= maxTileJ) {
			if (World.tiles[j][i].terrain) return j;
			j++;
		}
	} else {
		while (j >= 0) {
			if (World.tiles[j][i].terrain) return j;
			j--;
		}
	}
	return null;
};

var getIFromX = function (x) { return Math.floor(x / 16); };

var getJFromY = function (y) { return Math.floor(y / 16); };

var firstTerrainObstacleForBodyInX = function (body) {
	var iLoc = getIFromX(getBodyMovementLeadingX(body));
	var jRange = getJRangeFromYRange(getBodyPositionYRange(body));
	var firstI = null;
	var thisI = null;
	var firstIsJ = null;
	var jForFirstI = null;
	var xMovingSign = (body.velocity.x > 0 ? 1 : -1);
	for (var j = jRange.min; j <= jRange.max; j++) {
		thisI = findFirstTerrainObstacleI(
			{ dtype: 'location', i: iLoc, j: j }
			,xMovingSign
		);
		if ( (firstI == null) ||
			(xMovingSign == 1 && thisI < firstI) ||
			(xMovingSign == -1 && thisI > firstI) ) {
			firstI = thisI;
			jForFirstI = j;
		}
	}
	if (firstI == null) {
		return null;
	} else {
		return {dtype: 'location', i: firstI, j: jForFirstI };
	}
};

var firstTerrainObstacleForBodyInY = function (body) {
	var jLoc = getJFromY(getBodyMovementLeadingY(body));
	var iRange = getIRangeFromXRange(getBodyPositionXRange(body));
	var firstJ = null;
	var thisJ = null;
	var firstJsI = null;
	var iForFirstJ = null;
	var yMovingSign = (body.velocity.y >= 0 ? 1 : -1);
	for (var i = iRange.min; i <= iRange.max; i++) {
		thisJ = findFirstTerrainObstacleJ(
			{ dtype: 'location', i: i, j: jLoc }
			,yMovingSign
		);
		if ( (firstJ == null) ||
			(yMovingSign == 1 && thisJ < firstJ) ||
			(yMovingSign == -1 && thisJ > firstJ) ) {
			firstJ = thisJ;
			iForFirstJ = i;
		}
	}
	if (firstJ == null) {
		return null;
	} else {
		return {dtype: 'location', i: iForFirstJ, j: firstJ };
	}
};

// Then loop through every moving obstacle (note to self: *perhaps*)
// and determine the nearest actual colliding obstacle.
// Since all moving bodies know their occupied tiles, this should serve as
// an okay first pass using a hash method.
// PHASE 4 B -- PHASE 4B -- PHASE 4-B -- PHASE4B
// n2 comparison (see previous comment)
var getWorldwideMoverCollisions = function() {
	//Every moving body sweeps out a region of the world.
	//We can safely overestimate this region as a single rectange
	//from the lowest to highest coordinate of the body in each dimension.
	//If no other body is in this rectangle, the body definitely
	//does not collide with anything -- if these rectangles overlap,
	//a little further calculation is needed to know if a collision occurs.

	var bodies = World.bodies;

	var min = function(a, b) { return a <= b ? a : b };
	var max = function(a, b) { return a >= b ? a : b };
	var getVelocity = function(x) { return x.velocity };

	var sweepRectanglesOverlap = function(sweepA, sweepB) {
		var aMin = sweepA.rectangle[0];
		var aMax = sweepA.rectangle[1];
		var bMin = sweepB.rectangle[0];
		var bMax = sweepB.rectangle[1];

		return (
			aMin.x < bMax.x && 
			aMin.y < bMax.y &&
			aMax.x > bMin.x && 
			aMax.y > bMin.y
		);
	};

	var sweeps = {};
	var collisions = {};

	// Possible revision: instead of using pos + vel, constrain
	// the movement by terrain and use a startPos and endPos passed by
	// such a constraint.

	for (var i = 0; i < bodies.length; i++) {
		var body = bodies[i];
		var id = body.id;
		if (body.terrain) {
			continue;
		}

		var pos = body.position;
		var vel = getVelocity(body);
		var loCoords = {
			dtype: 'position'
			,x: min(pos.x, pos.x + vel.x) - body.halfWidth
			,y: min(pos.y, pos.y + vel.y) - body.halfHeight
		};
		var hiCoords = {
			dtype: 'position'
			,x: max(pos.x, pos.x + vel.x) + body.halfWidth
			,y: max(pos.y, pos.y + vel.y) + body.halfHeight
		}

		var thisSweep = {
			dtype: 'bodySweep'
			,body: body
			,rectangle: [loCoords, hiCoords]
		};

		sweeps[id] = thisSweep;

		// Here is the n2 part where we compare against
		// all the others
		for (var i2 = 0; i2 < i; i2++) {
			var id2 = bodies[i2].id;
			if (!bodies[i2].terrain && sweepRectanglesOverlap(thisSweep, sweeps[id2])) {
				collisions[id] = collisions[id] || [];
				collisions[id2] = collisions[id2] || [];
				collisions[id].push(id2);
				collisions[id2].push(id);
			}
		}
	}

	// TODO: this is where we should fine-tune our actual sweeps
	// to avoid incorrect collisions in the case of e.g. the six-sided
	// sweeps for any AABB moving in both X and Y, right now the detection
	// is only correct for bodies moving cardinally
	return collisions;
}

var getFirstImpacts = function (collisions) {
	var firstImpacts = {};

	for (var i = 0; i < World.bodies.length; i++) {
		var body = World.bodies[i];
		if (body.terrain) {
			continue;
		}
		var id = body.id;
		var colliders = collisions[id];
		if (!colliders || colliders.length == 0) {
			continue;
		}

		var minSubtick = 1.01;
		var firstImpact = undefined;
		for (var i2 = 0; i2 < colliders.length; i2++) {
			impact = getImpact([id, colliders[i2]]);
			if (impact.subtick < minSubtick) {
				minSubtick = impact.subtick;
				firstImpact = impact;
			}
		}

		firstImpacts[id] = firstImpact;
	}

	return firstImpacts;
}

var getImpact = function (colliderIdPair) {
	var axisX = false;
	var axisY = false;
	var subtick = 0;

	// the axis of impact is the axis in which the bodies did NOT
	// already overlap at the start; this method extends to 3D

	// two spans do not overlap iff one span's min is above the
	// other span's max

	console.log("!!!");
	console.log(colliderIdPair);

	var bodyA = World.idBodyMap[colliderIdPair[0]];
	var bodyB = World.idBodyMap[colliderIdPair[1]];

	var gapX = bodyA.position.x > bodyB.position.x ? 
		(bodyA.position.x - bodyA.halfWidth) - (bodyB.position.x + bodyB.halfWidth)
		: (bodyB.position.x - bodyB.halfWidth) - (bodyA.position.x + bodyA.halfWidth);

	var gapY = bodyA.position.y > bodyB.position.y ? 
		(bodyA.position.y - bodyA.halfHeight) - (bodyB.position.y + bodyB.halfHeight)
		: (bodyB.position.y - bodyB.halfHeight) - (bodyA.position.y + bodyA.halfHeight);

	axisX = (gapX > 0);
	axisY = (gapY > 0);

	if (axisX) {
		subtick = gapX / Math.abs(bodyA.velocity.x - bodyB.velocity.x);
	} else {
		subtick = gapY / Math.abs(bodyA.velocity.y - bodyB.velocity.y);
	}

	var impact = {
		dtype: 'impact',
		axisX: axisX,
		axisY: axisY,
		subtick: subtick
	};

	console.log("Impact: ");
	console.log(impact);
	return impact;
}

// var getBodyCollideArrivalX = function (body, colliderIds) {
// 	if (colliderIds.length == 0) {
// 		console.log("ERROR: Entered getBodyCollideArrivalX with no colliders");
// 		return NaN;
// 	}
// 	// var xMovingSign = (body.velocity.x >= 0 ? 1 : -1);

// 	// lazy version: assume only one actual collideBody, replace aribtrarily
// 	// if there are several
// 	var collider = World.bodies[colliderIds[0]];
// 	// var blockingX = collider.position.x - collider.halfWidth * xMovingSign;
// 	// var blockedBodyX = blockingX - body.halfWidth * xMovingSign;

// 	return body.position.x + getImpact([body.id, colliderIds[0]]).subtick * body.velocity.x;
// };

// var getBodyCollideArrivalY = function (body, colliderIds) {
// 	if (colliderIds.length == 0) {
// 		console.log("ERROR: Entered getBodyCollideArrivalY with no colliders");
// 		return NaN;
// 	}
// 	var yMovingSign = (body.velocity.y >= 0 ? 1 : -1)

// 	// lazy version: assume only one actual collideBody, replace aribtrarily
// 	// if there are several
// 	var collider = World.bodies[colliderIds[0]];
// 	// var blockingY = collider.position.y - collider.halfHeight * yMovingSign;
// 	// var blockedBodyY = blockingY - body.halfHeight * yMovingSign;

// 	// return blockedBodyY;
// 	return body.position.y + getImpact([body.id, colliderIds[0]]).subtick * body.velocity.y;
// };

// PHASE 5
// The actual movement of the body is the minimum between the intended
// movement (by velocity) and the distance to the obstacle. Therefor
// this is a Continuous method and shouldn't have illegal teleportation at
// any speed, while informing colliders of all required information to
// prevent or react to collision.

var getBlockingXForTerrainLocation = function (body, location) {
	if (body.velocity.x > 0) {
		return World.xPerTile * location.i - 0.005;
	} else {
		return World.xPerTile * (location.i + 1) + 0.005;
	}
};

var getBlockingYForTerrainLocation = function (body, location) {
	if (body.velocity.y > 0) {
		return World.yPerTile * location.j - 0.005;
	} else {
		return World.yPerTile * (location.j + 1) + 0.005;
	}
};


var Energy = {
	// # Energy.matchedEclipsedSpend
	matchedEclipseSpend: function (source, target, amount, type) {
		if (type == 'impact-kinetic') {
			//amt will normally simply be half the amount, but if a body's
			//available energy is particularly low it will be reduced to the
			//actual energy which can be spent by both as a matched state.

			//Because the kE of a generic impact-kinetic collision has no
			//defined place it is being routed out to, we need to use enduring
			//and NOT bracing energy.
			
			//ONLY when a body is routing its energy somewhere specific
			//which will accept it, usually somewhere highly dissipating
			//e.g. the ground can it use the bracing esink for the transaction.

			var e1 = source.esinks.enduring.free
				+ source.esinks.integ.free;
			var e2 = source.esinks.enduring.free
				+ source.esinks.integ.free;

			var amt = amount / 2;
			if (e1 < amt) amt = e1;
			if (e2 < amt) amt = e2;

			//console.log("amt = " + amt);

			Energy.endure(source, amt);
			Energy.endure(target, amt);
			return 2 * amt;

		} else {
			console.log("unhandled matchedEclipsedSpend type " + type);
		}
	},
	// # Energy.damage
	damage: function (body, amount) {
		body.esinks.integ.free -= amount;
		if (World.verbose) console.log(body.name + " took " + amount + " damage.");
		if (body.esinks.integ.free < -0.005) {
			if (World.verbose) console.log(body.name + " is out of integ.");
		}
	},
	// # Energy.brace
	brace: function (body, amount) {
		// as a fixed buffer this doesn't fit well with our idea of bracing...
		// Rather, the action of bracing can be thought of as a routing of
		// power into increasing the apparent size of this buffer, spending
		// internal energy to handle energy received without allowing integ
		// to take the hit.
		body.esinks.bracing.free -= amount;

		if (body.esinks.bracing.free < -0.005) {
			// note: follow this pattern always and eveywhere
			// FIRSTLY record the illegal amount sent to the buffer
			// SECONDLY set the buffer to its legal value
			// LASTLY procede with handling the remainder
			var surplus = -body.esinks.bracing.free;
			body.esinks.bracing.free = 0;
			Energy.endure(body, surplus);
		}
	},
	// # Energy.endure
	endure: function (body, amount) {
		body.esinks.enduring.free -= amount;

		if (body.esinks.enduring.free < -0.005) {
			var surplus = -body.esinks.enduring.free;
			body.esinks.enduring.free = 0;
			Energy.damage(body, surplus);
		}
	},
	// # Energy.transfer
	transfer: function (source, target, amount, type) {
		if (type == 'movement-kinetic') {
			//movement-kinetic is akin to a completely inelastic collision.
			//The source object is stopped, so enough braking energy is felt
			//by it to halt it, which must be equal to its own incoming energy.
			
			//Ideally a heavy fast object should be able to destroy objects
			//in front of it and experience only the partial breaking
			//paid for by their destruction.
			//console.log("calling mES");
			return Energy.matchedEclipseSpend(source, target, amount, 'impact-kinetic');
		}
	},
	// # Energy.spend
	spend: function (source, type, amount) {
		//this function properly deducts energy from Free and returns
		//the amount deducted, performing any other Energy movements
		//required, but it will NOT transform energy into velocity
		//or other hidden forms. The calling function must do that with the
		//amount spent. Eventually, velocity will be an observational
		//phenomenon and only Energy will be a real stateful quantity.
		if (type == 'movement-kinetic') {
			var amt = amount;
			if (source.estores.move.free < amt) {
				amt = source.estores.move.free;
				source.estores.move.free = 0;
			} else {
				source.estores.move.free -= amt;
			}
			return amt;
		} else {
			console.log("Unhandled type to Energy.spend")
		}
	}
};

//MOVEMENT-RESTITUTING
//movement-restituting is akin to a completely elastic collision.
//The object must leave with all its own energy.

//The object seems like it 'provides' energy by its deformation to create
//additional force on itself, just like the impact object 'provides'
//energy for the normal force... but in a way which is essentially
//not state changing.

// var keep = source.coefficients['restitution'];
// var give = 1.0  - keep;

// Energy.eclipse(source, keep * amount, 'bounce-deformation') +
// Energy.transfer(source, target, give * amount, 'movement-kinetic')

var TerrainCache = {};
var getTerrainBlock = function (location) {
	var i = location.i;
	var j = location.j;
	if (TerrainCache[i + "_" + j] == undefined) {
		var block = createBody(
			'terrain' + i + "_" + j
			,{dtype: 'size', width: 16, height: 16}
			,{dtype: 'position', x: i * 16 + 8, y: j * 16 + 8}
			,{dtype: 'options', terrain: true, noRender: true}
		);
		block.mass = 10000;
		TerrainCache[i + "_" + j] = block;
	};
	return TerrainCache[i + "_" + j];
};


// function getKineticEnergyInX(body) {
// 	return body.velocity.x * body.velocity.x * body.mass;
// }

// function getKineticEnergyInY(body) {
// 	return body.velocity.y * body.velocity.y * body.mass;
// }

var collideX = function (body, terrainLocation) {
	// var vx = body.velocity.x;
	// var xSpeedSquared = vx * vx;
	// var kE = body.mass * xSpeedSquared;
	// var transfer = 'movement-kinetic';
	// var other = getTerrainBlock(terrainLocation);
	// Energy.transfer(body, other, kE, transfer);
	body.velocity.x = 0;
	body.blocked = true;
	// if (true) {
	// 	console.log(body.name + " has collided in X at kE = " + kE);
	// }
};

//TODO: how to best keep pose logic decoupled from movement logic...?

function hasPoseType(body, ptype) {
	if (ptype == 'aerial') {
		return (body.pose[0] == 'a' || body.pose[0] == 'j');
	} else if (ptype == 'ground') {
		return (body.pose[0] != 'a' && body.pose[0] != 'j');
	}
}

function setPose(body, pose) {
	body.pose = pose;
	if (body.poseSpriteCycles[pose]) {
		body.poseSpriteCycleFrames[pose] = 0;
		body.sprite = body.poseSpriteCycles[pose][0][body.isFacingRight];
	} else if (body.poseSprites[pose]) {
		body.sprite = body.poseSprites[pose][body.isFacingRight];
	}
}

function hasPose(body, pose) {
	return (body.poseSpriteCycles[pose] || body.poseSprites[pose]);
}

function forcePose(body, pose) {
	if (hasPose(body, pose)) {
		setPose(body, pose);
	} else {
		setPose(body, 'stand');
	}
}

var collideY = function (body, terrainLocation) {
	//function formally needs to know if this is a collision into a
	//gravitic-rest-collection, and if so, it is treated differently
	//as a direct energy donation via bracing with minimum transformation
	//to an accepting reciever of the original form.

	// var isFalling = (body.velocity.y > 0);
	// if (isFalling) {
	// 	body.grounded = true;
	// 	if (body.pose != undefined && hasPoseType(body, 'aerial')) {
	// 		//land is a special pose some robots have when coming out of jump
	// 		//if a robot has no land pose, it will go to stand pose instead
	// 		forcePose(body, 'land');
	// 	} else if (body.velocity.y <= World.Gravity * 1.05) {
	// 		//this is a body which isn't jumping and has a single
	// 		//gravitic impartation or less of downward force. Ignore
	// 		//the energy transfer (FOR NOW, eventually a body should
	// 		//be in continuous negotiation with gravitic support)
	// 		//and drain the velocity for free.
	// 		body.velocity.y = 0;
	// 		return;
	// 	}
	// }

	// var vy = body.velocity.y;
	// var ySpeedSquared = vy * vy;
	// var kE = body.mass * ySpeedSquared;

	// var transfer = 'movement-kinetic';
	// var other = getTerrainBlock(terrainLocation);
	// Energy.transfer(body, other, kE, transfer);
	body.velocity.y = 0;
}

var getBodyArrivalX = function (body) {
	// To avoid floating arithmetic problems in continuous calculation,
	// do NOT check the shorter distance and then advance by it;
	// instead advance to both endpoints, check the nearer result,
	// and set that location.

	//make sure to do this before calling firstTerrainObstacleForBodyInX
	

	var stepArriveX = body.position.x + body.velocity.x;
	var arriveX = stepArriveX;

	var terrainLocation = firstTerrainObstacleForBodyInX(body);
	if (terrainLocation == null) {
		console.log("WARNING: infinite free path in X");
		// debugger;
	} else {
		var blockingX = getBlockingXForTerrainLocation(body, terrainLocation);
		var xMovingSign = (body.velocity.x > 0 ? 1 : -1);

		// this is the body's Center location when it will be blocked
		var blockedBodyX = blockingX - body.halfWidth * xMovingSign;

		if ( (xMovingSign == 1 && blockedBodyX < arriveX) || 
			(xMovingSign == -1 && blockedBodyX > arriveX) ) {
			collideX(body, terrainLocation);
			arriveX = blockedBodyX;
		}
	}

	return arriveX;
};

//TODO: USE A MACRO FOR THIS (in dev)
var getBodyArrivalY = function (body) {
	// To avoid floating arithmetic problems in continuous calculation,
	// do NOT check the shorter distance and then advance by it;
	// instead advance to both endpoints, check the nearer result,
	// and set that location.

	var stepArriveY = body.position.y + body.velocity.y;
	var arriveY = stepArriveY;

	var terrainLocation = firstTerrainObstacleForBodyInY(body);
	if (terrainLocation == null) {
		console.log("WARNING: infinite free path in Y");
		// debugger;
	} else {
		var blockingY = getBlockingYForTerrainLocation(body, terrainLocation);
		var yMovingSign = (body.velocity.y > 0 ? 1 : -1);

		// this is the body's Center location when it will be blocked
		var blockedBodyY = blockingY - body.halfHeight * yMovingSign;

		if ( (yMovingSign == 1 && blockedBodyY < arriveY) || 
			(yMovingSign == -1 && blockedBodyY > arriveY) ) {
			collideY(body, terrainLocation);
			arriveY = blockedBodyY;
		}
	}

	return arriveY;
};

// PHASE 6
// Move the body to the actual position
var stepMoveBodyX = function (body, impact) {
	var arrivalX = getBodyArrivalX(body);
	if (impact) {
		arrivalX = body.position.x + body.velocity.x * impact.subtick;
	}
	body.position.x = arrivalX;
	return true;
};

var stepMoveBodyY = function (body, impact) {
	var arrivalY = getBodyArrivalY(body);
	if (impact) {
		arrivalY = body.position.y + body.velocity.y * impact.subtick;
	}
	body.position.y = arrivalY;
	return true;
};

var applyGravity = function (body) {
	if (!body.grounded && !body.terrain && !body.phasic) {
		body.velocity.y += World.Gravity;
	}
}

// var attemptVelocity = function (body, aspiredVel) {
// 	var hasX = (aspiredVel.x != undefined)
// 	var hasY = (aspiredVel.y != undefined)
// 	if (!hasX && !hasY) {
// 		console.log("Error: Bad velocity input to attemptVelocity.")
// 		return;
// 	}

// 	if (hasX) {
// 		//It's tricky to first determine how much enegy we're spending
// 		//and then add this energy properly as velocity. Instead,
// 		//try to set the velocity, and if we come up short on energy,
// 		//curtail the impartation accordingly.
// 		//This should be more numerically stable.

// 		var currentVel = {x: body.velocity.x};
// 		var currentE = getKineticEnergyInX(body);
// 		var targetE = body.mass * aspiredVel.x * aspiredVel.x;

// 		var neededE = Math.abs(targetE - currentE); //signed scalar
// 		// check for an attempt to reverse direction
// 		var signsMatch = ((currentVel.x >= 0) == (aspiredVel.x >= 0))
// 		if (!signsMatch) {
// 			neededE += currentE * 2;
// 		}

// 		var roundNeededE = Math.round(neededE);
// 		var spentE = Energy.spend(body, 'movement-kinetic', roundNeededE);
// 		if (spentE == roundNeededE) {
// 			// VELOCITY CHANGE
// 			body.velocity.x = aspiredVel.x;
// 		} else {
// 			//This linear correction formula isn't exactly right.
// 			//Need to fix it to actually give the right amount of velocity
// 			//on partial spends.
// 			var spendFactor = spentE / roundNeededE;
// 			var deltaX = aspiredVel.x - currentVel.x;
// 			// VELOCITY CHANGE
// 			body.velocity.x += deltaX * spendFactor;
// 		}
// 		//debugger;
// 	}

// 	// hasY NYI
// }

// Setup
// ideal: World.tiles = createTilesFromFile('stage.txt');

// A manual setup for now
// createTiles(40, 25);
// for (var i = 0; i < 40; i++) {
// 	World.tiles[24][i].terrain = true;
// }

// World.tiles[18][0].terrain = true;
// World.tiles[19][0].terrain = true;
// World.tiles[20][0].terrain = true;
// World.tiles[21][0].terrain = true;
// World.tiles[22][0].terrain = true;
// World.tiles[23][0].terrain = true;

// World.tiles[18][39].terrain = true;
// World.tiles[19][39].terrain = true;
// World.tiles[20][39].terrain = true;
// World.tiles[21][39].terrain = true;
// World.tiles[22][39].terrain = true;
// World.tiles[23][39].terrain = true;

// createTiles();

// var hero = createBody(
// 	'hero'
// 	,{dtype: 'size', width: 16, height: 32}
// 	,{dtype: 'position',
// 		x: 16 * 2,
// 		y: 16 * World.tileCount.j - 16 * 3}
// 	,{dtype: 'options', controllable: true, mass: 100}
// );

// // 1 pixel/tick == 11.25 ft/sec, 7.67 mph, 3.429 m/s
// hero.velocity.x = 1;

// see code for myRepeater in go.html