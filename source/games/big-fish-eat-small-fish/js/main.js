// ============================================================
// 大鱼吃小鱼 - 启动器
// 唯一职责：等待 DOM 就绪，创建 Game 实例并注入依赖
// 不包含任何游戏逻辑
// ============================================================
(function () {
  'use strict';

  function init() {
    var canvas = document.getElementById('game-canvas');
    var startBtn = document.getElementById('btn-start');
    var scoreEl = document.getElementById('hud-score');
    var sizeEl = document.getElementById('hud-size');
    var msgEl = document.getElementById('game-message');
    var overlayEl = document.getElementById('game-message-overlay');

    // 依赖注入装配
    var game = new Game({
      canvas: canvas,
      startBtn: startBtn,
      scoreEl: scoreEl,
      sizeEl: sizeEl,
      msgEl: msgEl,
      overlayEl: overlayEl
    });

    // 暴露到全局（便于调试）
    window.__bigFishGame = game;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
