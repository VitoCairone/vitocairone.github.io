var Painter = new function () {

  this.animateAllIn = function (pNum) {
    return;
  }

  this.animateDamage = function (pNum, amount) {
    var el = document.getElementById('damage-popup-' + pNum);
    el.innerHTML = amount;
    el.classList.add('reporting');
    window.setTimeout(function () {
      el.innerHTML = "";
      el.classList.remove('reporting');
    }, 500)
  }

  // this.animateSprites = function () {
  //   var sprites = document.getElementsByClassName("sprite");
  //   for (var i = 0; i < sprites.length; i++) {
  //     sprites[i].classList.remove('frame-1', 'frame-2', 'frame-3', 'frame-4');
  //     var frame = parseInt(sprites[i].getAttribute('frame'));
  //     frame = (frame + 1) % 5 || 1;
  //     sprites[i].classList.add('frame-' + frame);
  //     sprites[i].setAttribute('frame', frame);
  //   };
  // }

  this.animateResetTimerBar = function () {
    // console.log('resetting timer bar');
    // document.getElementById('progress-bar-fill').style.width = "0%";
    document.getElementById('progress-bar-fill').classList.remove('bet-stage', 'match-stage');
    // document.getElementById('progress-bar-fill').classList.add('reset');
  }

  this.animateBetTimerBar = function () {
    // this timeout ensure that at least 1 frame is rendered without
    // a -stage class, resetting the bar to 0. Prefer a cleaner solution
    // which can't fail race conditions. requestAnimationFrame appears
    // insufficient.
    window.setTimeout(function() {
      // document.getElementById('progress-bar-fill').classList.remove('reset');
      document.getElementById('progress-bar-fill').classList.add('bet-stage');
    }, 50)
  }

  this.animateMatchTimerBar = function () {
    document.getElementById('progress-bar-fill').classList.add('match-stage');
  }

  this.animateBet = function (pNum, betCount, betSize) {
    if (pNum == 1 && betCount > 0) {
      document.getElementById('bet-count-overlay').classList.add('count-' + betCount);
    }
    Magnetic.hiliteMagnetParticles(pNum, betSize);
  }

  this.animateEnd = function (teamOneWins, teamTwoWins) {
    var message = 'VICTORY!'
    if (teamOneWins && teamTwoWins) {
      message = 'TIED'
    } else if (teamTwoWins) {
      message = 'DEFEAT'
    }
    document.getElementById('end-game-report').innerHTML = message;
    document.getElementById('end-game-report-box').classList.add('show');
  }

  this.animateContinue = function () {
    document.getElementById('end-game-report-box').classList.remove('show'); 

    for (var i = 1; i <= 8; i++) {
      this.reviveSprite(i);
    }
    
    Magnetic.reset();
  }

  this.animateEndMatchStage = function () {
    for (var i = 1; i <= 8; i++) {
      Magnetic.transferMarkedParticles(i, 0);
    }
  }

  this.animateFold = function (pNum) {
    if (pNum == 1) {
      document.getElementById('defend-overlay').classList.add('defend');
    }
    Magnetic.contractParticles(pNum);
  }

  this.animateForceBlast = function (pNum, targNum) {
    var el = document.getElementById('spellshot' + pNum);
    el.classList.add('inflight');
    el.classList.add('target' + targNum);
  }

  this.showFlopCards = function (cards) { revealElements([1, 2], cards); }

  this.showTurnCards = function (cards) { revealElements([3, 4], cards); }

  this.showRiverCard = function (cards) { revealElements([5], cards); }

  this.faintSprite = function (pNum) {
    var el = document.getElementById('sprite' + pNum);
    el.classList.add('fainted');
  }

  this.reviveSprite = function (pNum) {
    var el = document.getElementById('sprite' + pNum);
    el.classList.remove('fainted');
  }

  this.showPersonalCardsFor = function (nums, cards) {
    for (var i = 0; i < nums.length; i++) {
      var n = nums[i];
      var id1 = n * 2 - 1;
      var id2 = n * 2;
      var slot1 = n * 2 - 2;
      var slot2 = n * 2 - 1;
      document.getElementById("player-element-" + id1).classList.add(cards[slot1] + '-orb');
      document.getElementById("player-element-" + id2).classList.add(cards[slot2] + '-orb');
    }
  }

  this.zeroBetOverlay = function () {
    document.getElementById('bet-count-overlay').className = "";
    document.getElementById('defend-overlay').className = "";
  }

  function revealElements(nums, cards) {
    console.log("Revealing " + nums);
    for (var i = 0; i < nums.length; i++) {
      var n = nums[i];
      var elId = 'rev-element-' + n;
      var elClass = cards[15+n] + '-orb';
      document.getElementById(elId).classList.add(elClass);
    }
  }
}

Game.setPainter(Painter);