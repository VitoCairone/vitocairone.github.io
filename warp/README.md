# warpstones

To run the game, just type `open index.html` in the terminal.

There is also a live (if obscure) version available at http://tinyurl.com/mkxxxba
This version runs off of github.io and is pushed at liberty, not automatically synced.
Last push to live was on Apr 26, 2016

CSS animations at this time target only recent versions of Chrome and are not yet implemented across browsers.

All animations and graphics are CSS except the mana, which is done in Pixi.js. It was previously

The mana animation is presently done in canvas, which has poor performance especially on mobile. WebGL should be used instead, likely via Pixi.JS, to provide good mobile performance. However, since pages served from the filesystem cannot access lower level browser features, it will be necessary to run a webserver when developing with Pixi.JS.

## game logic

### match logic

You control 1 of 8 characters, in this case a Mage. Your character is currently the one in the left-top-most position.

Players begin with 14 mana each and gain 7 mana each at the start of every round, including the first.

A round has five stages. The first 3 stages are each broken into a bet phase and a match phase.

In the first stage, 2 personal cards and 2 common cards are shown, and everyone is able to wager as much mana as they want for a fixed period of time, about 3.5 seconds. `currently limited to 7 per round, should change.` Then for the next 1.5 seconds, there can be no more increases, but everyone who is not folded or all-in and also not equal to the highest wager must decide to match the highest (or go all-in) to proceed, or else fold. 1.5 seconds are allowed to decide, and at the time limit players who made no input match and proceed by default.

In the second stage, 2 more common cards are shown. Wagering and matching proceeds as in the previous stage.

In the third stage, 1 final common card is shown. Wagering and matching proceeds as in the previous stage.

The fourth stage is the showdown. Personal cards are revealed for everyone still in the round, and the best hand of 7 cards (called a gestalt) wins. The best gestalt is the one with the largest group of the same kind, and ties are settled by applying the same rule to the remainder of the hand as much as necessary.

The deck is made of 52 cards: 7 each of 7 elements, plus 2 void and 1 gold (change this to spirit). A gestalt of 2 void beats all others.

The players who win the showdown are then able to cast a spell. Casting spells serves the ultimate goal of KOing opponents. The match is won when all players on the enemy team are KOd.

A player who is KOd continues to be able to wager and win mana as normal. However, they have a different set of spells. Any ghosts can cast Revive for a large amount of mana, returning them to their normal character.

(to be continued)
