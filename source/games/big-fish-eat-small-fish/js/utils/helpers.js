// ============================================================
// 大鱼吃小鱼 - 工具函数
// 纯函数集合：随机数、向量、数学工具
// 不依赖任何其他模块
// ============================================================
(function (global) {
  'use strict';

  var Utils = {
    // 随机整数 [min, max]
    randInt: function (min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    // 随机浮点数 [min, max)
    randFloat: function (min, max) {
      return Math.random() * (max - min) + min;
    },

    // 随机角度（弧度）
    randAngle: function () {
      return Math.random() * Math.PI * 2;
    },

    // 两点距离
    dist: function (x1, y1, x2, y2) {
      var dx = x2 - x1;
      var dy = y2 - y1;
      return Math.sqrt(dx * dx + dy * dy);
    },

    // 两点距离平方（避免开方，性能优化）
    distSq: function (x1, y1, x2, y2) {
      var dx = x2 - x1;
      var dy = y2 - y1;
      return dx * dx + dy * dy;
    },

    // 限制数值范围
    clamp: function (value, min, max) {
      return value < min ? min : (value > max ? max : value);
    },

    // 角度插值（处理角度环绕）
    lerpAngle: function (a, b, t) {
      var diff = b - a;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      return a + diff * t;
    },

    // 线性插值
    lerp: function (a, b, t) {
      return a + (b - a) * t;
    },

    // 从数组随机取一个
    pick: function (arr) {
      return arr[Math.floor(Math.random() * arr.length)];
    },

    // 生成高对比度饱和色（避开亮金黄色 #ffeb3b 以区分玩家）
    randomFishColor: function () {
      var palette = [
        '#ff1744', // 红
        '#f50057', // 玫瑰
        '#d500f9', // 紫红
        '#aa00ff', // 紫
        '#6200ea', // 深紫
        '#3d5afe', // 靛蓝
        '#2979ff', // 蓝
        '#00b0ff', // 天蓝
        '#00bfa5', // 青绿
        '#00c853', // 绿
        '#76ff03', // 黄绿
        '#ff6d00', // 橙
        '#ff3d00', // 深橙
        '#dd2c00'  // 暗红
      ];
      return Utils.pick(palette);
    }
  };

  global.GameUtils = Utils;
})(typeof window !== 'undefined' ? window : this);
