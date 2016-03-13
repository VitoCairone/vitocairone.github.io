// An ACTOR is a type of body which also has and switches between POSES
// (each pose corresponding to a particular Sprite or SpriteCycle).

function createActor(specs) {
	var actor = createBody(
		specs.name
		,specs.size
		,specs.startPosition
		,specs.options
	);

	if (specs.spriteSheet) {
		if (!specs.spriteSheetWidth) {
			console.log("Error: spriteSheetWidth is required");
			return actor;
		}

		actor.poseSprites = {};
		actor.poseSpriteCycles = {};
		actor.poseSpriteCycleFrames = {};
		actor.isFacingRight = 1;

		actor.spriteSheet = specs.spriteSheet;
		actor.spriteSheetWidth = specs.spriteSheetWidth;

		var standardPoses = ['run', 'stand', 'jump', 'shoot'];
		var spriteCycleBoxes = specs.spriteCycleBoxes || {};
		var spriteBoxes = specs.spriteBoxes || {};
		for (var i = 0; i < standardPoses.length; i++) {
			var pose = standardPoses[i];
			if (spriteCycleBoxes[pose]) {
				setPoseSpriteCycle(actor, pose, spriteCycleBoxes[pose])
			} else if (spriteBoxes[pose]) {
				setPoseSprites(actor, pose, spriteBoxes[pose]);
			} else {
				; //console.log("Warning: " + actor.name + " has no " + pose + " sprite(s).")
			}
		}
	}

	actor.pose = 'stand';

	return actor;
}

//see example usage in scene.js