// ============================================================
// 大鱼吃小鱼 - 配置
// 11 种鱼类：沙丁鱼→小丑鱼→神仙鱼→金鱼→锦鲤→金枪鱼→鲨鱼→鲸鱼→虎鲸→巨齿鲨→远古海兽
// ============================================================
(function (global) {
  'use strict';

  var SPECIES = [
    { id: 'sardine',    name: '沙丁鱼',   minSize: 4,  maxSize: 9,   color: '#90a4ae', accent: '#cfd8dc', bodyW: 1.35, bodyH: 0.42, tailW: 0.40, tailH: 0.55 },
    { id: 'clownfish',  name: '小丑鱼',   minSize: 10, maxSize: 15,  color: '#ff9100', accent: '#ffffff', bodyW: 1.10, bodyH: 0.75, tailW: 0.35, tailH: 0.45 },
    { id: 'angelfish',  name: '神仙鱼',   minSize: 16, maxSize: 22,  color: '#ffc107', accent: '#1a237e', bodyW: 0.75, bodyH: 1.25, tailW: 0.40, tailH: 0.80 },
    { id: 'goldfish',   name: '金鱼',     minSize: 23, maxSize: 30,  color: '#ff5722', accent: '#ffcc02', bodyW: 0.78, bodyH: 0.82, tailW: 0.85, tailH: 0.65 },
    { id: 'koi',        name: '锦鲤',     minSize: 31, maxSize: 40,  color: '#f44336', accent: '#ffffff', bodyW: 1.18, bodyH: 0.55, tailW: 0.55, tailH: 0.70 },
    { id: 'tuna',       name: '金枪鱼',   minSize: 41, maxSize: 55,  color: '#455a64', accent: '#78909c', bodyW: 1.45, bodyH: 0.55, tailW: 0.45, tailH: 0.80 },
    { id: 'shark',      name: '鲨鱼',     minSize: 56, maxSize: 75,  color: '#546e7a', accent: '#37474f', bodyW: 1.42, bodyH: 0.58, tailW: 0.70, tailH: 0.90 },
    { id: 'whale',      name: '鲸鱼',     minSize: 76, maxSize: 100, color: '#1565c0', accent: '#0d47a1', bodyW: 1.58, bodyH: 0.68, tailW: 1.20, tailH: 0.60 },
    { id: 'orca',       name: '虎鲸',     minSize: 101,maxSize: 140, color: '#212121', accent: '#ffffff', bodyW: 1.50, bodyH: 0.72, tailW: 0.90, tailH: 0.80 },
    { id: 'megalodon',  name: '巨齿鲨',   minSize: 141,maxSize: 170, color: '#37474f', accent: '#263238', bodyW: 1.55, bodyH: 0.60, tailW: 1.00, tailH: 1.10 },
    { id: 'leviathan',  name: '远古海兽', minSize: 171,maxSize: 200, color: '#4a148c', accent: '#12005e', bodyW: 1.65, bodyH: 0.75, tailW: 1.40, tailH: 0.70 }
  ];

  var Config = {
    species: SPECIES,

    getSpecies: function (size) {
      for (var i = 0; i < SPECIES.length; i++) {
        if (size <= SPECIES[i].maxSize) return SPECIES[i];
      }
      return SPECIES[SPECIES.length - 1];
    },

    canvas: { width: 960, height: 600 },

    player: {
      startSize: 11,
      maxSize: 200,
      speed: 3.8,
      boostSpeed: 6.0,
      acceleration: 0.35,
      friction: 0.92,
      growPerEat: 0.6,          // 成长减速：每吃一条涨 0.6
      shrinkPerSecond: 0
    },

    fish: {
      count: 45,
      minSize: 4,
      maxSize: 200,             // NPC 最高到 200，永远有更大的
      speedMin: 0.3,
      speedMax: 1.3,
      turnRate: 0.03,
      fleeRange: 170,
      fleeSpeedMul: 1.3,
      spawnMargin: 30,
      chaseRange: 190,
      chaseSpeedMul: 1.05
    },

    world: { width: 2400, height: 1600, boundaryPadding: 40 },

    rules: {
      eatRatio: 1.0,
      scorePerEat: 10,
      damageOnHit: 3
    },

    visual: {
      backgroundColor: '#0b1e33',
      gridColor: 'rgba(80, 160, 220, 0.08)',
      playerDefaultColor: '#ffffff',
      playerOutline: '#1a1a2e',
      uiText: '#aee6f0'
    }
  };

  global.GameConfig = Config;
})(typeof window !== 'undefined' ? window : this);
