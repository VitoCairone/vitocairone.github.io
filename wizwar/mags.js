alert('running mags.js');

Magnetic = new function() {
  
  var SCREEN_WIDTH = window.innerWidth;
  var SCREEN_HEIGHT = window.innerHeight;

  // console.log('SCREEN_WIDTH is ' + SCREEN_WIDTH);
  // console.log('SCREEN_HEIGHT is ' + SCREEN_HEIGHT);
  
  var MAGNETS_AT_START = 8;
  var PARTICLES_PER_MAGNET = 28 - 7;
  var MAGNETIC_FORCE_THRESHOLD = 300;

  var canvas;
  var context;
  var particles = [];
  var magnets = [];

  var nextParticleId = 0;
  
  var mouseX = (window.innerWidth - SCREEN_WIDTH);
  var mouseY = (window.innerHeight - SCREEN_HEIGHT);
  var mouseIsDown = false;
  var mouseDownTime = 0;
  
  var skinIndex = 0;
  var skins = [
     { glowA: 'rgba(0,200,250,0.3)', glowB: 'rgba(0,200,250,0.0)', particleFill: '#ffffff', fadeFill: 'rgba(22,22,22,.6)', useFade: true },
     { glowA: 'rgba(230,0,0,0.3)', glowB: 'rgba(230,0,0,0.0)', particleFill: '#ffffff', fadeFill: 'rgba(22,22,22,.6)', useFade: true },
     { glowA: 'rgba(0,230,0,0.3)', glowB: 'rgba(0,230,0,0.0)', particleFill: 'rgba(0,230,0,0.7)', fadeFill: 'rgba(22,22,22,.6)', useFade: true },
     { glowA: 'rgba(0,0,0,0.3)', glowB: 'rgba(0,0,0,0.0)', particleFill: '#333333', fadeFill: 'rgba(255,255,255,.6)', useFade: true },
     { glowA: 'rgba(0,0,0,0.0)', glowB: 'rgba(0,0,0,0.0)', particleFill: '#333333', fadeFill: 'rgba(255,255,255,.2)', useFade: true },
     { glowA: 'rgba(230,230,230,0)', glowB: 'rgba(230,230,230,0.0)', particleFill: '#ffffff', fadeFill: '', useFade: false }
  ];
  
  this.init = function() {
    
    canvas = document.getElementById( 'world' );
    
    if (canvas && canvas.getContext) {
      context = canvas.getContext('2d');
      
      // Register event listeners
      // window.addEventListener('mousemove', documentMouseMoveHandler, false);
      // window.addEventListener('mousedown', documentMouseDownHandler, false);
      // window.addEventListener('mouseup', documentMouseUpHandler, false);
      // document.getElementById( 'prevSkin' ).addEventListener('click', previousSkinClickHandler, false);
      // document.getElementById( 'nextSkin' ).addEventListener('click', nextSkinClickHandler, false);
      //window.addEventListener('resize', windowResizeHandler, false);
      
      createMagnets();
      
      //windowResizeHandler();
      
      requestAnimationFrame( loop );
    }
  }

  this.contractParticles = function (magnetIdx) {
    magnets[magnetIdx].orbit = 5;
  }

  this.expandParticles = function (magnetIdx) {
    magnets[magnetIdx].orbit = 10;
  }

  this.hiliteMagnetParticle = function (magnetIdx) {
    var magnet = magnets[magnetIdx];
    var particleIdx = magnet.markedParticles;
    if (magnet.markedParticles == magnet.particles.length) {
      return;
    }
    magnet.markedParticles += 1;
    magnet.particles[particleIdx].innerColorStop = 'rgba(256,0,0,1.0)';
  }

  this.unhiliteAllParticles = function () {
    for (var i = 0; i < particles.length; i++) {
      particles[i].innerColorStop = 'rgba(0,0,256,1.0)';
    }
  }

  this.transferMarkedParticles = function (from, to) {
    var magnet = magnets[from];
    var magnetTo = magnets[to];
    for (var i = 0; i < magnet.markedParticles; i++) {
      var particle = magnet.particles.shift();
      magnetTo.particles.unshift(particle);
      particle.magnet = magnetTo;
    }
    magnet.markedParticles = 0;
  }

  this.distributeParticles = function (from, toList, counterSync) {
    if (toList.length < 1) {
      return;
    }

    // console.log('in distribPart');
    // console.log('toList: ' + JSON.stringify(toList));
    var magnet = magnets[from];
    var counter = counterSync;

    // console.log('length is now: ' + magnet.particles.length);
    while (magnet.particles.length > 0) {
      // console.log('running ' + i);
      var particle = magnet.particles.shift();
      var magnetTo = magnets[toList[counter]];
      counter = (counter + 1) % toList.length;
      magnetTo.particles.unshift(particle);
      particle.magnet = magnetTo;
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
    for (var i = 0; i < originalParticles.length; i++) {
      //console.log("in " + i + ' of' + originalParticles.length)
      if ( !(originalParticles[i].id in killParticleIds) ) {
        // console.log("pushing");
        particles.push(originalParticles[i]);
      } else {
        // ;console.log("DESTRUCTED");
      }
    }
  }

  function createMagnets() {
    var w = 393;
    var h = 262;
    
    // this will be magnets[0]
    createMagnet({x: w / 2, y: h / 2 + 30});
    magnets[0].orbit = 25;

    for (var i = 0; i < MAGNETS_AT_START; i++) {

      var position = {
        x: 35,
        y: 118 + 37 * (i % 4)
        // x: ( SCREEN_WIDTH - w ) * 0.5 + (Math.random() * w), 
        // y: ( SCREEN_HEIGHT - h ) * 0.5 + (Math.random() * h)
      };

      if (i > 3) {
        position.x = w - 35;
      }
      
      createMagnetAndParticles( position );
    }
  }
  
  function createMagnet( position ) {
    var m = new Magnet();
    m.position.x = position.x;
    m.position.y = position.y;
    
    magnets.push( m );
  }

  function createMagnetAndParticles( position ) {
    var m = new Magnet();
    m.position.x = position.x;
    m.position.y = position.y;
    
    magnets.push( m );
    
    createParticles( m.position, m, PARTICLES_PER_MAGNET );
  }
  

  function createParticles( position, magnet, count ) {
    if (position == null) {
      position = magnet.position;
    }
    for (var i = 0; i < count; i++) {
      var p = new Particle();
      p.id = nextParticleId++;
      p.position.x = position.x;
      p.position.y = position.y;
      p.shift.x = position.x;
      p.shift.y = position.y;
      //p.color = skins[skinIndex].particleFill;
      p.magnet = magnet;
      
      magnet.particles.push( p );
      particles.push( p );
    }


  }

  function loop() {
    
    context.clearRect(0,0,canvas.width,canvas.height);
    
    var particle, magnet;
    var i, j, ilen, jlen;
    
    // Render the magnets
    for( j = 0, jlen = magnets.length; j < jlen; j++ ) {
      magnet = magnets[j];
      
      // Increase the size of the magnet center point depending on # of connections
      // magnet.size += ( (magnet.connections/3) - magnet.size ) * 0.025;
      // magnet.size = Math.max(magnet.size,2);
      
      // var gradientFill = context.createRadialGradient(magnet.position.x,magnet.position.y,0,magnet.position.x,magnet.position.y,magnet.size*10);
      // gradientFill.addColorStop(0,skins[skinIndex].glowA);
      // gradientFill.addColorStop(1,skins[skinIndex].glowB);
      
      // context.beginPath();
      // context.fillStyle = gradientFill;
      // context.arc(magnet.position.x, magnet.position.y, magnet.size*10, 0, Math.PI*2, true);
      // context.fill();
      
      // context.beginPath();
      // context.fillStyle = '#00000000';
      // context.arc(magnet.position.x, magnet.position.y, magnet.size, 0, Math.PI*2, true);
      // context.fill();
      
      magnet.connections = 0;
    }
    
    // Render the particles
    for (i = 0, ilen = particles.length; i < ilen; i++) {
      particle = particles[i];
      
      var currentDistance = -1;
      var closestDistance = -1;
      var closestMagnet = null;
      var activeMagnet = null;
      
      var force = { x: 0, y: 0 };
      
      if (particle.magnet != null) {

        var fx = magnet.position.x - particle.position.x;
        // if( fx > -MAGNETIC_FORCE_THRESHOLD && fx < MAGNETIC_FORCE_THRESHOLD ) {
          force.x += fx / MAGNETIC_FORCE_THRESHOLD;
        // }
        
        var fy = magnet.position.y - particle.position.y;
        // if( fy > -MAGNETIC_FORCE_THRESHOLD && fy < MAGNETIC_FORCE_THRESHOLD ) {
          force.y += fy / MAGNETIC_FORCE_THRESHOLD;
        // }

      } else {
        console.log('CHECKING CLOSEST MAGNET');
        // For each particle, we check what the closes magnet is
        for( j = 0, jlen = magnets.length; j < jlen; j++ ) {
          magnet = magnets[j];
          
          currentDistance = distanceBetween( particle.position, magnet.position ) - ( magnet.orbit * 0.5 );
          
          if( particle.magnet != magnet ) {
            var fx = magnet.position.x - particle.position.x;
            if( fx > -MAGNETIC_FORCE_THRESHOLD && fx < MAGNETIC_FORCE_THRESHOLD ) {
              force.x += fx / MAGNETIC_FORCE_THRESHOLD;
            }
            
            var fy = magnet.position.y - particle.position.y;
            if( fy > -MAGNETIC_FORCE_THRESHOLD && fy < MAGNETIC_FORCE_THRESHOLD ) {
              force.y += fy / MAGNETIC_FORCE_THRESHOLD;
            }
            
          }
            
          if( closestMagnet == null || currentDistance < closestDistance ) {
            closestDistance = currentDistance;
            closestMagnet = magnet;
          }
        }
        
        if( particle.magnet == null || particle.magnet != closestMagnet ) {
          particle.magnet = closestMagnet;
        }
        
        closestMagnet.connections += 1;
      }
      
      // Rotation
      particle.angle += particle.speed;
      
      // Translate towards the magnet position
      particle.shift.x += (particle.magnet.position.x - particle.shift.x) * particle.speed;
      particle.shift.y += (particle.magnet.position.y - particle.shift.y) * particle.speed;
      
      // Appy the combined position including shift, angle and orbit
      particle.position.x = particle.shift.x + Math.cos(i+particle.angle) * (particle.orbit*particle.force);
      particle.position.y = particle.shift.y + Math.sin(i+particle.angle) * (particle.orbit*particle.force);
      
      // Limit to screen bounds
      particle.position.x = Math.max( Math.min( particle.position.x, SCREEN_WIDTH-particle.size/2 ), particle.size/2 );
      particle.position.y = Math.max( Math.min( particle.position.y, SCREEN_HEIGHT-particle.size/2 ), particle.size/2 );
      
      // Slowly inherit the cloest magnets orbit
      particle.orbit += ( particle.magnet.orbit - particle.orbit ) * 0.1;
      
      var glowRad = particle.size * 1.5;
      var gradientFill = context.createRadialGradient(particle.position.x,particle.position.y,0,particle.position.x,particle.position.y,glowRad);
      gradientFill.addColorStop(0, particle.innerColorStop);
      gradientFill.addColorStop(1, 'rgba(0,0,256,0.0)');
      
      context.beginPath();
      context.fillStyle = gradientFill;
      context.arc(particle.position.x, particle.position.y, glowRad, 0, Math.PI*2, true);
      context.fill();
      
      context.beginPath();
      context.fillStyle = '#ffffff';
      context.arc(particle.position.x, particle.position.y, particle.size/2, 0, Math.PI*2, true);
      context.fill();

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

    // need to make sure this doesn't cause memory leaks!
    requestAnimationFrame(loop);
  }
  
  function distanceBetween(p1,p2) {
    var dx = p2.x-p1.x;
    var dy = p2.y-p1.y;
    return Math.sqrt(dx*dx + dy*dy);
  }
  
};

function Particle() {
  this.size = 1.5 + Math.random()*3;
  this.position = { x: 0, y: 0 };
  this.shift = { x: 0, y: 0 };
  this.angle = 0;
  this.speed = 0.02 + 0.02 * Math.random() + this.size * 0.004;
  this.force = 1.5 + Math.random() * 1.5;
  this.color = '#ddddff';
  this.innerColorStop = 'rgba(256,256,256,1.0)';
  this.outerColor = '#7777ee';
  this.orbit = 1;
  this.magnet = null;
}

function Magnet() {
  this.orbit = 10;
  this.position = { x: 0, y: 0 };
  this.dragging = false;
  this.connections = 0;
  this.size = 1;
  this.particles = [];
  this.markedParticles = 0;
}


Magnetic.init();

alert("finished exec mags.js")
  
  