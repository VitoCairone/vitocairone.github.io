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

console.log("start game.js read");

var MT = new MersenneTwister();

var Game = new function () {

  var gameCounter = 0;
  var autoAdjustSize = 0.1;
  var skipStackCounter = 0;

  var clocks = {
    normal: {
      betStage: 3500,
      transitionPhase: 200,
      matchStage: 1500,
      spellLocking: 200,
      spellCasting: 2000,
      manaMove: 0,
      manaSpend: 0,
      spellFlight: 700, // note: projectile CSS animation runs in 700 ms
      showDamage: 500, // note: damage popup CSS animation runs in 500 ms
      autoRestartDelay: 5000
    },
    fast: {
      betStage: 350,
      transitionPhase: 20,
      matchStage: 150,
      spellLocking: 200,
      spellCasting: 750,
      manaMove: 0,
      manaSpend: 0,
      spellFlight: 700,
      showDamage: 500,
      autoRestartDelay: 5000
    },
    runhot: {
      betStage: 0,
      transitionPhase: 0,
      matchStage: 0,
      spellLocking: 0,
      spellCasting: 0,
      manaMove: 0,
      manaSpend: 0,
      spellFlight: 0,
      showDamage: 0,
      autoRestartDelay: 0
    }
  };

  var game = {
    elements: ["earth", "fire", "air", "water", "ice", "dark", "light"],
    pNums: [1, 2, 3, 4, 5, 6, 7, 8],
    players: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    cards: [],
    stage: -1,
    rounds: 0,
    captureTo: null,
    warpMotes: [],
    startMotes: 21,
    motesPerRound: 7,
    render: true,
    painter: null,
    clock: clocks.normal,
    newAllIns: [],
    sidePots: [],
    baseDamageMod: 5.5,
    inputPhase: null,
    teamOneWinRecord: [0, 0],
    disableP1bot: true
  };

  this.begin = function () {
    game.startTime = new Date().getTime();

    if (game.render) {
      Magnetic.begin();
    }
    gameLoop();
  };

  this.init = function () {
    for (var i = 0; i < 7; i++) {
      game.cards = game.cards.concat(game.elements);
    }
    game.cards = game.cards.concat(["void", "void", "gold"]);

    reset();
  };

  this.pressFold = function () {
    fold(1);
  }

  this.pressBet = function () {
    if (game.inputPhase == "bet") {
      bet(1);
    } else if (game.inputPhase == "match") {
      meet(1);
    }
  }

  this.pressSpellLock = function () {
    alert("spell-lock");
    // spellLock(1);
  };

  this.pressContinue = function () {
    startNewGame();
  };

  this.setPainter = function (painter) {
    game.painter = painter;
  };

  function advanceStage() {
    game.stage = (game.stage + 1) % 6
    if (game.stage == 0) {
      game.rounds += 1;
    }
    startStage();
  }

  function autoAdjustDamageMod() {
    var ROUNDS_TARGET = 22;
    gameCounter++;
    if (game.rounds > ROUNDS_TARGET) {
      game.baseDamageMod = Math.round(game.baseDamageMod * 100 * (1 + autoAdjustSize)) / 100;
    } else if (game.rounds < ROUNDS_TARGET) {
      game.baseDamageMod = Math.round(game.baseDamageMod * 100 * (1 - autoAdjustSize)) / 100;
    }
    autoAdjustSize *= 0.999;
    var t1 = game.teamOneWinRecord[0];
    var t2 = game.teamOneWinRecord[1];
    console.log("######################################");
    console.log("######################################");
    console.log("######################################");
    console.log("###### baseDamageMod set to " + game.baseDamageMod);
    console.log("###### team1 win record " + t1 + "-" + t2);
    console.log("###### bias: "  + Math.round(1000 * (t1 / (t1 + t2) - 0.5)) / 1000);
    console.log("#######################################");
  }

  function bet(pNum) {
    var player = game.players[pNum];

    if (player.betCount >= 7 || player.folded || player.allIn || player.motes.length == 0) {
      return 0;
    }

    var betSize = Math.floor(game.roundStartMana[pNum] / 7);

    if (betSize == 0) {
      betSize = 1;
    } else if (betSize > game.forceEndBetSize) {
      betSize = game.forceEndBetSize;
    }

    // seventh bet should be all-in
    if ((player.betCount + 1 >= 7) && (player.motes.length <= game.forceEndBetSize)) {
      betSize = player.motes.length;
    }

    if (betSize > player.motes.length) {
      // this DOES trigger, make sure to check this out later
      // alert("betSize is impossibly large at " + betSize + " vs " + player.motes.length);
      betSize = player.motes.length;
    }

    player.betCount += 1;
    player.wager += betSize;

    sendMotesToWarp(pNum, betSize);

    // console.log(player.name + " bets " + betSize + " with " +  player.motes.length + " remaining.")

    if (player.motes.length == 0) {
      // console.log("set " + pNum + " " + player.name + " all-in @bet.");
      setAllIn(pNum);
      player.betCount = 7;
      checkForCapture();
    }

    if (game.render) {
      var newWagerPercent = 100 * player.wager / game.roundStartMana[pNum];
      game.painter.animateBet(pNum, newWagerPercent, betSize);
    }

    return 1;
  }

  function botSpellCasting() {
    var winners = game.winners;
    winners.forEach(function (winnerIdx) {
      if (true || winnerIdx != 1) {
        spellCast(winnerIdx);
      }
    });
  }

  function canPlayerOneAct() {
    return (!game.players[1].allIn && !game.players[1].folded);
  }

  // check is the action of the 'middle button'
  // during bet phase; the one which becomes Meet.
  // once Bet is disabled.
  // Check means: no intent to bet more, okay to
  // proceed. So, check is NOT implicit behavior
  // of the fold button, which always fold.
  function check(pNum) {
    var player = game.players[pNum];

    if (player.allIn || player.folded) {
      return;
    }

    if (pNum == 1 && game.render) {
      game.painter.animateCheck();
    }

    game.players[pNum].checked = true;
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

  function checkForFaint(pNum) {
    var player = game.players[pNum];
    if (player.hp <= 0 && !player.ghost) {
      // console.log(player.name + " has fainted!");
      player.hp = 0;
      player.ghost = true;
      if (game.render) {
        game.painter.faintSprite(pNum);
      }
    }
  }

  function createSidePot(requirement, outstanding) {

    // console.log("running createSidePot for " + requirement + ", " + outstanding);

    if (requirement == 0) {
      alert("Error: requirement 0 in createSidePot");
      return;
    }
    if (outstanding == 0) {
      // a pot with outstanding 0 means two or more players
      // went all-in with exactly the same amount of mana.
      // The first side-pot handles their wager completely,
      // so don't create another
      // console.log("returning due to outstanding = 0");
      return;
    }
    var eligible = [];

    for (var i = 1; i <= 8; i++) {
      if (!game.players[i].folded && game.roundStartMana[i] >= requirement) {
        eligible.push(i);
      }
    }

    var amount = null;
    if (requirement == outstanding) {
      // this is the first sidePot being created within this stage
      amount = game.stageStartMana;
      amount += eligible.length * requirement;
    } else {
      amount = 0;
      amount += eligible.length * outstanding;
    }

    // at this point, all this bet mana has actually already been
    // pushed into the warp. So, we need to extract the motes which are
    // specific to this side pot from there.

    var transfer = game.warpMotes.slice(0, amount);
    game.warpMotes = game.warpMotes.slice(amount, Infinity);

    game.sidePots.push({
      eligible: eligible,
      motes: transfer
    });
  }

  function decideBets(pNum) {
    if (MT.random() > 0.3) {
      return Math.floor(MT.random() * 10) - 2;
    } else {
      return Math.floor(MT.random() * 7) - 2;
    }
  }

  function decidingPlayerCount() {
    var count = 0;
    for (var i = 1; i <= 8; i++) {
      if (!game.players[i].allIn && !game.players[i].folded) {
        count++;
      }
    }
    return count;
  }

  function detectWinCondition() {
    var teamOneAlive = false;
    var teamTwoAlive = false;

    for (var i = 1; i <= 4 && teamOneAlive == false; i++) {
      if (!game.players[i].ghost) {
        teamOneAlive = true;
      }
    }

    for (var i = 5; i <= 8 && teamTwoAlive == false; i++) {
      if (!game.players[i].ghost) {
        teamTwoAlive = true;
      }
    }

    if ( (!teamOneAlive) || (!teamTwoAlive) ) {
      var elapsed = new Date().getTime() - game.startTime;
      // var message = "game ended in " + (elapsed / (60 * 1000)) + " min";
      var message = "game ended in " + game.rounds + " rounds";
      console.log(message);

      if (teamOneAlive != teamTwoAlive) {
        game.teamOneWinRecord[teamOneAlive ? 0 : 1]++;
      } else {

        // there are never ties because of a problem of spellcasting
        // at present: spells are cast in strict serial order, and a ghost
        // cannot cast a spell; so when two players should mutually KO,
        // the second will be found a ghost and so will not cast at all,
        // or will cast Revive

        alert("tie!");
        game.teamOneRecord[0] += 0.5;
        game.teamOneRecord[1] += 0.5;
      }

      if (gamesPlayed() > 0 && gamesPlayed() % 300 == 0) {
        console.clear();
      }
      autoAdjustDamageMod();

      if (game.render) {
        game.painter.animateEnd(teamOneAlive, teamTwoAlive);
      }

      triggerByClock(startNewGame, game.clock.autoRestartDelay);

      return true;
    }

    return false;
  }

  function endBetStage() {
    for (var i = 1; i <= 8; i++) {
      var player = game.players[i];
      player.checked = false;
    }
    startTransitionPhase();
  }

  function endGame() {
    ;
  }

  // This function is TOO BIG, chop it up!!
  function endMatchStage() {

    game.inputPhase = null;

    if (game.render) {
      game.painter.animateResetTimerBar();
    }

    var players = game.players;
    var maxWager = game.maxWager;

    //at endMatchStage, all undecided players automatically meet
    for (var i = 1; i <= 8; i++) {
      var player = game.players[i];
      if (player.folded || player.allIn) {
        continue;
      }

      if (player.wager < maxWager && player.motes.length > 0) {
        meet(i);
      }
    }

    if (game.newAllIns.length > 0) {

      // for (var i = 0; i < game.newAllIns.length; i++) {
      //   console.log(game.newAllIns[i] + " round start mana " + game.roundStartMana[game.newAllIns[i]]);
      // }

      // turn newAllIns from this stage into sidePots
      // first, sort newAllIns by roundStartMana, DESCENDING
      game.newAllIns.sort(function (a, b) {
        return game.roundStartMana[b] - game.roundStartMana[a];
      });
      var previous = 0;
      var outstanding = null;
      var pNum = null;
      var amount = null;

      // for (var i = 0; i < game.newAllIns.length; i++) {
      //   console.log(game.newAllIns[i] + " round start mana " + game.roundStartMana[game.newAllIns[i]]);
      // }

      while (game.newAllIns.length > 0) {
        pNum = game.newAllIns.pop();
        amount = game.roundStartMana[pNum];
        outstanding = amount - previous;
        createSidePot(amount, outstanding);
        previous = amount;
      }
    }

    // console.log("Warp now has " + game.warpMotes.length);

    if (game.render) {
      game.painter.animateEndMatchStage();
    }

    checkForCapture();

    if (game.captureTo != null) {
      // console.log("Captured by " + game.players[game.captureTo].name);
      game.stage = 2; // cause advanceStage to go right to showdown
    }

    advanceStage();
  }

  function endSpellCasting() {
    if (detectWinCondition()) {
      endGame();
    } else {
      advanceStage();
    }
  }

  function endSpellLocking() {
    advanceStage();
  }

  function endTransitionPhase() {
    startMatchStage();
  }

  function findWinners(pot) {
    if (pot.eligible.length == 0) {
      alert("ERROR: no eligible players in findWinners");
      return [];
    }

    var pNum = null;
    var score = 0;
    var topScore = 0;
    var topScoreNums = [];

    for (var i = 0; i < pot.eligible.length; i++) {
      pNum = pot.eligible[i];

      // We still need to skip folded players here because
      // any side pot created by a newAllIn can include
      // other players who are not pushed all in on that round,
      // players who might fold in later rounds, before the showdown.
      if (game.players[pNum].folded) {
        continue;
      }

      score = game.players[pNum].gestaltRank;
      if (score > topScore) {
        topScore = score;
        topScoreNums = [pNum];
      } else if (score == topScore) {
        topScoreNums.push(pNum);
      }
    }

    if (topScore === 0) {
      alert("ERROR: all eligible players have folded in findWinners");
    }

    return topScoreNums;
  }

  function fold(pNum) {
    var player = game.players[pNum];

    if (player.folded || player.allIn) {
      return 0;
    }

    // cannot fold as the only player who is not already all-in
    if (decidingPlayerCount() == 1) {
      return 0;
    }

    if (player.wager >= game.maxWager && player.thisStageBet > 0) {
      alert("cannot fold as betting top better (NYI)");
      //returnUnmetWager(pNum);
      return 0;
    }

    player.folded = true;

    if (game.render) {
      game.painter.animateFold(pNum);
    }
    // console.log(player.name + " folds.")

    checkForCapture();

    return 1;
  }

  function gameLoop() {
    advanceStage();
  }

  function gamesPlayed() {
    return game.teamOneWinRecord[0] + game.teamOneWinRecord[1];
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

    if ("gold" in hashEls) {
      score += 1;
    }

    if ("void" in hashEls && hashEls["void"] == 2) {
      score += 1000000000;
    }

    return score;
  }

  function getCommonCards() {
    return game.cards.slice(16, 21);
  }

  function getPlayerCards(pNum) {
    var idx = pNum - 1;
    return [game.cards[idx * 2], game.cards[idx * 2 + 1]];
  }

  function getPlayerStat(player, stat) {
    return 0;
  }

  function meet(pNum) {
    var player = game.players[pNum];
    var diff = game.maxWager - player.wager;

    if (player.folded || player.allIn || diff == 0) {
      return 0;
    }

    var amount = diff;
    if (player.motes.length < amount) {
      amount = player.motes.length;
    }

    player.wager += amount;
    sendMotesToWarp(pNum, amount);

    if (game.render) {
      if (pNum == 1 && player.motes.length > 0) {
        // animateMeet draws the button change
        game.painter.animateMeet(pNum);
      }

      // animateBet draws the bet button overlay size change
      var newWagerPercent = 100 * player.wager / game.roundStartMana[pNum];
      game.painter.animateBet(pNum, newWagerPercent, amount);
    }

    if (player.motes.length == 0) {
      // setAllIn will render its own button state change
      setAllIn(pNum);
      checkForCapture();
    }

    return 1;
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

  function report(code, msg) {
    console.log(msg);
  }

  function reset() {

    game.stage = -1;
    game.rounds = 0;
    game.captureTo = null;
    game.warpMotes = [];
    game.newAllIns = [];
    game.sidePots = [];

    var names = [null, "Alan", "Betty", "Carl", "Diane", "Ed", "Felicia", "Gary", "Helen"]

    for (var i = 1; i <= 8; i++) {
      game.players[i] = {
        name: names[i],
        hp: 700,
        thisStageBet: 0,
        folded: false,
        allIn: false,
        ghost: false,
        motes: [],
        wager: 0
      }
      for (var j = 0; j < (game.startMotes - game.motesPerRound); j++) {
        game.players[i].motes.push(10); // 10 is just a placeholder value
      }
    }

  }

  function sendManaToWinners() {
    var winnings = [null, 0, 0, 0, 0, 0, 0, 0, 0];
    var pNum = null;
    var amount = 0;

    setGestaltRanks();

    // presuming it exists, push the final pot as another sidePot
    // so we don't need any special logic for it
    if (game.warpMotes.length > 0) {
      var eligible = [];
      for (var i = 1; i <= 8; i++) {
        if ((!game.players[i].folded) && (!game.players[i].allIn)) {
          eligible.push(i);
        }
      }
      game.sidePots.push({
        eligible: eligible,
        motes: game.warpMotes
      });
      game.warpMotes = [];
    }

    // this routine goes through every side pot, from newest first
    // -- not because it's important but just because push/pop alone is
    // simpler than adding shift/unshift --
    // and distributes motes to every winner of each side pot.
    // In the simplest case, when there is one pot and one winner, that
    // one pot was just added as the final (and only) side pot. All motes
    // are sent to the one winner, and there is no remainder. However,
    // if there are side pots and/or multiple winners, motes must be
    // distributed whole and undivided, in an unbiased way.

    while (game.sidePots.length > 0) {

      var sidePot = game.sidePots.pop();

      // console.log("sidePot = ");
      // console.log(sidePot);

      var winners = findWinners(sidePot);

      amount = Math.floor(sidePot.motes.length / winners.length);

      for (var i = 0; i < winners.length; i++) {
        pNum = winners[i];
        winnings[pNum] += amount;
        game.players[pNum].motes = game.players[pNum].motes.concat(sidePot.motes.slice(0, amount));
        sidePot.motes = sidePot.motes.slice(amount, Infinity);
      }

      if (sidePot.motes.length > 0) {
        shuffle(winners);
        while (sidePot.motes.length > 0) {
          var pNum = winners.pop();
          var mote = sidePot.motes.pop();
          game.players[pNum].motes.push(mote);
          winnings[pNum]++;
        }
      }

    }

    return winnings;
  }

  function sendMotesToWarp(pNum, amount) {
    if (amount == 0) {
      return;
    }

    var player = game.players[pNum];

    if (amount == 1) {
      // note that this is from the opposide side as a multiple move
      game.warpMotes.push(player.motes.pop());
      return;
    }

    var transfer = player.motes.slice(0, amount);
    player.motes = player.motes.slice(amount, Infinity)
    game.warpMotes = game.warpMotes.concat(transfer);
  }

  function setAllIn(pNum) {
    game.players[pNum].allIn = true;
    game.newAllIns.push(pNum);

    if (game.render) {
      game.painter.animateAllIn(pNum);
    }
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

  function shuffle (array) {
    //Fisher-Yates shuffle
    var i = 0
      , j = 0
      , temp = null;

    var k = 0;
    for (i = array.length - 1; i > 0; i -= 1) {
      j = Math.floor(MT.random() * (i + 1));
      temp = array[i]
      array[i] = array[j]
      array[j] = temp
    }

    // return a pointer to array for convenience
    // however, array is modified in-place
    return array;
  }

  function shuffleCards() {
    shuffle(game.cards);
  }

  function showdown() {

    var completeShowdown = function () {
      var winnings = sendManaToWinners();
      if (game.render) {
        game.painter.animateSendWinnings(winnings);
      }

      game.winners = [];
      for (var i = 1; i <= 8; i++) {
        if (winnings[i] > 0) {
          game.winners.push(i);
        }
      }
      shuffle(game.winners);

      triggerByClock(advanceStage, game.clock.spellLocking);
    }

    if (game.render) {
      // allow time to see the revealed personal cards,
      // and also for mana from final matches to be collected,
      // before distributing to winners
      window.setTimeout(completeShowdown, 1000);
    } else {
      completeShowdown()
    }
  }

  function spellCast(pNum) {
    var player = game.players[pNum];

    var targNum = pickTargetNum(pNum);
    var target = game.players[targNum];

    var moteSpend = 0;
    var spellName = null;

    var reviveCost = 100;

    if (player.ghost && player.motes.length >= reviveCost) {
      spellName = "Revive";
      // console.log(player.name + ' cast Revive.');
      // console.log(player.name + ' has revived with 500 hp.');
      moteSpend = reviveCost;
      player.hp = 500;
      player.ghost = false;
      if (game.render) {
        game.painter.reviveSprite(pNum);
      }
    } else if (player.ghost) {
      spellName = "Boo!";
      manaSpend = 0;
      // console.log(player.name + " cast Boo!")
    } else {
      spellName = "Force Blast";

      moteSpend = Math.ceil(player.motes.length / 3);
      if (teamOneBias(pNum)) {
        moteSpend = Math.ceil(player.motes.length * 2 / 3);
      }

      // First, destruct particles

      player.motes = player.motes.slice(moteSpend, player.motes.length);

      var thisSpellFlight = spellFlight.bind(null, pNum, targNum, spellName, moteSpend);
      if (game.render) {
        // wait until any manaSpend animation has finished for spellFlight
        game.painter.destructParticles(pNum, moteSpend);
        triggerByClock(thisSpellFlight, game.clock.manaSpend);
      } else {
        thisSpellFlight();
      }
    }
  }

  function spellFlight(pNum, targNum, spellName, moteSpend) {
    var thisSpellStrike = spellStrike.bind(null, pNum, targNum, spellName, moteSpend);
    if (game.render && spellName == "Force Blast") {
      game.painter.animateForceBlast(pNum, targNum);
      window.setTimeout(thisSpellStrike, game.clock.spellFlight);
    } else if (spellName == "Force Blast") {
      thisSpellStrike();
    }
  }

  function spellStrike(pNum, targNum, spellName, moteSpend) {

    var player = game.players[pNum];
    var target = game.players[targNum];

    var dam = game.baseDamageMod * moteSpend;

    if (target.ghost) {
      dam = 0;
    } else {
      var power = getPlayerStat(player, "power");
      var defence = getPlayerStat(target, "defence");
      if (target.folded) {
        defence += 49;
      }
      var statsMod = (100 + power) / (100 + defence);
      dam *= statsMod;
    }

    dam = Math.round(dam);

    target.hp -= dam;

    var thisCheckFaint = checkForFaint.bind(null, targNum);
    if (game.render) {
      game.painter.animateDamage(targNum, dam);
      triggerByClock(thisCheckFaint, game.clock.showDamage);
    } else {
      thisCheckFaint();
    }
  }

  function startBetStage() {

    // console.log("~ BET STAGE " + game.stage + " START ~");

    game.inputPhase = "bet";

    if (game.render) {
      game.painter.animateBetTimerBar();
      game.painter.resetMaxMarked();
      game.painter.showBetButton(game.players[1].allIn);
    }

    game.maxWager = 0;
    for (var i = 1; i <= 8; i++) {
      var player = game.players[i];
      player.checked = false;
      if (player.folded) {
        continue;
      }
      player.thisStageBet = 0;
      // player.betCount = 0;
    }

    var betByXFn = function (x) {
      return bet.bind(null, x);
    }

    var shuffleNums = [1, 2, 3, 4, 5, 6, 7, 8]
    shuffle(shuffleNums);
    shuffleNums = [0].concat(shuffleNums);

    for (var k = 1; k <= 8; k++) {
      i = shuffleNums[k];
      if (game.disableP1bot && i == 1) {
        continue;
      }

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
          if (game.clock.betStage > 0) {
            // note that betByXFn(i) is called immediately
            // and the returned function is passed to setTimeout
            window.setTimeout(betByXFn(i), Math.random() * game.clock.betStage * 0.9);
          } else {
            bet(i);
          }
        }
      }
    }
  }

  function startMatchStage() {

    game.inputPhase = "match";

    var players = game.players;

    var maxWager = 0;
    for (var i = 1; i <= 8; i++) {
      if (!players[i].folded && players[i].wager > maxWager) {
        maxWager = players[i].wager;
      }
    }
    game.maxWager = maxWager;

    if (game.render) {
      game.painter.animateMatchTimerBar();

      var matchAmountPercent = 100 * game.maxWager / game.roundStartMana[1];
      if (matchAmountPercent > 100) {
        matchAmountPercent = 100;
      }
      game.painter.showMatchButton(
        (game.players[1].wager == maxWager),
        game.players[1].allIn,
        matchAmountPercent
      );
    }

    triggerByClock(endMatchStage, game.clock.matchStage);
  }

  function startNewGame() {
    if (game.render) {
      game.painter.animateContinue();
    }
    reset();
    advanceStage();
  }

  function startRound() {
    if (game.render) {
      game.painter.updateHealthReadout(game.players);
    }
    // console.log('~~~ ROUND ' + game.rounds + ' START! ~~~');
    game.captureTo = null;
    game.sidePots = [];
    game.roundStartMana = [null, 0, 0, 0, 0, 0, 0, 0, 0];
    game.stageStartMana = 0;
    game.inputPhase = null;

    if (game.render) {
      game.painter.unhiliteAllParticles();
    }

    var topStack = 0;
    var secondStack = 0;

    for (var i = 1; i <= 8; i++) {
      var player = game.players[i];
      player.allIn = false;
      player.folded = false;
      player.betCount = 0;
      player.wager = 0;
      var gain = game.motesPerRound;
      // if (player.ghost) {
      //   gain = Math.ceil(gain * 4 / 7);
      // }
      if (player.motes.length >= 250) {
        ;
        // console.log("!! " + player.name + " has " + player.motes.length + " mana.")
        // gain = 0;
      }
      for (var j = 0; j < gain; j++) {
        player.motes.push(10);
      }

      if (player.motes.length >= topStack) {
        secondStack = topStack;
        topStack = player.motes.length;
      } else if (player.motes.length > secondStack) {
        secondStack = player.motes.length;
      }

      game.roundStartMana[i] = player.motes.length;

      if (game.render) {
        game.painter.animateGrantNewParticles(i, gain);
      }
    }

    game.forceEndWager = secondStack;
    game.forceEndBetSize = Math.ceil(game.forceEndWager / 7);

    // console.log("forceEndWager = " + game.forceEndWager);
    // console.log("forceEndBetSize = " + game.forceEndBetSize);

    if (game.forceEndBetSize == 0) {
      alert("Error: forceEnd = 0");
    }

    // console.log("roundStartMana: " + game.roundStartMana);
  }

  function startStage() {
    game.newAllIns.length = 0;
    game.stageStartMana = game.warpMotes.length;

    report("stage", "STARTING STAGE " + game.stage);

    switch (game.stage) {
      case 0:
        // flop
        startRound();
        if (game.render) {
          game.painter.hideAllCards();
        }
        shuffleCards();
        if (game.render) {
          game.painter.stageStartEnableButtons();
          game.painter.zeroBetOverlay();
          game.painter.showPersonalCardsFor([1], game.cards);
          game.painter.showFlopCards(game.cards);
        }
        startBetStage();
        triggerByClock(endBetStage, game.clock.betStage);
        break;
      case 1:
        // turn
        if (game.render) {
          if (canPlayerOneAct()) {
            game.painter.stageStartEnableButtons();
          }
          game.painter.showTurnCards(game.cards);
        }
        startBetStage();
        triggerByClock(endBetStage, game.clock.betStage);
        break;
      case 2:
        // river
        if (game.render) {
          if (canPlayerOneAct()) {
            game.painter.stageStartEnableButtons();
          }
          game.painter.showRiverCard(game.cards);
        }
        startBetStage();
        triggerByClock(endBetStage, game.clock.betStage);
        break;
      case 3:
        //showdown
        if (game.render) {
          // show the Turn and River again here, in case we
          // skipped forward in a captured round
          game.painter.showTurnCards(game.cards);
          game.painter.showRiverCard(game.cards);
          showContestCards();
        }

        showdown();
        break;
      case 4:
        startSpellLocking();
        triggerByClock(endSpellLocking, game.clock.spellLocking);
      break;
      case 5:
        startSpellCasting();
        triggerByClock(endSpellCasting, game.clock.spellCasting);
      break;
      default:
        alert("startStage encountered default");
    }
  }

  function startTransitionPhase() {
    game.inputPhase = "transition";

    if (game.render) {
      game.painter.animateTransitionPhase();
    }

    triggerByClock(endTransitionPhase, game.clock.transitionPhase)
  }

  function startSpellLocking() {
    ;
  }

  function startSpellCasting() {
    botSpellCasting();
  }

  function setGestaltRanks() {
    for (var i = 1; i <= 8; i++) {
      // skip folded players because they are never eligible,
      // even for side pots
      if (game.players[i].folded) {
        continue;
      }
      var player = game.players[i];
      var gestalt = getCommonCards().concat(getPlayerCards(i));
      var score = gestaltRank(gestalt);

      player.gestalt = gestalt;
      player.gestaltRank = score;

      var shortHand = [];
      for (var j = 0; j < gestalt.length; j++) {
        shortHand.push(gestalt[j].charAt(0).toUpperCase())
      }
      // console.log(player.name + ' has ' + shortHand.join('') + ' worth ' + score);
      // game.players[i].score = score;
    }
  }

  function teamOneBias(pNum) {
    return (pNum <= 4);
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
    var SKIP_STACK_LIMIT = 20;

    if (time > 0 || skipStackCounter > SKIP_STACK_LIMIT) {
      skipStackCounter = 0;
      // a setTimeout of 0 still waits for 1 stack execution frame
      window.setTimeout(callback, time);
    } else {
      skipStackCounter++;
      // this callback runs immedately, in the same execution frame
      callback();
    }
  }

}

Game.init();

console.log("finished game.js read");