var SpellBook = {
  'Pew': {
    dtype: 'spell',
    requires: 'any',
    costFraction: 1 / 7,
    damageX: 1.0
  },
  'Force Blast': {
    dtype: 'spell',
    requires: 'any',
    costFraction: 1 / 3,
    damageX: 1.0,
  },
  'Power Blast': {
    dtype: 'spell',
    requires: 'any',
    costFraction: 2 / 3,
    damageX: 1.0
  },
  'Ultra Blast' {
    dtype: 'spell',
    requires: 'any',
    costFraction: 1,
    damageX: 1.0
  }
}

var SpellList = Object.keys(SpellBook);

// set keys as .name on each objects as well
for (var i = 0; i < SpellList.length; i++) {
  var spellName = SpellList[i];
  SpellBook[spellName].name = spellName;
}