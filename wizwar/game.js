// function broadcast(msg) {
//   console.log(msg);
//   alert(msg);
// }

// if (!window.requestAnimationFrame) {
//   broadcast('stubbing requestAnimationFrame');
//   window.requestAnimationFrame = function(fn) {
//       setTimeout(fn, 16.66);
//   }
// }

console.log('start game.js read');

var Game = new function () {

  var clocks = {
    normal: {
      betStage: 3500,
      matchStage: 1500,
      spellLocking: 2000,
      spellCasting: 2000
    },
    fast: {
      betStage: 350,
      matchStage: 150,
      spellLocking: 200,
      spellCasting: 200
    },
    runhot: {
      betStage: 0,
      matchStage: 0,
      spellLocking: 0,
      spellCasting: 0
    }
  }

  var game = {
    elements: ['earth', 'fire', 'air', 'water', 'ice', 'dark', 'light'],
    pNums: [1, 2, 3, 4, 5, 6, 7, 8],
    players: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    cards: [],
    stage: -1,
    rounds: 0,
    captureTo: null,
    warpMotes: [],
    returnMotes: [],
    motesPerRound: 7,
    render: false,
    painter: null,
    clock: clocks.fast
  };

  this.begin = function () {
    game.startTime = new Date().getTime();

    gameLoop();
  }

  this.pressFold = function () {
    fold(1);
  }

  this.pressBet = function () {
    bet(1);
  }

  this.pressSpellLock = function () {
    alert('spell-lock');
    // spellLock(1);
  }

  this.setPainter = function (painter) {
    game.render = true;
    game.painter = painter;
  }

  this.init = function () {
    for (var i = 0; i < 7; i++) {
      game.cards = game.cards.concat(game.elements);
    }
    game.cards = game.cards.concat(['void', 'void', 'gold']);

    var names = [null, 'Alan', 'Betty', 'Carl', 'Diane', 'Ed', 'Felicia', 'Gary', 'Helen']

    for (var i = 1; i <= 8; i++) {
      game.players[i] = {
        name: names[i],
        hp: 700,
        // mana: 1000,
        thisStageBet: 0,
        folded: false,
        allIn: false,
        ghost: false,
        motes: []
      }
      for (var j = 0; j < 28 - 7; j++) {
        game.players[i].motes.push(10);
      }
    }
  }

  function advanceStage() {
    // console.log('started advanceStage');
    game.stage = (game.stage + 1) % 6
    if (game.stage == 0) {
      game.rounds += 1;
    }
    startStage();
  }

  function bet(pNum) {  
    var player = game.players[pNum];

    if (player.betCount >= 7 || player.folded || player.allIn || player.motes.length == 0) {
      return 0;
    }

    player.betCount += 1;
    var mote = player.motes.pop();
    game.warpMotes.push(mote);

    if (game.render) {
      game.painter.animateBet(pNum);
    }
    console.log(player.name + " bets")

    if (player.motes.length == 0) {
      player.allIn = true;
      checkForCapture();
    }

    return 1;
  }

  function checkForCapture() {
    var players = game.players;
    var canAct = 0;
    var leaderIdx = 0;
    for (var i = 1; i <= 8 && canAct < 2; i++) {
      if (!players[i].folded && !players[i].allIn) {
        canAct += 1;
        leaderIdx = i;
      }
    }
    if (canAct == 1) {
      game.captureTo = leaderIdx;
    }
  }

  function decideBets(pNum) {
    // in this stub, pNum is actually unused
    return Math.floor(Math.random() * 9) - 2;
  }

  function endBetStage() { 
    startMatchStage();
  }

  function endMatchStage() {

    if (game.render) {
      game.painter.animateResetTimerBar();
    }

    var players = game.players;

    var maxBetCount = game.maxBetCount;

    //at endMatchStage, all undecided players automatically meet
    for (var i = 1; i <= 8; i++) {
      var player = game.players[i];
      if (player.folded || player.allIn) {
        continue;
      }

      if (player.betCount < maxBetCount) {
        if (player.betCount < maxBetCount && player.motes.length > 0) {
          meet(i);
        }
      }
    }

    console.log("Warp now has " + game.warpMotes.length);

    if (game.render) {
      game.painter.animateEndMatchStage();
    }

    checkForCapture();

    if (game.captureTo != null) {
      console.log("Captured by " + game.players[game.captureTo].name);
      game.stage = 3;
    }

    advanceStage();
  }

  function fold(pNum) {
    var player = game.players[pNum];

    if (player.folded || player.allIn) {
      return 0;
    }

    player.folded = true;

    if (game.render) {
      game.painter.animateFold(pNum);
    }
    console.log(player.name + ' folds.')

    checkForCapture();

    return 1;
  }

  function gameLoop() {
    // game.timeoutRefs = [];
    console.log ('started gameLoop')
    advanceStage();

    if (game.render) {
      window.setInterval(game.painter.animateSprites, 1000 / 3);
    }
  }

  function getPlayerCards(pNum) {
    var idx = pNum - 1;
    return [game.cards[idx * 2], game.cards[idx * 2 + 1]];
  }

  function getCommonCards() {
    return game.cards.slice(16, 21);
  }

  function hideAllCards() {
    // var cardEls = ['pers-element-1', 'pers-element-2', 'rev-element-1', 'rev-element-2', 'rev-element-3', 'rev-element-4', 'rev-element-5'];

    var orbClasses = [
      'light-orb',
      'dark-orb',
      'earth-orb',
      'fire-orb',
      'water-orb',
      'air-orb',
      'ice-orb',
      'void-orb',
      'gold-orb'
    ]

    var cardEls = document.getElementsByClassName("card-el");
    for (var i = 0; i < cardEls.length; i++) {
      var cardEl = cardEls[i];
      for (var j = 0; j < orbClasses.length; j++) {
        cardEl.classList.remove(orbClasses[j]);
      }
    }
  }

  function meet(pNum) {
    var player = game.players[pNum];
    var diff = game.maxBetCount - player.betCount;

    if (player.folded || player.allIn || diff == 0) {
      return 0;
    }

    while (diff > 0 && player.motes.length > 0) {
      player.betCount += 1;
      diff -= 1;
      var mote = player.motes.pop();
      game.warpMotes.push(mote);
      if (game.render) {
        game.painter.animateBet(pNum);
      }
    }

    console.log(player.name + " calls");

    if (player.motes.length == 0) {
      player.allIn = true;
      checkForCapture();
    }

    return 1;
  }

  function setMessage(msg) {
    document.getElementById("message-box").innerHTML = msg;
  }

  function shuffle (array) {
    //Fisher-Yates shuffle
    var i = 0
      , j = 0
      , temp = null;

    for (i = array.length - 1; i > 0; i -= 1) {
      j = Math.floor(Math.random() * (i + 1))
      temp = array[i]
      array[i] = array[j]
      array[j] = temp
    }
  }

  function shuffleCards() {
    shuffle(game.cards)
  }

  function startBetStage() { 

    if (game.render) {
      game.painter.animateBetTimerBar();
    }

    for (var i = 1; i <= 8; i++) {
      var player = game.players[i];
      if (player.folded) {
        continue;
      }
      player.thisStageBet = 0;
      player.betCount = 0;
    }

    // skip player 1; let interface control
    for (var i = 2; i <= 8; i++) {
      var player = game.players[i];
      if (player.folded || player.allIn) {
        continue;
      }
      var bets = decideBets(i);
      if (bets < 0) {
        if (game.stage == 0 || bets < -1) {
          fold(i);
        }
      } else if (bets > 0) {
        for (var j = 0; j < bets; j++) {
          bet(i);
        }
      }
    }
  }

  function startMatchStage() {  

    if (game.render) {
      game.painter.animateMatchTimerBar();
    }

    var players = game.players;

    var maxBetCount = 0;
    for (var i = 1; i <= 8; i++) {
      if (!players[i].folded && players[i].betCount > maxBetCount) {
        maxBetCount = players[i].betCount;
      }
    }
    game.maxBetCount = maxBetCount;

    // alert('completed startMatchStage');
    triggerByClock(endMatchStage, game.clock.matchStage);
  }

  function startRound() {
    updateHealthReadout();
    game.captureTo = null;

    if (game.render) {
      Magnetic.unhiliteAllParticles();
    }

    console.log('Round start!');

    for (var i = 1; i <= 8; i++) {
      var player = game.players[i];
      // player.startMana = player.mana;
      player.allIn = false;
      player.folded = false;
      // if (player.motes.length == 0) {
      //   console.log(player.name + " is OUT!")
      //   fold(i);
      // }

      var gain = game.motesPerRound;
      if (player.ghost) {
        gain = Math.ceil(gain * 4 / 7);
      }
      if (player.motes.length >= 250) {
        console.log("!! " + player.name + " has " + player.motes.length + " mana.")
        // gain = 0;
      }
      for (var j = 0; j < gain; j++) {
        player.motes.push(10);
      }

      if (game.render) {
        Magnetic.conjureParticles(i, gain);
        Magnetic.expandParticles(i);
      }
    }
  }

  function startStage() {
    // console.log("startStage " + game.stage);
    switch (game.stage) {
      case 0:
        // preflop 
        startRound();
        hideAllCards();
        shuffleCards();
        if (game.render) {
          game.painter.showPersonalCardsFor([1], game.cards);
        }
        startBetStage();
        triggerByClock(endBetStage, game.clock.betStage);
        break;
      case 1:
        // flop
        if (game.render) {
          game.painter.showFlopCards(game.cards);
        }
        startBetStage();
        triggerByClock(endBetStage, game.clock.betStage);
        break;
      case 2:
        // turn
        if (game.render) {
          game.painter.showTurnCard(game.cards);
        }
        startBetStage();
        triggerByClock(endBetStage, game.clock.betStage);
        break;
      case 3:
        // river
        if (game.render) {
          game.painter.showRiverCard(game.cards);
        }
        startBetStage();
        triggerByClock(endBetStage, game.clock.betStage);
        break;
      case 4:
        //showdown
        if (game.render) {
          showContestCards();
        }
        //showWinners();
        showdown();
        break;
      case 5:
        //casting
        spellLocking();
      break;
      default:
        alert('startStage encountered default');
    }
  }

  function totalMana() {
    var total = 0;
    var players = game.players;
    for (var i = 1; i <= 8; i++) {
      total += players[i].motes.length;
    }
    total += game.warpMotes.length;
    return total;
  }

  function triggerByClock(callback, time) {
    if (time >= 0) {
      window.setTimeout(callback, time);
    } else {
      callback();
    }
  }

  function updateHealthReadout() {
    var readout = "";

    for (var i = 1; i <= 4; i++) {
      var left = i;
      var right = 4 + i;
      var player = game.players[left];
      readout += player.name + ': ' + player.hp + '       ';
      player = game.players[right];
      readout += player.name + ': ' + player.hp;
      readout += '<br/>';
    }

    document.getElementById('healthReadout').innerHTML = readout;
  }

  function detectWinCondition() {
    var teamAlive = false;
    for (var i = 1; i <= 4 && teamAlive == false; i++) {
      if (!game.players[i].ghost) {
        teamAlive = true;
      }
    }

    if (teamAlive) {
      teamAlive = false;
      for (var i = 5; i <= 8 && teamAlive == false; i++) {
        if (!game.players[i].ghost) {
          teamAlive = true;
        }
      }
    }

    if (!teamAlive) {
      var elapsed = new Date().getTime() - game.startTime;
      // var message = 'game ended in ' + (elapsed / (60 * 1000)) + ' min';
      var message = 'game ended in ' + game.rounds + ' rounds';
      console.log(message);
      alert(message);
      return true;
    }

    return false;
  }

  function botSpellCasting() {
    var winners = game.winners;
    winners.forEach(function (winnerIdx) {
      if (winnerIdx != 1) {
        spellCast(winnerIdx);
      }
    });
  }

  function showContestCards() {
    var contestNums = [];
    for (var i = 1; i <= 8; i++) {
      var player = game.players[i];
      if (!player.folded) {
        contestNums.push(i);
      }
    }
    game.painter.showPersonalCardsFor(contestNums, game.cards);
  }

  function spellLocking() {
    var winners = game.winners;

    console.log("Total mana before casting = " + totalMana());

    if (winners.indexOf(1) > -1) {
      botSpellCasting();
      triggerByClock(timeoutSpellLock, game.clock.spellLocking)
    } else {
      botSpellCasting();
    }

    console.log("Total mana after casting = " + totalMana());

    updateHealthReadout();

    if (!detectWinCondition()) {
      triggerByClock(advanceStage, game.clock.spellLocking);
    }
  }

  function timeoutSpellLock() {
    return;
  }

  function findWinners() {
    var gestalt = [];
    var score = 0;
    var topScore = 0;
    var topScoreNums = [];
    for (var i = 1; i <= 8; i++) {
      if (game.players[i].folded) {
        continue;
      }
      var player = game.players[i];
      var gestalt = getCommonCards().concat(getPlayerCards(i));
      player.gestalt = gestalt;
      score = gestaltRank(gestalt);
      console.log(player.name + ' has ' + gestalt + ' worth ' + score);
      // game.players[i].score = score;

      if (score > topScore) {
        topScore = score;
        topScoreNums = [i];
      } else if (score == topScore) {
        topScoreNums.push(i);
      }
    }

    return topScoreNums;
  }

  function gestaltRank(gestalt) {
    var score = 0;
    var hashEls = {};
    var presentEls = [];

    for (var i = 0; i < gestalt.length; i++) {
      var el = gestalt[i];
      if (el in hashEls) {
        hashEls[el] += 1;
      } else {
        hashEls[el] = 1;
        presentEls.push(el);
      }
    }

    countsArr = [0, 0, 0, 0, 0, 0, 0, 0];
    for (var i = 0; i < presentEls.length; i++) {
      var el = presentEls[i];
      countsArr[hashEls[el]] += 1;
    }

    var pow10 = 1;
    for (var i = 1; i <= 7; i++) {
      var multiple = countsArr[i];
      score += multiple * pow10;
      pow10 *= 10;
    }

    if ('gold' in hashEls) {
      score += 1;
    }

    if ('void' in hashEls && hashEls['void'] == 2) {
      score += 1000000000;
    }

    return score;
  }

  function checkForFaint(pNum) {
    var player = game.players[pNum];
    if (player.hp <= 0 && !player.ghost) {
      console.log(player.name + ' has fainted!');
      player.hp = 0;
      player.ghost = true;
      if (game.render) {
        game.painter.faintSprite(pNum);
      }
    }
  }

  function pickTargetNum(pNum) {
    var targetPriorities = [
      null,
      [5, 6, 7, 8],
      [6, 5, 7, 8],
      [7, 8, 6, 5],
      [8, 7, 6, 5],
      [1, 2, 3, 4],
      [2, 1, 3, 4],
      [3, 4, 2, 1],
      [4, 3, 2, 1]
    ];

    var targets = targetPriorities[pNum];
    for (var i = 0; i < 4; i++) {
      if (!game.players[targets[i]].ghost) {
        return targets[i];
      }
    }

    // guess the game is over! just return normal target
    return targets[0];
  }



  function showdown() {

    console.log('showdown');

    var winners = findWinners();
    game.winners = winners;

    if (winners.length < 1) {
      console.log("ERROR: no winners");
      return;
    }

    var counterSync = Math.floor(Math.random() * winners.length);
    if (game.render) {
      Magnetic.distributeParticles(0, winners, counterSync);
    }

    // distribute motes evenly to winners
    var count = counterSync;
    while (game.warpMotes.length > 0) {
      var mote = game.warpMotes.pop();
      game.players[winners[count]].motes.push(mote);
      count = (count + 1) % winners.length;
    }

    triggerByClock(advanceStage, game.clock.spellLocking);
  }

  function spellCast(pNum) {
    var player = game.players[pNum];

    var targNum = pickTargetNum(pNum);
    var target = game.players[targNum];

    var moteSpend = 0;
    var spellName = null;

    var reviveCost = 100;
    var baseDamageMod = 7;

    if (player.ghost && player.motes.length >= reviveCost) {
      spellName = 'Revive';
      console.log(player.name + ' cast Revive.');
      console.log(player.name + ' has revived with 500 hp.');
      moteSpend = reviveCost;
      player.hp = 500;
      player.ghost = false;
      if (game.render) {
        game.painter.reviveSprite(pNum);
      }
    } else if (player.ghost) {
      spellName = 'Boo!';
      manaSpend = 0;
      console.log(player.name + ' cast Boo!')
    } else {
      spellName = 'Force Blast';
      moteSpend = Math.ceil(player.motes.length * 0.5);

      var dam = Math.ceil(baseDamageMod * moteSpend);
      if (target.ghost) {
        dam = 0;
      }
      target.hp -= dam;

      console.log(player.name + ' spent ' + moteSpend + ' mana to cast force blast on ' + target.name + ' for ' + dam + ' damage.');

      if (game.render) {
        game.painter.animateDamage(targNum, dam)
      }
      console.log(target.name + ' has ' + target.hp + ' health remaining.');

      checkForFaint(targNum);
    }

    if (game.render && spellName == 'Force Blast') {
      game.painter.animateForceBlast(pNum);
    }

    player.motes = player.motes.slice(moteSpend, player.motes.length);

    if (game.render) {
      Magnetic.destructParticles(pNum, moteSpend);
    }
  }
}

Game.init();

console.log('finished game.js read');