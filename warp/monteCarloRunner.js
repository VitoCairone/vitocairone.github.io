var cards = [];

var elements = ['earth', 'fire', 'air', 'water', 'ice', 'dark', 'light'];

var scoreOccurHash = {};
var scoreOccurTotal = 0;

for (var i = 0; i < 7; i++) {
  cards = cards.concat(elements);
}

cards = cards.concat(['void', 'void', 'gold']);

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

function shuffle () {
  //Fisher-Yates shuffle
  var i = 0
    , j = 0
    , temp = null;

  for (i = cards.length - 1; i > 0; i -= 1) {
    j = Math.floor(Math.random() * (i + 1))
    temp = cards[i]
    cards[i] = cards[j]
    cards[j] = temp
  }
}

function findTopScore() {
  var score = 0;
  var topScore = 0;
  for (var i = 1; i <= 8; i++) {
    var gestalt = cards.slice(0,5).concat([cards[i*2+4], cards[i*2+5]]);
    score = gestaltRank(gestalt);
    if (score > topScore) {
      topScore = score;
    }
  }
  return topScore;
}

function getVisibleScores(stage, tagVoid) {
  if (typeof tagVoid === 'undefined') {
    tagVoid = false;
  }

  var boardG = null;
  var combineSs = [null];
  var combineGs = [null];
  switch (stage) {
    case 0: boardG = cards.slice(0, 2); break;
    case 1: boardG = cards.slice(0, 4); break;
    case 2: boardG = cards.slice(0, 5); break;
  }
  var boardS = gestaltRank(boardG);
  if ((tagVoid && boardG.indexOf('void') >= 0) && boardS < 1000000) {
    boardS += 'v';
  }
  for (var i = 1; i <= 8; i++) {
    combineGs.push(boardG.concat([cards[i*2+4], cards[i*2+5]]));
    var combineS = gestaltRank(combineGs[i]);
    if ((tagVoid && combineGs[i].indexOf('void') >= 0) && combineS < 1000000) {
      combineS += 'v';
    }
    combineSs.push(combineS);
  }
  var result = [boardS, combineSs]
    
  return result;
}

function getWinners(topScore) {
  if (typeof topScore === 'undefined') {
    topScore = findTopScore();
  }
  var winners = [];
  for (var i = 1; i <= 8; i++) {
    var gestalt = cards.slice(0,5).concat([cards[i*2+4], cards[i*2+5]]);
    var score = gestaltRank(gestalt);
    if (score == topScore) {
      winners.push(i);
    }
  }
  return winners;
}

function printOutOdds() {
  var scores = Object.keys(scoreOccurHash);

  scores.sort(function (a, b) {
    return scoreOccurHash[b] - scoreOccurHash[a];
  });

  for (var i = 0; i < scores.length; i++) {
    freq = scoreOccurHash[scores[i]] / scoreOccurTotal;
    odds = 1.0 / freq;
    if (odds > 9.9) {
      odds = Math.floor(odds)
    } else {
      odds = Math.floor(odds * 10) / 10;
    }
    console.log(scores[i] + ': 1 in ' + odds);
  }
}

/*
100,000,000 runNoFoldWinner results, w/ builtin rand
Winning gestalts
Some quick notes:
  60% are Full House, Trips, or Two Pair
  4s about 1/8 = about 3 each game;
  Voids about 1/14 = about 1.5 each game;
  5s about 1/150 = about 1 in 7 games (1 hour);
  6s about 1/8000 = about 1 in 365 games (45 hours);
  7s about 1/2.7M = about 1 in 120,000 games (1.7 years);

#1
Full House
42 kinds
112: 1 in 3.1     to 0.32

#2
Trips
7 kinds
104: 1 in 5.8     to 0.49

#3
Two Pair
21 kinds
23: 1 in 9.4      to 0.60

#4
Fours
7 kinds
1003: 1 in 15     to 0.67

#5
Four and Pair     
42 kinds
1011: 1 in 20     to 0.72

#6
Trips two Pair
105 kinds
120: 1 in 22      to 0.76

#7
Trips +Spirit
7 kinds
105: 1 in 27      to 0.80

#8
Void over Pair
7 kinds
1000000023: 1 in 30

#9
Full House +Spirit
42 kinds
113: 1 in 34

#10
Two Pair +Spirit
21 kinds
24: 1 in 39

#11
Two Trips 
21 kinds
201: 1 in 39

#12
Three Pair
35 kinds
31: 1 in 44

#13
Void over Two Pair
21 kinds
1000000031: 1 in 80

#14
Void alone
1 kind
1000000015: 1 in 90

#15
Void over Trips
7 kinds
1000000112: 1 in 121

#16
Fours +Spirit
7 kinds
1004: 1 in 134

#17
Fives
7 kinds
10002: 1 in 179

#18
Pair +Spirit
7 kinds
16: 1 in 212

#19
Void over Pair +Spirit
7 kinds
1000000024: 1 in 261

#20
Void +Spirit
1 kind
1000000016: 1 in 380

#21
Fours and Trips
42 kinds
1100: 1 in 396

#22
Pair
7 kinds
15: 1 in 425

#23
Void over Full House
42 kinds
1000000120: 1 in 604

#24
Fours and Pair
42 kinds
1012: 1 in 666

#25
Three Pair +Spirit
35 kinds
32: 1 in 826

#26
Fives and Pair
42 kinds
10010: 1 in 958

#27
Two Trips +Spirit
21 kinds
202: 1 in 1,351

#28
Void over Fours
7 kinds
1000001011: 1 in 1,764

#29
Void over Trips +Spirit
7 kinds
1000000113: 1 in 1,952

#30
Void over Two Pair +Spirit
21 kinds
1000000032: 1 in 2,554

#31
Fives +Spirit
7 kinds
10003: 1 in 3,031

#32
Sixes
7 kinds
100001: 1 in 8,231

#33
Void over Fours +Spirit
1 kind
1000001012: 1 in 71,787

#34
Void over Fives
7 kinds
1000010010: 1 in 112,107

#35
Sixes +Spirit
7 kinds
100002: 1 in 332,225

#36
Sevens
7 kinds
1000000: 1 in 2,702,702

#37
Rainbow
1 kind
7: nearly impossible without folds
*/

function runNoFoldWinner() {
  var t = 1000;
  for (var i = 0; i < t; i++) {
    if (i > 0 && i % 10000 == 0) {
      console.log("Ran " + i);
    }
    shuffle();
    var score = findTopScore();
    if (score in scoreOccurHash) {
      scoreOccurHash[score]++;
    } else {
      scoreOccurHash[score] = 1;
    }
    scoreOccurTotal++;
  }

  printOutOdds();
};

function runNoFoldPrediction(stage) {
  if (typeof stage === 'undefined') {
    stage = 0;
  }
  var t = 10000000;
  var centi = Math.round(t/100);

  var partialsOccur = {};
  var partialsWins = {};
  for (var i = 0; i < t; i++) {
    if (i > 0 && i % centi == 0) {
      console.log("Ran " + i);
    }
    shuffle();
    // only stage 0 right now
    var visibleScores = getVisibleScores(stage, true);
    var boardS = visibleScores[0];
    var playerSs = visibleScores[1];
    var winners = getWinners();
    var wonArr = [null, false, false, false, false, false, false, false, false];
    for (var j = 0; j < winners.length; j++) {
      wonArr[winners[j]] = true;
    }
    for (var j = 1; j <= 8; j++) {
      var keyStr = playerSs[j] + "_" + boardS;
      if (keyStr in partialsOccur) {
        partialsOccur[keyStr] += 1;
      } else {
        partialsOccur[keyStr] = 1;
      }
      if (wonArr[j]) {
        if (keyStr in partialsWins) {
          partialsWins[keyStr] += 8 / winners.length;
        } else {
          partialsWins[keyStr] = 8 / winners.length;
        }
      } else {
        if (!(keyStr in partialsWins)) {
          partialsWins[keyStr] = 0;
        }
      }
    }
  }

  // done running, print out odds

  var keys = Object.keys(partialsWins);

  keys.sort(function (a, b) {
    return partialsWins[b]/partialsOccur[b] - partialsWins[a]/partialsOccur[a];
  });

  for (var i = 0; i < keys.length; i++) {
    var winning = partialsWins[keys[i]] / partialsOccur[keys[i]];
    console.log(keys[i] + ': ' + Math.round(winning * 100) / 100);
  }

  return;
}

function runNoFoldPredictionAllStages() {
  for (var stage = 0; stage < 3; stage++) {
    console.log("### STAGE " + stage);
    runNoFoldPrediction(stage);
  }
}

/*

runNoFoldPredictionAllStages

1,000,000 trial each results for all stages

### STAGE 0
1000000020_2v: 8
1000000013_2v: 8
1000000012_2v: 8
1000000013_3: 8
1000000020_10: 8
1000000013_3v: 8
1000000012_2: 8
1000_10: 7.49
102_3: 6.42
101_2: 5.65
101v_2v: 4.66
102_10: 3.76
20_2: 3.43
101_10: 3.37
101v_10: 2.6
1000000020_1000000010: 2.38
13v_3v: 1.87
13_3: 1.85
13v_3: 1.39
13v_2v: 1.34
20_10: 1.34
12v_2v: 1.33
12_2: 1.33
13_2: 1.14
12v_2: 1.04
1000000013_1000000010: 0.86
1000000012_1000000010: 0.8
5v_3: 0.63
4v_2: 0.57
5v_3v: 0.57
12v_10: 0.56
5_3: 0.48
5v_2: 0.47
13v_10: 0.44
4v_2v: 0.32
4_2: 0.28
5v_2v: 0.27
13_10: 0.25
12_10: 0.22
5_2: 0.19


### STAGE 1
1000000023_5v: 8
1000001010_1000: 8
1000000112_13v: 8
1000000111_101v: 8
1000001010_1000000020: 8
1000000015_4v: 8
1000000022_12: 8
1000000112_102: 8
1000000023_13: 8
1000001010_101v: 8
1000000014_4: 8
1000000022_4v: 8
1000000022_12v: 8
1000000015_5v: 8
1000000023_13v: 8
1000000015_5: 8
100000_1000: 8
1000000111_12v: 8
1000000030_12v: 8
1000000112_101v: 8
1000000030_20: 8
1000000023_12v: 8
10002_102: 8
1000000014_4v: 8
1000000111_101: 8
10001_101: 7.8
1000000112_1000000013: 7.73
1003_13: 7.73
1002_12: 7.69
10002_1000: 7.58
1010_20: 7.46
1000000111_1000000012: 7.18
1010_101: 6.95
200_20: 6.93
104_5: 6.41
1003_101: 5.97
103_4: 5.81
112_13: 5.8
10001_1000: 5.78
10001v_1000: 5.76
10001v_101v: 5.64
1003v_13v: 5.51
1000000112_1000000020: 5.5
1002v_12v: 5.48
111_12: 5.19
1000000030_1000000012: 5.09
104v_5v: 4.84
1003_102: 4.75
103v_4v: 4.56
1002_101: 4.48
1002v_101: 4.24
111v_12v: 4.14
1003v_102: 4.1
1000000111_1000000020: 3.86
1003v_101v: 3.78
112_20: 3.59
23v_5v: 3.51
1002v_101v: 3.34
104v_12v: 3.32
104_12: 3.3
23_5: 3.21
104_13: 3.07
104v_13: 2.86
104v_13v: 2.67
1000000023_1000000012: 2.37
103_12: 2.32
22v_4v: 2.23
22_4: 2.15
103v_12v: 2.07
200_101: 2.07
103v_12: 2.03
1000000023_1000000013: 2.02
111_20: 1.87
30_12: 1.57
111v_20: 1.57
1000000022_1000000012: 1.21
112_101: 1.2
1000000030_1000000020: 1.06
1010_1000: 1.02
23v_12v: 0.86
15v_5v: 0.81
15_5: 0.76
15v_4v: 0.74
23v_13v: 0.7
23_12: 0.65
1003_1000: 0.64
112_102: 0.6
23v_13: 0.59
15v_5: 0.57
23_13: 0.57
30_20: 0.54
111v_101: 0.51
15_4: 0.5
14v_4v: 0.49
14_4: 0.47
111_101: 0.43
14v_4: 0.4
22v_12v: 0.38
111v_101v: 0.37
22v_12: 0.34
104v_102: 0.32
1000000015_1000000013: 0.32
1000000023_1000000020: 0.31
22_12: 0.31
1000000015_1000000012: 0.28
1002_1000: 0.21
1002v_1000: 0.21
15v_13: 0.19
103v_101: 0.19
7v_5: 0.18
14v_12: 0.18
6v_4: 0.17
15v_12: 0.17
22v_20: 0.17
104v_101v: 0.17
7v_4: 0.16
104v_101: 0.15
104_101: 0.15
104_102: 0.14
23v_20: 0.11
1000000014_1000000012: 0.11
1000000022_1000000020: 0.09
103v_101v: 0.08
7v_5v: 0.08
15v_13v: 0.08
15v_12v: 0.06
7v_4v: 0.06
103_101: 0.06
15_13: 0.04
7_5: 0.03
15_12: 0.03
23_20: 0.02
14v_12v: 0.02
6v_4v: 0.01
7_4: 0.01
22_20: 0.01
14_12: 0.01
6_4: 0
1003v_1000: 0


### STAGE 2
1000000016_5v: 8
100002_1002: 8
1000001012_1000000022: 8
1000010010_1001v: 8
1000000_10000: 8
1000000113_102v: 8
1000000120_110: 8
1000000113_103: 8
1000001012_103v: 8
1000010010_1000000110: 8
100001_1001: 8
1000000023_13v: 8
1000000113_103v: 8
1000001011_1001: 8
1000000023_5v: 8
1000000032_22: 8
1000000032_14v: 8
1000001012_1001v: 8
1000001011_1001v: 8
1000000032_21v: 8
1000000024_14: 8
1000010010_10000: 8
1000001011_102v: 8
1000000015_5v: 8
1000000120_21v: 8
1000000113_14v: 8
1000000112_102: 8
1000000016_6v: 8
1000000024_13v: 8
1000000015_5: 8
1000000112_13v: 8
1000000024_6v: 8
1000000031_21: 8
1000000016_6: 8
1000000023_13: 8
1000000031_13v: 8
1000000120_102v: 8
1000000112_102v: 8
1000000031_21v: 8
1000000024_14v: 8
1000001011_1000000021: 7.95
10002_102: 7.92
10010_110: 7.89
1004_14: 7.86
1003_13: 7.86
10003_103: 7.79
1000000113_1000000014: 7.72
10010_1001: 7.65
1011_21: 7.59
1012_22: 7.56
10003_1001: 7.48
1012_103: 7.33
1100_110: 7.24
1000000112_1000000013: 7.09
202_22: 7
100001_10000: 6.92
1011_102: 6.92
201_21: 6.87
10003v_103v: 6.86
1000000120_1000000021: 6.82
105_6: 6.63
1012_110: 6.56
104_5: 6.3
1000000113_1000000021: 6.15
10003v_1001v: 6
1004_102: 5.94
1000000032_1000000014: 5.9
113_14: 5.88
10002v_102v: 5.6
10002v_1001: 5.58
1003v_13v: 5.51
1011v_21v: 5.39
1004v_14v: 5.38
100001v_1001v: 5.33
10002_1001: 5.22
1000001011_1000000110: 5.19
10003_1002: 5.13
1011v_102v: 5.13
112_13: 5.07
105v_6v: 4.91
120_21: 4.88
1004v_102v: 4.8
201v_21v: 4.78
113v_14v: 4.76
104v_5v: 4.57
10003v_1002: 4.53
1000000031_1000000013: 4.5
1000000113_1000000022: 4.39
1004_103: 4.38
1004v_103: 4.29
113v_21v: 4.2
1011_110: 4.15
1003v_102: 4.12
1011v_110: 4.1
1003_102: 4.05
112v_13v: 4.01
10002v_1001v: 3.57
113_21: 3.39
1004v_103v: 3.38
1000000112_1000000021: 3.17
1003v_102v: 3.01
24v_6v: 2.96
105_13: 2.94
105v_13v: 2.84
24_6: 2.82
105v_14: 2.6
1000000024_1000000013: 2.52
105_14: 2.52
1100_1001: 2.42
1012_1001: 2.34
105v_14v: 2.16
113_22: 2.01
113v_22: 2
10010_10000: 1.96
104v_13: 1.91
104_13: 1.91
23v_5v: 1.85
202_110: 1.67
104v_13v: 1.65
23_5: 1.64
201_102: 1.55
202_103: 1.49
1000000113_1000000110: 1.38
1000000120_1000000110: 1.33
120_102: 1.26
112v_21v: 1.25
1000000024_1000000014: 1.24
1012_1002: 1.23
10003_10000: 1.2
113v_102v: 1.2
112v_21: 1.14
112_21: 1.14
1011v_1001v: 1.04
1000000032_1000000022: 1
201v_102v: 0.96
113_102: 0.94
201v_110: 0.85
201_110: 0.85
1011v_1001: 0.83
1000000032_1000000021: 0.82
32_14: 0.8
1011_1001: 0.69
31_13: 0.52
31v_13v: 0.52
16v_5v: 0.49
113_103: 0.48
113v_103: 0.46
113v_103v: 0.42
24v_13v: 0.41
1000000023_1000000013: 0.39
1004v_1001v: 0.36
1000000031_1000000021: 0.33
16v_6v: 0.3
112v_102v: 0.28
24_13: 0.25
24v_14v: 0.2
112v_102: 0.2
1004v_1002: 0.2
112_102: 0.19
24_14: 0.13
120_110: 0.13
16v_6: 0.13
24v_14: 0.13
16_6: 0.12
10002_10000: 0.12
32_21: 0.12
1004_1002: 0.11
10002v_10000: 0.11
16_5: 0.1
105v_103v: 0.08
23v_13v: 0.08
1000000024_1000000021: 0.06
113_110: 0.06
1004_1001: 0.06
32_22: 0.05
15v_5v: 0.05
113v_110: 0.05
31v_21v: 0.04
23v_13: 0.03
23_13: 0.03
31v_21: 0.03
1003v_1001v: 0.03
31_21: 0.03
1000000024_1000000022: 0.02
15v_5: 0.01
1000000016_1000000013: 0.01
24v_21v: 0.01
15_5: 0.01
105v_102v: 0.01
1000000016_1000000014: 0.01
1003v_1001: 0
24_22: 0
112_110: 0
112v_110: 0
1003_1001: 0
105_103: 0
24v_22: 0
105_102: 0
105v_103: 0
23v_21v: 0
16v_14v: 0
1000000023_1000000021: 0
104v_102v: 0
16v_13v: 0
24_21: 0
16_14: 0
16v_14: 0
23_21: 0
104_102: 0
104v_102: 0
15v_13v: 0
23v_21: 0
8_5: 0
1004v_1001: 0
1000000015_1000000013: 0
105v_102: 0
16v_13: 0
8v_5: 0
16_13: 0
8v_6v: 0
7v_5: 0
7_5: 0
15v_13: 0
8_6: 0
15_13: 0
1000000112_1000000110: 0
24v_21: 0
8v_5v: 0
7v_5v: 0
8v_6: 0

*/

(function main() {
  runNoFoldPredictionAllStages();
})();