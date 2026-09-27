// ============================================================
// 大鱼吃小鱼 - 游戏主循环
// 状态机：READY（准备）→ PLAYING（进行）→ GAMEOVER（结束）
// 负责：装配各模块、游戏循环、输入分发、UI 更新
// 依赖：World, Player, Renderer, GameConfig, GameUtils
// ============================================================
(function (global) {
  'use strict';

  // 游戏状态
  var STATE = {
    READY: 'ready',
    PLAYING: 'playing',
    GAMEOVER: 'gameover'
  };

  /**
   * 游戏主类
   * @param {Object} opts - 依赖注入
   *   { canvas, hud, startBtn, restartBtn, scoreEl, sizeEl, msgEl }
   */
  function Game(opts) {
    this.canvas = opts.canvas;
    this.hud = opts.hud;
    this.startBtn = opts.startBtn;
    this.restartBtn = opts.restartBtn;
    this.scoreEl = opts.scoreEl;
    this.sizeEl = opts.sizeEl;
    this.msgEl = opts.msgEl;
    this.overlayEl = opts.overlayEl;

    // 模块装配
    this.renderer = new Renderer(this.canvas, GameConfig.canvas);
    this.world = new World(
      GameConfig.world,
      GameConfig.fish,
      GameConfig.rules
    );
    this.player = new Player(GameConfig.player, GameConfig.world);

    // 状态
    this.state = STATE.READY;
    this.lastTime = 0;
    this.animFrame = null;

    // 绑定世界事件
    var self = this;
    // 受伤闪烁计时器（连续受击时重置，避免上一次闪烁提前熄灭）
    var flashTimer = null;
    this.world.on('eat', function () {
      self.updateHud();
    });
    this.world.on('damage', function () {
      self.updateHud();
      // 受伤闪烁
      self.canvas.style.filter = 'brightness(1.5)';
      if (flashTimer) clearTimeout(flashTimer);
      flashTimer = setTimeout(function () {
        self.canvas.style.filter = '';
        flashTimer = null;
      }, 150);
    });

    // 绑定输入
    this._bindInput();
    this._bindUI();

    // 显示初始 HUD
    this.updateHud();
    this.showMessage('点击开始 或 按 Enter 开始游戏', true);
  }

  // ---- 输入绑定 ----

  Game.prototype._bindInput = function () {
    var self = this;

    // 键盘
    window.addEventListener('keydown', function (e) {
      switch (e.key) {
        case 'ArrowUp': case 'ArrowDown': case 'ArrowLeft': case 'ArrowRight':
        case 'w': case 'W': case 'a': case 'A': case 's': case 'S': case 'd': case 'D':
        case ' ':
          e.preventDefault(); break;
      }
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': self.player.clearTarget(); self.player.setKey('up', true); break;
        case 'ArrowDown': case 's': case 'S': self.player.clearTarget(); self.player.setKey('down', true); break;
        case 'ArrowLeft': case 'a': case 'A': self.player.clearTarget(); self.player.setKey('left', true); break;
        case 'ArrowRight': case 'd': case 'D': self.player.clearTarget(); self.player.setKey('right', true); break;
        case ' ': self.player.setKey('boost', true); break;
        case 'Enter': self.handleEnter(); break;
      }
    });
    window.addEventListener('keyup', function (e) {
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': self.player.setKey('up', false); break;
        case 'ArrowDown': case 's': case 'S': self.player.setKey('down', false); break;
        case 'ArrowLeft': case 'a': case 'A': self.player.setKey('left', false); break;
        case 'ArrowRight': case 'd': case 'D': self.player.setKey('right', false); break;
        case ' ': self.player.setKey('boost', false); break;
      }
    });

    // 鼠标：点击/移动跟随
    var rect = null;
    // 窗口尺寸变化后缓存的矩形失效，否则坐标换算错位
    window.addEventListener('resize', function () { rect = null; });
    function getCanvasPos(e) {
      if (!rect) rect = self.canvas.getBoundingClientRect();
      // 将屏幕坐标转为世界坐标（考虑相机）
      var scaleX = self.renderer.logicWidth / rect.width;
      var scaleY = self.renderer.logicHeight / rect.height;
      var localX = (e.clientX - rect.left) * scaleX;
      var localY = (e.clientY - rect.top) * scaleY;
      return {
        x: localX + self.renderer.camera.x,
        y: localY + self.renderer.camera.y
      };
    }

    self.canvas.addEventListener('mousemove', function (e) {
      if (self.state !== STATE.PLAYING) return;
      var pos = getCanvasPos(e);
      self.player.setTarget(pos.x, pos.y);
    });
    self.canvas.addEventListener('mousedown', function (e) {
      if (self.state === STATE.READY) {
        self.start();
      } else if (self.state === STATE.PLAYING) {
        var pos = getCanvasPos(e);
        self.player.setTarget(pos.x, pos.y);
      }
    });

    // 触摸
    self.canvas.addEventListener('touchstart', function (e) {
      e.preventDefault();
      if (self.state === STATE.READY) {
        self.start();
        return;
      }
      if (self.state !== STATE.PLAYING) return;
      var touch = e.touches[0];
      var pos = getCanvasPos(touch);
      self.player.setTarget(pos.x, pos.y);
    });
    self.canvas.addEventListener('touchmove', function (e) {
      e.preventDefault();
      if (self.state !== STATE.PLAYING) return;
      var touch = e.touches[0];
      var pos = getCanvasPos(touch);
      self.player.setTarget(pos.x, pos.y);
    });
  };

  Game.prototype._bindUI = function () {
    var self = this;
    // startBtn 存在于覆盖层中，点击后隐藏覆盖层（避免 click 事件误触 canvas mousedown 重启游戏）
    if (this.startBtn) {
      this.startBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        self.start();
      });
    }
    if (this.restartBtn) {
      this.restartBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        self.restart();
      });
    }
  };

  // ---- 状态控制 ----

  Game.prototype.handleEnter = function () {
    if (this.state === STATE.READY) this.start();
    else if (this.state === STATE.GAMEOVER) this.restart();
  };

  /** 开始游戏 */
  Game.prototype.start = function () {
    if (this.state === STATE.PLAYING) return;
    this.state = STATE.PLAYING;
    this.hideMessage();
    this.player.score = 0;
    this.player.size = GameConfig.player.startSize;
    // 玩家初始在世界中心，相机对准玩家
    this.player.x = GameConfig.world.width / 2;
    this.player.y = GameConfig.world.height / 2;
    this.renderer.camera.x = this.player.x - this.renderer.logicWidth / 2;
    this.renderer.camera.y = this.player.y - this.renderer.logicHeight / 2;
    this.world.init(this.player);
    this.updateHud();
    this.lastTime = performance.now();
    this.loop();
  };

  /** 重新开始 */
  Game.prototype.restart = function () {
    this.start();
  };

  /** 游戏结束 */
  Game.prototype.gameOver = function () {
    this.state = STATE.GAMEOVER;
    this.showMessage('游戏结束！得分：' + this.player.score, false);
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
  };

  // ---- 主循环 ----

  Game.prototype.loop = function () {
    var self = this;
    if (this.state !== STATE.PLAYING) return;

    var now = performance.now();
    var dt = Math.min((now - this.lastTime) / 1000, 0.05); // 限制最大帧间隔
    this.lastTime = now;

    // 更新
    this.player.update(dt);
    this.world.update(dt, this.player);
    this.renderer.updateCamera(this.player, this.world);

    // 渲染
    this.renderer.render(this.world, this.player);

    // 更新 HUD（每帧更新尺寸）
    this.updateHud();

    // 下一帧
    this.animFrame = requestAnimationFrame(function () {
      self.loop();
    });
  };

  // ---- UI ----

  Game.prototype.updateHud = function () {
    this.scoreEl.textContent = this.player.score;
    this.sizeEl.textContent = Math.floor(this.player.size);
  };

  Game.prototype.showMessage = function (text, isHint) {
    this.msgEl.textContent = text;
    if (this.overlayEl) this.overlayEl.classList.remove('hidden');
    if (isHint) {
      this.msgEl.classList.add('hint');
    } else {
      this.msgEl.classList.remove('hint');
    }
  };

  Game.prototype.hideMessage = function () {
    if (this.overlayEl) this.overlayEl.classList.add('hidden');
  };

  global.Game = Game;
  global.GAME_STATE = STATE;
})(typeof window !== 'undefined' ? window : this);
