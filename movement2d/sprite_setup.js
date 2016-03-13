var MyCache = MyCache || {};
if (MyCache.textures == undefined) {
  MyCache.textures = {};
}

var _getTexture = function(imagePath) {
  var image = MyCache.textures[imagePath];
  if (image)
    return image;

  image = MyCache.textures[imagePath] = new Image();
  image.src = imagePath;

  return image;
};

var buildSymmetricSprite = function(spriteSheetStr, loPos, hiPos) {
  var loPos = Convert.coercePoint(loPos);
  var hiPos = Convert.coercePoint(hiPos);
  var swidth = hiPos.x - loPos.x - 1;
  var sheight = hiPos.y - loPos.y - 1;

  var texture = _getTexture(spriteSheetStr);
  var sprite = {
    texture: texture,
    sx: loPos.x + 1,
    sy: loPos.y + 1,
    xOffset: 0,
    yOffset: 0,
    swidth: swidth,
    sheight: sheight
  };
  return sprite;
}

var buildSpritePair = function(actor, loPos, hiPos) {
  var loPos = Convert.coercePoint(loPos);
  var hiPos = Convert.coercePoint(hiPos);
  var swidth = hiPos.x - loPos.x - 1;
  var sheight = hiPos.y - loPos.y - 1;

  var textureLeft = _getTexture(actor.spriteSheet);
  var textureRight = _getTexture(actor.spriteSheet.replace(".gif", "_right.gif"));

  var spriteLeft = {
    texture: textureLeft,
    sx: loPos.x + 1,
    sy: loPos.y + 1,
    xOffset: 0,
    yOffset: 0,
    swidth: swidth,
    sheight: sheight
  };

  var spriteRight = {
    texture: textureRight,
    sx: actor.spriteSheetWidth - hiPos.x,
    sy: loPos.y + 1,
    xOffset: 0,
    yOffset: 0,
    swidth: swidth,
    sheight: sheight
  };

  return [spriteLeft, spriteRight];
}


var setPoseSprites = function (actor, pose, loCornerPt, hiCornerPt) {
  if (hiCornerPt == undefined && loCornerPt.length == 2) {
      //unpack a single-argument pair
      hiCornerPt = loCornerPt[1];
      loCornerPt = loCornerPt[0];
  } else if (loCornerPt.length > 2) {
    console.log("ERROR: Invalid input to setPoseSprites.");
  }
  loCornerPt = Convert.coercePoint(loCornerPt);
  hiCornerPt = Convert.coercePoint(hiCornerPt);

  actor.poseSprites[pose] = buildSpritePair(actor, loCornerPt, hiCornerPt);
}

var setPoseSpriteCycle = function (actor, pose, cornerPtsArr) {
  var spriteCycle = [];
  for (var i = 0; i < cornerPtsArr.length; i++) {
    var coords = cornerPtsArr[i];
    if (coords.length != 2) {
      console.log("ERROR: Bad cornerPtsArr input to setPoseSpriteCycle.")
    }
    var loPos = Convert.coercePoint(coords[0]);
    var hiPos = Convert.coercePoint(coords[1]);
    spriteCycle.push(buildSpritePair(actor, loPos, hiPos));
  }

  actor.poseSpriteCycles[pose] = spriteCycle;
}

var getCornerPtArrFromGridlines = function (gridlines) {
  var xGridlines = gridlines.xGridlines;
  var yGridlines = gridlines.yGridlines;
  var nSprites = gridlines.xGridlines.length - 1;
  var cornerPairs = [];

  for (var i = 1; i <= nSprites; i++) {
    var loPos = {x: xGridlines[i-1], y: yGridlines[0]}
    var hiPos = {x: xGridlines[i], y: yGridlines[1]}
    cornerPairs.push([loPos, hiPos]);
  }

  return cornerPairs;
}