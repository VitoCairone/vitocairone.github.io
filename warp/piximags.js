console.log('running piximags.js');

Magnetic = new function() {

  // set on init
  var RENDER_WIDTH = 0;
  var RENDER_HEIGHT = 0;

  // unused ?
  var RIGHT_OFFSET_CONST = 38;

  // console.log('SCREEN_WIDTH is ' + SCREEN_WIDTH);
  // console.log('SCREEN_HEIGHT is ' + SCREEN_HEIGHT);
  
  var MAX_PARTICLES = 1000;
  var PARTICLES_PER_MAGNET = 21 - 7;
  var MAGNETIC_FORCE_THRESHOLD = 300;

  var LOW_ORBIT = 4;
  var NORMAL_ORBIT = 7;
  var HIGH_ORBIT = 11;

  // var canvas;
  // var context;
  var renderer;
  var stage;
  var particles = [];
  var magnets = [];
  var graphics = [];

  var maxMarkedParticles = 0;
  var freeParticleIds = [];
  
  this.init = function(renderer, stage) {
      
    this.renderer = renderer;
    RENDER_WIDTH = renderer.view.width;
    RENDER_HEIGHT = renderer.view.height;

    this.stage = stage;
    preCreateGraphics(MAX_PARTICLES);
    createMagnets();
      
    window.addEventListener('resize', windowResizeHandler, false);
    windowResizeHandler();
      
    requestAnimationFrame( loop );
  }

  this.contractParticles = function (magnetIdx) {
    magnets[magnetIdx].orbit = LOW_ORBIT;
  }

  this.expandParticles = function (magnetIdx) {
    magnets[magnetIdx].orbit = NORMAL_ORBIT;
  }

  this.hiliteMagnetParticle = function (magnetIdx) {
    var magnet = magnets[magnetIdx];
    var particleIdx = magnet.markedParticles;
    if (magnet.markedParticles == magnet.particles.length) {
      return;
    }
    magnet.markedParticles += 1;
    magnet.particles[particleIdx].betGlowFrames = 30;
    var id = magnet.particles[particleIdx].id;
    graphics[id].visible = false;
    graphics[id] = graphics[id].glowyVersion;
    graphics[id].visible = true;

    if (magnet.markedParticles > maxMarkedParticles) {
      maxMarkedParticles = magnet.markedParticles;
    }
  }

  this.hiliteMagnetParticles = function (magnetIdx, count) {
    // the laziest of hacks, git-r-done
    for (var i = 0; i < count; i++) {
      this.hiliteMagnetParticle(magnetIdx);
    }
  }

  this.unhiliteAllParticles = function () {
    for (var i = 0; i < magnets.length; i++) {
      magnets[i].markedParticles = 0;
    }
    for (var i = 0; i < particles.length; i++) {
      var id = particles[i].id;
      graphics[id].visible = false;
      graphics[id] = graphics[id].normalVersion;
      graphics[id].visible = true;
    }
    maxMarkedParticles = 0;
  }

  this.resetMaxMarked = function () {
    maxMarkedParticles = 0;
  }

  this.transferMarkedParticles = function (from, to, timeRange) {
    var magnet = magnets[from];
    var magnetTo = magnets[to];
    for (var i = 0; i < magnet.markedParticles; i++) {
      var particle = magnet.particles.shift();
      magnetTo.particles.unshift(particle);
      particle.magnet = magnetTo;
      if (typeof timeRange !== 'undefined') {
        var diff = timeRange[1] - timeRange[0];
        particle.timeToArrival = Math.round(timeRange[0] + Math.random() * diff);
      } else {
        particle.timeToArrival = Math.round(30 + Math.random() * 30);
      }
    }
    magnet.markedParticles = 0;
  }

  this.distributeParticles = function (winnings) {
    // amounts is going to be destructed in this function
    var amounts = winnings.concat([]);
    var from = 0;
    var magnet = magnets[from];

    console.log("amounts = " + amounts);
    console.log("potParticles = " + magnet.particles.length);
    // alert('paused');

    winner = 1;
    while (magnet.particles.length > 0) {
      while (amounts[winner] == 0) {
        winner++;
        if (winner > 8) {
          alert('error: winner exceeded range in distributeParticles');
          return;
        }
      }
      amounts[winner]--;
      var particle = magnet.particles.shift();
      var magnetTo = magnets[winner];
      magnetTo.particles.unshift(particle);
      particle.magnet = magnetTo;
      particle.timeToArrival = Math.round(30 + Math.random() * 30);
    }

    if (amounts[winner] != 0) {
      alert('error: did not meet send amount in distributeParticles');
      return;
    }

    // console.log('length is now: ' + magnet.particles.length);
  }

  this.conjureParticles = function (magnetIdx, count) {
    var magnet = magnets[magnetIdx];
    createParticles(null, magnet, count);
  }

  this.destructParticles = function (magnetIdx, count) {
    var magnet = magnets[magnetIdx];
    var killParticleIds = {};
    
    for (var i = 0; i < count; i++) {
      particle = magnet.particles.pop();
      killParticleIds[particle.id] = true;
    }

    // console.log(killParticleIds);

    var originalParticles = particles.concat([]);
    particles.length = 0;
    var id = null;
    for (var i = 0; i < originalParticles.length; i++) {
      //console.log("in " + i + ' of' + originalParticles.length)
      id = originalParticles[i].id
      if ( !(id in killParticleIds) ) {
        particles.push(originalParticles[i]);
      } else {
        graphics[id].visible = false;
        graphics[id] = graphics[id].normalVersion;
        freeParticleIds.push(id)
      }
    }
  }

  this.reset = function () {
    for (var i = 0; i < particles.length; i++) {
      graphics[particles[i].id].visible = false;
    }
    particles.length = 0;
    magnets.length = 0;
    maxMarkedParticles = 0;
    createMagnets();
    windowResizeHandler();
  }

  function createMagnets() {
    var w = RENDER_WIDTH;
    var h = RENDER_HEIGHT;
    
    // this will be magnets[0]
    createMagnet({x: w / 2, y: h / 2 + 30});

    magnets[0].orbit = 20;

    for (var i = 0; i < 8; i++) {

      var position = {
        // seems like x should vary by * 4,
        // the same as in row styles, not sure why * 9 works
        x: 15 + 28 - Math.floor(i / 2) * 9,
        y: 20 + 100 + 40 * (i % 4)
        // x: ( SCREEN_WIDTH - w ) * 0.5 + (Math.random() * w), 
        // y: ( SCREEN_HEIGHT - h ) * 0.5 + (Math.random() * h)
      };

      if (i > 3) {
        position.x = w - position.x;
      }
      
      createMagnetAndParticles( position );
    }

    // var centers = [
    //   [15, 20],
    //   [15, 40],
    //   [15, 60],
    //   [15, 80],
    //   [85, 20],
    //   [85, 40],
    //   [85, 60],
    //   [85, 80]
    // ]

    // for (var i = 0; i < 8; i++) {

    //   var position = {
    //     x: centers[i][0] / 100 * w,
    //     y: centers[i][1] / 100 * h
    //     // x: w * 0.15,
    //     // y: w * (0.15 + 0.2 * (i % 4)),
    //   };
      
    //   createMagnetAndParticles( position );
    // }
  }
  
  function createMagnet( position ) {
    var m = new Magnet();
    m.position.x = position.x;
    m.position.y = position.y;
    
    magnets.push( m );
  }

  function createMagnetAndParticles( position ) {
    console.log("creating magnet at " + JSON.stringify(position))
    var m = new Magnet();
    m.position.x = position.x;
    m.position.y = position.y;
    
    magnets.push( m );
    
    createParticles( m.position, m, PARTICLES_PER_MAGNET );
  }
  
  function generateTextures() {
    // use a canvas element to draw onto, then
    // create textures from these drawings
  }

  function preCreateGraphics(count) {
    if (typeof count === 'undefined') {
      count = 800;
    }

    for (var i = 0; i < count; i++) {
      var graphic = new PIXI.Graphics();

      // don't do this! use generateTextures()
      // maybe? performance on mobile with this method is fine actually

      graphic.beginFill(0xFFFFFF, 0.017);
      graphic.drawCircle(0, 0, 45);   //(x,y,radius)
      graphic.endFill();

      graphic.beginFill(0x9999FF, 0.025);
      graphic.drawCircle(0, 0, 20);   //(x,y,radius)
      graphic.endFill();

      graphic.beginFill(0x9977FF, 0.8);
      graphic.drawCircle(0, 0, 6);   //(x,y,radius)
      graphic.endFill();

      graphic.beginFill(0xFFFFFF, 1);
      graphic.drawCircle(0, 0, 3);   //(x,y,radius)
      graphic.endFill();

      graphic.visible = false;

      var redG = new PIXI.Graphics();

      redG.beginFill(0xFFFFFF, 0.017);
      redG.drawCircle(0, 0, 45);   //(x,y,radius)
      redG.endFill();

      redG.beginFill(0xFF9999, 0.025);
      redG.drawCircle(0, 0, 20);   //(x,y,radius)
      redG.endFill();

      redG.beginFill(0xFF7799, 0.8);
      redG.drawCircle(0, 0, 6);   //(x,y,radius)
      redG.endFill();

      redG.beginFill(0xFFFFFF, 1);
      redG.drawCircle(0, 0, 3);   //(x,y,radius)
      redG.endFill();

      redG.visible = false;

      var glowy = new PIXI.Graphics();

      glowy.beginFill(0xFFFFFF, 0.03);
      glowy.drawCircle(0, 0, 45);   //(x,y,radius)
      glowy.endFill();

      glowy.beginFill(0xFFFF99, 0.05);
      glowy.drawCircle(0, 0, 20);   //(x,y,radius)
      glowy.endFill();

      glowy.beginFill(0xFFFF77, 0.5);
      glowy.drawCircle(0, 0, 8);   //(x,y,radius)
      glowy.endFill();

      glowy.beginFill(0xFFFF77, 0.3);
      glowy.drawCircle(0, 0, 5);   //(x,y,radius)
      glowy.endFill();      

      glowy.beginFill(0xFFFFDD, 1);
      glowy.drawCircle(0, 0, 3);   //(x,y,radius)
      glowy.endFill();

      glowy.visible = false;

      graphic.normalVersion = graphic;
      graphic.redVersion = redG;
      graphic.glowyVersion = glowy;

      redG.normalVersion = graphic;
      redG.redVersion = redG;
      redG.glowyVersion = glowy;

      glowy.normalVersion = graphic;
      glowy.redVersion = redG;
      glowy.glowyVersion = glowy;

      // if (Math.random() < 0.7) {
      // } else if (Math.random() < 0.7) {
        // graphics.push(graphic.redVersion);
      // } else {
        // graphics.push(graphic.glowyVersion);
      // }

      this.stage.addChild(graphic);
      this.stage.addChild(redG);
      this.stage.addChild(glowy);

      graphics.push(graphic);
    }
  }

  function createParticles( position, magnet, count ) {
    if (position == null) {
      position = magnet.position;
    }
    for (var i = 0; i < count; i++) {
      var p = new Particle();

      if (freeParticleIds.length > 0) {
        p.id = freeParticleIds.pop();
      } else {
        p.id = particles.length;
      }
      console.log("created particle " + p.id);
      p.position.x = position.x;
      p.position.y = position.y;
      p.shift.x = position.x;
      p.shift.y = position.y;
      p.magnet = magnet;

      //console.log(p.id);
      var graphic = graphics[p.id];
      graphic.x = p.position.x;
      graphic.y = p.position.y;
      graphic.visible = true;
      
      magnet.particles.push( p );
      particles.push( p );
    }


  }

  function loop() {
    
    // context.clearRect(0,0,canvas.width,canvas.height);
    
    var particle, magnet;
    var i, j, ilen, jlen;
    
    // Render the magnets
    for( j = 0, jlen = magnets.length; j < jlen; j++ ) {
      magnet = magnets[j];
      
      // Render the particles
      for (i = 0, ilen = magnet.particles.length; i < ilen; i++) {
        particle = magnet.particles[i];
        
        var force = { x: 0, y: 0 };
        
        if (particle.magnet != null) {
          
          // magnet = particle.magnet;

          var fx = magnet.position.x - particle.position.x;
          // if( fx > -MAGNETIC_FORCE_THRESHOLD && fx < MAGNETIC_FORCE_THRESHOLD ) {
            force.x += fx / MAGNETIC_FORCE_THRESHOLD;
          // }
          
          var fy = magnet.position.y - particle.position.y;
          // if( fy > -MAGNETIC_FORCE_THRESHOLD && fy < MAGNETIC_FORCE_THRESHOLD ) {
            force.y += fy / MAGNETIC_FORCE_THRESHOLD;
          // }
        }

        var orbitPushTarget = 1;
        if (j == 0) {
          // who once where high shall now be low
          orbitPushTarget = 1.0 - (particle.force - 2.1) * 2;
        } else if (magnet.orbit > LOW_ORBIT && i < maxMarkedParticles) {
          // render a higher orbit for particles under the max wager, that is,
          // particles which must be spent to go on
          orbitPushTarget = HIGH_ORBIT / NORMAL_ORBIT;
        }
        if (particle.orbitPush != orbitPushTarget) {
          // assumes reasonably many FPS, like around 60
          particle.orbitPush = 0.95 * particle.orbitPush + 0.05 * orbitPushTarget;
        }
        var orbitPush = particle.orbitPush;

        // orbitVariance is applied after pull to the magnet's orbit,
        // so it then applies to that matched orbit
        orbitPush *= particle.orbitVariance;

        
        // Rotation
        particle.angle += particle.speed;

        // Translate towards the magnet position
        // particle.shift.x += (particle.magnet.position.x - particle.shift.x) * particle.speed;
        // particle.shift.y += (particle.magnet.position.y - particle.shift.y) * particle.speed;
        if (particle.timeToArrival >= 1) {
          particle.shift.x += (particle.magnet.position.x - particle.shift.x) * 1/particle.timeToArrival;
          particle.shift.y += (particle.magnet.position.y - particle.shift.y) * 1/particle.timeToArrival;
          particle.timeToArrival -= 1;
        } else {
          particle.shift.x = particle.magnet.position.x;
          particle.shift.y = particle.magnet.position.y;
        }
        
        // Appy the combined position including shift, angle and orbit
        particle.position.x = particle.shift.x + Math.cos(i+particle.angle) * (particle.orbit*particle.force*orbitPush);
        particle.position.y = particle.shift.y + Math.sin(i+particle.angle) * (particle.orbit*particle.force*orbitPush);
        
        // Limit to screen bounds
        particle.position.x = Math.max( Math.min( particle.position.x, RENDER_WIDTH-particle.size/2 ), particle.size/2 );
        particle.position.y = Math.max( Math.min( particle.position.y, RENDER_HEIGHT-particle.size/2 ), particle.size/2 );
        
        // Slowly inherit the closest magnets orbit
        particle.orbit += ( particle.magnet.orbit - particle.orbit ) * 0.1;

        if (particle.betGlowFrames != 0) {
          ;
          // var glowRad = particle.size * 3 + particle.betGlowFrames * 0.1;

          // var gradientFill = context.createRadialGradient(particle.position.x,particle.position.y,0,particle.position.x,particle.position.y,glowRad);
          // gradientFill.addColorStop(0, particle.innerColorStop);
          // gradientFill.addColorStop(1, 'rgba(230,230,0,0.0)');

          // context.beginPath();
          // context.fillStyle = gradientFill;
          // context.arc(particle.position.x, particle.position.y, glowRad, 0, Math.PI*2, true);
          // context.fill();
        
          // context.beginPath();
          // context.fillStyle = '#ffffff';
          // context.arc(particle.position.x, particle.position.y, particle.size/2, 0, Math.PI*2, true);
          // context.fill(); 

          if (particle.betGlowFrames > 0) {
            particle.betGlowFrames--;
            if (particle.betGlowFrames == 0) {
              particle.betGlowFrames = -30;
            }
          } else {
            particle.betGlowFrames++;
          }

        } else if (j > 0 && i > magnet.markedParticles && i < maxMarkedParticles) {
          ;
          // these are unmatched particles

          // var glowRad = particle.size * 2;
          // var gradientFill = context.createRadialGradient(particle.position.x,particle.position.y,0,particle.position.x,particle.position.y,glowRad);
          // gradientFill.addColorStop(0, particle.innerColorStop);
          // gradientFill.addColorStop(1, 'rgba(0,0,256,0.0)');
        
          // context.beginPath();
          // context.fillStyle = gradientFill;
          // context.arc(particle.position.x, particle.position.y, glowRad, 0, Math.PI*2, true);
          // context.fill();
        
          // context.beginPath();
          // context.fillStyle = '#ffffff'; //'#000000';
          // context.arc(particle.position.x, particle.position.y, particle.size/2, 0, Math.PI*2, true);
          // context.fill();

        } else {
          ;
          // var glowRad = particle.size * 1.5;
          // var gradientFill = context.createRadialGradient(particle.position.x,particle.position.y,0,particle.position.x,particle.position.y,glowRad);
          // gradientFill.addColorStop(0, particle.innerColorStop);
          // gradientFill.addColorStop(1, 'rgba(0,0,256,0.0)');
        
          // context.beginPath();
          // context.fillStyle = gradientFill;
          // context.arc(particle.position.x, particle.position.y, glowRad, 0, Math.PI*2, true);
          // context.fill();
        
          // context.beginPath();
          // context.fillStyle = '#ffffff';
          // context.arc(particle.position.x, particle.position.y, particle.size/2, 0, Math.PI*2, true);
          // context.fill();

        } // end betGlowFrames logic

        // console.log("update graphics for " + particle.id);
        graphics[particle.id].x = particle.position.x;
        graphics[particle.id].y = particle.position.y;

      } // end i loop (particles)

      // if (typeof particle.outerColor !== 'undefined') {
      //   context.beginPath();
      //   context.fillStyle = particle.outerColor;
      //   context.arc(particle.position.x, particle.position.y, particle.size/2 + 2, 0, Math.PI*2, true);
      //   context.fill();
      // }

      // context.beginPath();
      // context.fillStyle = particle.color;
      // context.arc(particle.position.x, particle.position.y, particle.size/2, 0, Math.PI*2, true);
      // context.fill();
    }

    // alert('rendering');
    this.renderer.render(this.stage);
    // alert('rendered');

    requestAnimationFrame(loop);
  }
  
  function distanceBetween(p1,p2) {
    var dx = p2.x-p1.x;
    var dy = p2.y-p1.y;
    return Math.sqrt(dx*dx + dy*dy);
  }

  function windowResizeHandler() {

    // resizing the canvas alone will not reposition the elements,
    // which are position absolutely in pixels from origin

    RENDER_WIDTH = window.innerWidth;

    this.renderer.resize(RENDER_WIDTH, 260);

    // SCREEN_WIDTH = window.innerWidth;
    ;
    // SCREEN_HEIGHT = 260; // window.innerHeight;
    
    // canvas.width = SCREEN_WIDTH;
    // canvas.height = SCREEN_HEIGHT;
    
    // canvas.style.position = 'absolute';

    var topFoeMagnet = magnets[5];
    var offsetDelta = (RENDER_WIDTH - RIGHT_OFFSET_CONST) - topFoeMagnet.position.x;

    magnets[0].position.x = RENDER_WIDTH / 2;

    for (var i = 5; i < magnets.length; i++) {
      var magnet = magnets[i];
      magnet.position.x += offsetDelta;
      for (var j = 0; j < magnet.particles.length; j++) {
        magnet.particles[j].shift.x += offsetDelta;
      }
    }
    
    // it seems like this will always be '0px'...
    // canvas.style.left = (window.innerWidth - SCREEN_WIDTH) * .5 + 'px';
    // canvas.style.top = (window.innerHeight - SCREEN_HEIGHT) * .5 + 'px';
  }
  
};

function Particle() {
  this.size = 1.5 + Math.random()*3;
  this.position = { x: 0, y: 0 };
  this.shift = { x: 0, y: 0 };
  this.angle = 0;
  this.speed = 0.015 + 0.05 * (Math.random() + Math.random()); // + this.size * 0.004;
  this.force = 2.1 + Math.random() * 0.2; // 1.5 + Math.random() * 1.5;
  this.color = '#ddddff';
  this.innerColorStop = 'rgba(256,256,256,1.0)';
  this.outerColor = '#7777ee';
  this.orbit = 0;
  this.magnet = null;
  this.betGlowFrames = 0;
  this.timeToArrival = 0;
  this.orbitPush = 1;
  this.orbitVariance = ((2 * 0.85) + Math.random() * 0.3 + Math.random() * 0.3) / 2;
}

function Magnet() {
  this.orbit = 7;
  this.position = { x: 0, y: 0 };
  this.dragging = false;
  this.size = 1;
  this.particles = [];
  this.markedParticles = 0;
}

console.log("finished exec mags.js")