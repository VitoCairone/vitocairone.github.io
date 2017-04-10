var Painter = new function () {
  function animateSprites() {
    var sprites = document.getElementsByClassName("sprite");
    for (var i = 0; i < sprites.length; i++) {
      sprites[i].classList.remove('frame-1', 'frame-2', 'frame-3', 'frame-4');
      var frame = parseInt(sprites[i].getAttribute('frame'));
      frame = (frame + 1) % 5 || 1;
      sprites[i].classList.add('frame-' + frame);
      sprites[i].setAttribute('frame', frame);
    };
  }

  function animateResetTimerBar() {
    console.log('resetting');
    // document.getElementById('progress-bar-fill').style.width = "0%";
    document.getElementById('progress-bar-fill').classList.remove('bet-stage', 'match-stage');
    // document.getElementById('progress-bar-fill').classList.add('reset');
  }

  function animateBetTimerBar() {
    // this timeout ensure that at least 1 frame is rendered without
    // a -stage class, resetting the bar to 0. Prefer a cleaner solution
    // which can't fail race conditions. requestAnimationFrame appears
    // insufficient.
    window.setTimeout(function() {
      // document.getElementById('progress-bar-fill').classList.remove('reset');
      document.getElementById('progress-bar-fill').classList.add('bet-stage');
    }, 50)
  }

  function animateMatchTimerBar() {
    document.getElementById('progress-bar-fill').classList.add('match-stage');
  }

  function animateBet(pNum) {
    Magnetic.hiliteMagnetParticle(pNum);
  }

  function animateEndMatchStage() {
    for (var i = 1; i <= 8; i++) {
      Magnetic.transferMarkedParticles(i, 0);
    }
  }

  function animateFold(pNum) {
    Magnetic.contractParticles(pNum);
  }

  function animateForceBlast(pNum) {
    var el = document.getElementById('spellshot' + pNum);
    el.classList.add('inflight');
  }

  function showContestCards() {
    var contestNums = [];
    for (var i = 1; i <= 8; i++) {
      var player = game.players[i];
      if (!player.folded) {
        contestNums.push(i);
      }
    }
    showPersonalCardsFor(contestNums);
  }

  function showFlopCards() { revealElements([1,2,3]); }

  function showTurnCard() { revealElements([4]); }

  function showRiverCard() { revealElements([5]); }

  function faintSprite(pNum) {
    var el = document.getElementById('sprite' + pNum);
    el.classList.add('fainted');
    // el.classList.remove('wizard');
  }

  function reviveSprite(pNum) {
    var el = document.getElementById('sprite' + pNum);
    // el.classList.add('wizard');
    el.classList.remove('fainted');
  }
}