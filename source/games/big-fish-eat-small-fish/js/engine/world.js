// ============================================================
// 大鱼吃小鱼 - 世界
// 管理：世界边界、AI 鱼群生成/回收、鱼吃鱼判定、背景装饰
// 依赖：Fish, GameUtils, GameConfig（注入）
// ============================================================
(function (global) {
  'use strict';

  /**
   * 游戏世界
   * @param {Object} cfg - 世界配置（GameConfig.world）
   * @param {Object} fishCfg - 鱼配置（GameConfig.fish）
   * @param {Object} rulesCfg - 规则配置（GameConfig.rules）
   */
  function World(cfg, fishCfg, rulesCfg) {
    this.cfg = cfg;
    this.fishCfg = fishCfg;
    this.rulesCfg = rulesCfg;

    this.width = cfg.width;
    this.height = cfg.height;

    this.fishes = [];
    this.events = {}; // 事件回调

    // 装饰物
    this.decorations = [];
    this.waveOffset = 0; // 水波动画偏移
  }

  /**
   * 注册事件
   * @param {string} name - 事件名
   * @param {Function} cb - 回调
   */
  World.prototype.on = function (name, cb) {
    this.events[name] = cb;
  };

  /** 触发事件 */
  World.prototype.emit = function (name, data) {
    if (this.events[name]) {
      this.events[name](data);
    }
  };

  /** 初始化鱼群和装饰（player 可能为 null） */
  World.prototype.init = function (player) {
    this.fishes = [];
    for (var i = 0; i < this.fishCfg.count; i++) {
      this.fishes.push(this.respawnFish(player));
    }
    this._generateDecorations();
  };

  /** 重生鱼（随机位置、远离玩家，尺寸按玩家层级分布） */
  World.prototype.respawnFish = function (player) {
    var species = GameConfig.species;
    // 70% 比玩家小（食饵），30% 可能更大（威胁）
    var roll = Math.random();
    var targetSize;
    if (roll < 0.7) {
      // 生成比玩家小 5~40% 的鱼
      targetSize = GameUtils.randFloat(player.size * 0.3, player.size * 0.95);
    } else {
      // 生成接近玩家或更大的鱼（含捕食者）
      targetSize = GameUtils.randFloat(player.size * 0.7, Math.min(player.size * 1.6, this.fishCfg.maxSize));
    }
    targetSize = Math.max(this.fishCfg.minSize, Math.min(this.fishCfg.maxSize, targetSize));

    var fish = new Fish(this.fishCfg, this, targetSize);
    var safeDistance = this.rulesCfg.damageOnHit ? 200 : 0;
    for (var attempt = 0; attempt < 30; attempt++) {
      fish.x = GameUtils.randFloat(this.fishCfg.spawnMargin, this.width - this.fishCfg.spawnMargin);
      fish.y = GameUtils.randFloat(this.fishCfg.spawnMargin, this.height - this.fishCfg.spawnMargin);
      if (player) {
        var dx = fish.x - player.x;
        var dy = fish.y - player.y;
        if (dx > this.width / 2) dx -= this.width;
        else if (dx < -this.width / 2) dx += this.width;
        if (dy > this.height / 2) dy -= this.height;
        else if (dy < -this.height / 2) dy += this.height;
        if (Math.sqrt(dx * dx + dy * dy) > safeDistance) break;
      } else {
        break;
      }
    }
    return fish;
  };

  /** 生成装饰物（水草、石头）——均匀分布 */
  World.prototype._generateDecorations = function () {
    this.decorations = [];
    var i, x, y, size;

    // 网格分桶、均匀分布
    var cols = 8;
    var rows = 6;
    var cellW = this.width / cols;
    var cellH = this.height / rows;

    // 每个格子至少 1 个石头 + 1-2 个水草
    for (var row = 0; row < rows; row++) {
      for (var col = 0; col < cols; col++) {
        var baseX = col * cellW;
        var baseY = row * cellH;

        // 每个格子 2 石头
        for (var r = 0; r < 2; r++) {
          x = baseX + GameUtils.randFloat(10, cellW - 10);
          y = baseY + cellH - GameUtils.randFloat(20, 50); // 贴底
          if (y > this.height - 10) y = this.height - 10;
          size = GameUtils.randFloat(25, 55);
          this.decorations.push({
            type: 'rock',
            x: x, y: y, size: size,
            color: GameUtils.pick(['#1a2634', '#243447', '#2d3e50', '#1e2d3d'])
          });
        }

        // 每个格子 2 株水草
        for (var s = 0; s < 2; s++) {
          x = baseX + GameUtils.randFloat(15, cellW - 15);
          y = this.height - GameUtils.randFloat(5, 35);
          var height = GameUtils.randFloat(80, 200);
          var swayOffset = GameUtils.randFloat(0, Math.PI * 2);
          this.decorations.push({
            type: 'seaweed',
            x: x, y: y, height: height,
            color: GameUtils.pick(['#2e7d32', '#388e3c', '#43a047', '#1b5e20']),
            swayOffset: swayOffset,
            segments: Math.floor(height / 15)
          });
        }
      }
    }
  };

  World.prototype.update = function (dt, player) {
    var self = this;
    var fishes = this.fishes;

    this.waveOffset += dt * 2;

    for (var i = 0; i < fishes.length; i++) {
      fishes[i].update(dt, player);
    }

    var pSp = GameConfig.getSpecies(player.size);

    for (var j = fishes.length - 1; j >= 0; j--) {
      var f = fishes[j];
      var fSp = f.species;

      // 循环距离
      var dx = f.x - player.x;
      var dy = f.y - player.y;
      if (dx > this.width / 2) dx -= this.width;
      else if (dx < -this.width / 2) dx += this.width;
      if (dy > this.height / 2) dy -= this.height;
      else if (dy < -this.height / 2) dy += this.height;
      var d = Math.sqrt(dx * dx + dy * dy);

      // 碰撞半径：用物种的较大体轴系数
      var rP = player.size * Math.max(pSp.bodyW, pSp.bodyH) * 0.65;
      var rF = f.size * Math.max(fSp.bodyW, fSp.bodyH) * 0.65;

      if (d < rP + rF) {
        if (player.size > f.size * this.rulesCfg.eatRatio) {
          player.eat(f.size, this.rulesCfg.scorePerEat);
          this.emit('eat', { fish: f, playerSize: player.size });
          fishes.splice(j, 1);
          fishes.push(this.spawnFish(player));
        } else if (f.size > player.size * 1.05 && this.rulesCfg.damageOnHit > 0) {
          player.size = Math.max(GameConfig.player.startSize, player.size - this.rulesCfg.damageOnHit);
          player.score = Math.max(0, player.score - this.rulesCfg.scorePerEat);
          this.emit('damage', { fish: f, playerSize: player.size });
          fishes.splice(j, 1);
          fishes.push(this.spawnFish(player));
        }
      }
    }
  };

  /** 生成一条新鱼（出生点远离玩家） */
  World.prototype.spawnFish = function (player) {
    return this.respawnFish(player);
  };

  /**
   * 绘制世界背景（深海 + 网格 + 装饰）
   * @param {CanvasRenderingContext2D} ctx
   * @param {Object} camera - 相机 {x, y}
   */
  World.prototype.drawBackground = function (ctx, camera) {
    var v = GameConfig.visual;
    var w = ctx.canvas.width / (window.devicePixelRatio || 1);
    var h = ctx.canvas.height / (window.devicePixelRatio || 1);

    // 深海渐变背景
    var grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#0a1628');
    grad.addColorStop(0.5, '#0b1e33');
    grad.addColorStop(1, '#061220');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // 网格线（跟随相机滚动，体现世界移动）
    var gridSize = 100;
    var offsetX = -camera.x % gridSize;
    var offsetY = -camera.y % gridSize;

    ctx.strokeStyle = 'rgba(77, 208, 225, 0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var gx = offsetX; gx < w; gx += gridSize) {
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, h);
    }
    for (var gy = offsetY; gy < h; gy += gridSize) {
      ctx.moveTo(0, gy);
      ctx.lineTo(w, gy);
    }
    ctx.stroke();

    // 装饰物（水草、镜子版在循环世界各处）
    this._drawDecorations(ctx, camera, w, h);
  };

  /** 绘制装饰物 */
  World.prototype._drawDecorations = function (ctx, camera, w, h) {
    var decs = this.decorations;
    var time = this.waveOffset;
    var worldW = this.width;
    var worldH = this.height;

    for (var i = 0; i < decs.length; i++) {
      var d = decs[i];

      // 镜子渲染：装饰物靠近边界时多画几份
      for (var m = 0; m < 9; m++) {
        var ofx = 0, ofy = 0;
        if (m === 1) { ofx = worldW; }
        else if (m === 2) { ofx = -worldW; }
        else if (m === 3) { ofy = worldH; }
        else if (m === 4) { ofy = -worldH; }
        else if (m === 5) { ofx = worldW; ofy = worldH; }
        else if (m === 6) { ofx = -worldW; ofy = worldH; }
        else if (m === 7) { ofx = worldW; ofy = -worldH; }
        else if (m === 8) { ofx = -worldW; ofy = -worldH; }

        var screenX = d.x - camera.x + ofx;
        var screenY = d.y - camera.y + ofy;

        // 只绘制在屏幕内的装饰
        if (screenX < -150 || screenX > w + 150 || screenY < -250 || screenY > h + 150) {
          continue;
        }

        if (d.type === 'rock') {
          ctx.fillStyle = d.color;
          ctx.beginPath();
          ctx.ellipse(screenX, screenY, d.size, d.size * 0.6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.05)';
          ctx.beginPath();
          ctx.ellipse(screenX - d.size * 0.3, screenY - d.size * 0.2, d.size * 0.3, d.size * 0.2, -0.3, 0, Math.PI * 2);
          ctx.fill();

        } else if (d.type === 'seaweed') {
          ctx.strokeStyle = d.color;
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';

          var segHeight = d.height / d.segments;
          var sway = Math.sin(time + d.swayOffset) * 15;

          ctx.beginPath();
          ctx.moveTo(screenX, screenY);

          for (var j = 1; j <= d.segments; j++) {
            var progress = j / d.segments;
            var segSway = sway * progress * progress;
            var segX = screenX + segSway;
            var segY = screenY - segHeight * j;
            ctx.lineTo(segX, segY);
          }
          ctx.stroke();

          ctx.fillStyle = d.color;
          for (var k = 2; k < d.segments; k += 2) {
            var progress = k / d.segments;
            var leafSway = sway * progress * progress;
            var leafX = screenX + leafSway;
            var leafY = screenY - segHeight * k;
            var leafSize = 8 * (1 - progress * 0.5);

            ctx.beginPath();
            ctx.ellipse(leafX + 10, leafY, leafSize, leafSize * 2, 0.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }
  };

  global.World = World;
})(typeof window !== 'undefined' ? window : this);
