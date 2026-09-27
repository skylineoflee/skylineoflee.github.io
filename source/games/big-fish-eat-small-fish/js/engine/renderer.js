// ============================================================
// 大鱼吃小鱼 - 渲染器
// 8 种真实鱼类逐物种轮廓绘制
// 玩家白色，NPC 本色。碰撞用椭圆方向半径匹配视觉
// ============================================================
(function (global) {
  'use strict';

  function Renderer(canvas, cfg) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cfg = cfg;
    this.logicWidth = cfg.width;
    this.logicHeight = cfg.height;
    this.camera = { x: 0, y: 0 };
    this._setupCanvas();
    var self = this;
    window.addEventListener('resize', function () { self._setupCanvas(); });
  }

  Renderer.prototype._setupCanvas = function () {
    var dpr = window.devicePixelRatio || 1;
    var container = this.canvas.parentElement;
    var rect = container ? container.getBoundingClientRect() : { width: this.logicWidth, height: this.logicHeight };
    var w = Math.max(320, Math.floor(rect.width));
    var h = Math.max(240, Math.floor(rect.height));
    this.logicWidth = w;
    this.logicHeight = h;
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.dpr = dpr;
  };

  Renderer.prototype.updateCamera = function (player, world) {
    var cam = this.camera;
    var targetX = player.x - this.logicWidth / 2;
    var targetY = player.y - this.logicHeight / 2;
    var dx = targetX - cam.x, dy = targetY - cam.y;
    if (Math.abs(dx) > world.width / 2) cam.x += (dx > 0 ? world.width : -world.width);
    if (Math.abs(dy) > world.height / 2) cam.y += (dy > 0 ? world.height : -world.height);
    cam.x = GameUtils.lerp(cam.x, targetX, 0.08);
    cam.y = GameUtils.lerp(cam.y, targetY, 0.08);
  };

  Renderer.prototype._getFishScreenPositions = function (fish, cam, world) {
    var positions = [];
    var pSX = this.logicWidth / 2, pSY = this.logicHeight / 2;
    var worldDx = fish.x - (cam.x + pSX), worldDy = fish.y - (cam.y + pSY);
    if (worldDx > world.width / 2) worldDx -= world.width;
    else if (worldDx < -world.width / 2) worldDx += world.width;
    if (worldDy > world.height / 2) worldDy -= world.height;
    else if (worldDy < -world.height / 2) worldDy += world.height;
    positions.push({ sx: pSX + worldDx, sy: pSY + worldDy });
    var m = 100, sx0 = fish.x - cam.x, sy0 = fish.y - cam.y;
    if (sx0 < m) positions.push({ sx: pSX + worldDx + world.width, sy: pSY + worldDy });
    if (sx0 > this.logicWidth - m) positions.push({ sx: pSX + worldDx - world.width, sy: pSY + worldDy });
    if (sy0 < m) positions.push({ sx: pSX + worldDx, sy: pSY + worldDy + world.height });
    if (sy0 > this.logicHeight - m) positions.push({ sx: pSX + worldDx, sy: pSY + worldDy - world.height });
    return positions;
  };

  Renderer.prototype.render = function (world, player) {
    var ctx = this.ctx;
    world.drawBackground(ctx, this.camera);
    var fishes = world.fishes;
    for (var i = 0; i < fishes.length; i++) {
      var fish = fishes[i];
      var positions = this._getFishScreenPositions(fish, this.camera, world);
      for (var j = 0; j < positions.length; j++) {
        this._drawNPC(fish, ctx, positions[j].sx, positions[j].sy);
      }
    }
    this._drawPlayer(player, ctx);
  };

  // ========== NPC 绘制 ==========
  Renderer.prototype._drawNPC = function (fish, ctx, sx, sy) {
    var s = fish.size;
    if (sx < -s * 5 || sx > this.logicWidth + s * 5 || sy < -s * 5 || sy > this.logicHeight + s * 5) return;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(fish.angle);
    this['_draw' + fish.species.id.charAt(0).toUpperCase() + fish.species.id.slice(1)](ctx, s, fish.species, fish);
    ctx.restore();
  };

  // ========== 玩家绘制（白色）==========
  Renderer.prototype._drawPlayer = function (player, ctx) {
    var cx = this.logicWidth / 2, cy = this.logicHeight / 2;
    var s = player.size;
    var sp = GameConfig.getSpecies(s);

    // 物种数据副本 + 覆盖为白色
    var whiteSpecies = { id: sp.id, bodyW: sp.bodyW, bodyH: sp.bodyH, tailW: sp.tailW, tailH: sp.tailH, color: '#ffffff', accent: '#1a1a2e' };

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(player.angle);
    this['_draw' + sp.id.charAt(0).toUpperCase() + sp.id.slice(1)](ctx, s, whiteSpecies, player);
    ctx.restore();
  };

  // ================================================================
  //  沙丁鱼 — 细长纺锤形 + 银色条纹 + 小尾
  // ================================================================
  Renderer.prototype._drawSardine = function (ctx, s, sp) {
    ctx.fillStyle = sp.color;
    ctx.beginPath();
    ctx.moveTo(s * 1.05, 0);
    ctx.bezierCurveTo(s * 0.5, -s * 0.38, -s * 0.55, -s * 0.38, -s * 1.0, -s * 0.15);
    ctx.quadraticCurveTo(-s * 1.15, -s * 0.05, -s * 1.0, s * 0.15);
    ctx.bezierCurveTo(-s * 0.55, s * 0.38, s * 0.5, s * 0.38, s * 1.05, 0);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; ctx.stroke();

    // 银色条纹
    ctx.strokeStyle = sp.accent; ctx.lineWidth = s * 0.06;
    ctx.beginPath(); ctx.moveTo(-s * 0.3, -s * 0.25); ctx.lineTo(s * 0.3, -s * 0.1); ctx.stroke();

    // 尾鳍（小叉形）
    ctx.fillStyle = sp.color;
    ctx.beginPath();
    ctx.moveTo(-s * 0.9, 0);
    ctx.quadraticCurveTo(-s * 1.2, -s * 0.35, -s * 1.35, -s * 0.2);
    ctx.quadraticCurveTo(-s * 1.15, 0, -s * 1.35, s * 0.2);
    ctx.quadraticCurveTo(-s * 1.2, s * 0.35, -s * 0.9, 0);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    // 背鳍
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.ellipse(s * 0.05, -s * 0.38, s * 0.28, s * 0.06, 0, 0, Math.PI * 2); ctx.fill();

    // 眼
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(s * 0.6, -s * 0.1, s * 0.11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(s * 0.64, -s * 0.1, s * 0.06, 0, Math.PI * 2); ctx.fill();
  };

  // ================================================================
  //  小丑鱼 — 圆卵形 + 两道白竖纹 + 圆尾
  // ================================================================
  Renderer.prototype._drawClownfish = function (ctx, s, sp) {
    ctx.fillStyle = sp.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 1.1, s * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1; ctx.stroke();

    // 尾鳍
    ctx.fillStyle = sp.color;
    ctx.beginPath();
    ctx.moveTo(-s * 0.78, -s * 0.3);
    ctx.quadraticCurveTo(-s * 1.15, -s * 0.45, -s * 1.25, 0);
    ctx.quadraticCurveTo(-s * 1.15, s * 0.45, -s * 0.78, s * 0.3);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    // 白条纹
    ctx.strokeStyle = sp.accent; ctx.lineWidth = s * 0.12; ctx.globalAlpha = 0.9;
    ctx.beginPath(); ctx.moveTo(s * 0.05, -s * 0.78); ctx.lineTo(s * 0.05, s * 0.78); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-s * 0.35, -s * 0.78); ctx.lineTo(-s * 0.35, s * 0.78); ctx.stroke();
    ctx.globalAlpha = 1;

    // 背鳍
    ctx.fillStyle = sp.color;
    ctx.beginPath(); ctx.ellipse(s * 0.2, -s * 0.72, s * 0.35, s * 0.1, -0.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // 眼
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(s * 0.65, -s * 0.18, s * 0.16, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(s * 0.65, s * 0.18, s * 0.16, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(s * 0.7, -s * 0.18, s * 0.08, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(s * 0.7, s * 0.18, s * 0.08, 0, Math.PI * 2); ctx.fill();
  };

  // ================================================================
  //  神仙鱼 — 菱形高体 + 长飘尾 + 条纹
  // ================================================================
  Renderer.prototype._drawAngelfish = function (ctx, s, sp) {
    ctx.fillStyle = sp.color;
    ctx.beginPath();
    ctx.moveTo(s * 0.65, 0);
    ctx.quadraticCurveTo(s * 0.2, -s * 0.85, -s * 0.15, -s * 1.0);
    ctx.quadraticCurveTo(-s * 0.5, -s * 0.6, -s * 0.8, -s * 0.15);
    ctx.quadraticCurveTo(-s * 0.5, s * 0.6, -s * 0.15, s * 1.0);
    ctx.quadraticCurveTo(s * 0.2, s * 0.85, s * 0.65, 0);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1; ctx.stroke();

    // 竖条纹
    ctx.strokeStyle = sp.accent; ctx.lineWidth = s * 0.06; ctx.globalAlpha = 0.6;
    for (var k = -1; k <= 1; k++) {
      ctx.beginPath();
      ctx.moveTo(k * s * 0.22, -s * 0.95);
      ctx.lineTo(k * s * 0.22, s * 0.95);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // 腹鳍（细长须）
    ctx.strokeStyle = sp.color; ctx.lineWidth = s * 0.06;
    ctx.beginPath(); ctx.moveTo(s * 0.1, s * 0.4); ctx.quadraticCurveTo(s * 0.4, s * 1.2, s * 0.2, s * 1.6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-s * 0.3, s * 0.3); ctx.quadraticCurveTo(-s * 0.1, s * 1.0, -s * 0.05, s * 1.4); ctx.stroke();

    // 眼
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(s * 0.3, -s * 0.15, s * 0.12, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(s * 0.3, s * 0.15, s * 0.12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(s * 0.33, -s * 0.15, s * 0.06, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(s * 0.33, s * 0.15, s * 0.06, 0, Math.PI * 2); ctx.fill();
  };

  // ================================================================
  //  金鱼 — 圆形大肚 + 飘逸分叉双尾 + 头肉瘤
  // ================================================================
  Renderer.prototype._drawGoldfish = function (ctx, s, sp) {
    ctx.fillStyle = sp.color;
    ctx.beginPath(); ctx.ellipse(0, 0, s * 0.78, s * 0.82, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.2; ctx.stroke();

    // 飘逸双尾
    var wt = Math.sin(Date.now() / 150) * 0.25;
    ctx.fillStyle = sp.color;
    ctx.beginPath();
    ctx.moveTo(-s * 0.55, -s * 0.15);
    ctx.quadraticCurveTo(-s * 1.0, -s * 0.8 + wt * s, -s * 1.7, -s * 0.55);
    ctx.quadraticCurveTo(-s * 1.0, 0, -s * 0.55, s * 0.15);
    ctx.quadraticCurveTo(-s * 1.0, s * 0.8 + wt * s, -s * 1.7, s * 0.55);
    ctx.quadraticCurveTo(-s * 1.0, 0, -s * 0.55, -s * 0.15);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    // 头肉瘤
    ctx.fillStyle = sp.accent; ctx.globalAlpha = 0.7;
    ctx.beginPath(); ctx.ellipse(s * 0.52, 0, s * 0.22, s * 0.38, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    // 凸眼
    [-1, 1].forEach(function (side) {
      var ey = side * s * 0.25;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(s * 0.5, ey, s * 0.16, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#111';
      ctx.beginPath(); ctx.arc(s * 0.55, ey, s * 0.08, 0, Math.PI * 2); ctx.fill();
    });
  };

  // ================================================================
  //  锦鲤 — 纺锤流线体 + 红白斑纹 + 胡须 + 宽尾
  // ================================================================
  Renderer.prototype._drawKoi = function (ctx, s, sp) {
    ctx.fillStyle = sp.color;
    ctx.beginPath();
    ctx.moveTo(s * 1.0, 0);
    ctx.bezierCurveTo(s * 0.6, -s * 0.48, -s * 0.35, -s * 0.48, -s * 0.8, -s * 0.25);
    ctx.quadraticCurveTo(-s * 0.95, -s * 0.08, -s * 0.95, 0);
    ctx.quadraticCurveTo(-s * 0.95, s * 0.08, -s * 0.8, s * 0.25);
    ctx.bezierCurveTo(-s * 0.35, s * 0.48, s * 0.6, s * 0.48, s * 1.0, 0);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.2; ctx.stroke();

    // 红白斑纹
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(s * 0.25, -s * 0.12, s * 0.3, s * 0.2, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-s * 0.12, s * 0.1, s * 0.28, s * 0.16, 0.25, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-s * 0.45, -s * 0.06, s * 0.22, s * 0.12, -0.15, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    // 宽尾
    var wt = Math.sin(Date.now() / 160) * 0.2;
    ctx.fillStyle = sp.color;
    ctx.beginPath();
    ctx.moveTo(-s * 0.8, 0);
    ctx.quadraticCurveTo(-s * 1.25, -s * 0.5 + wt * s, -s * 1.5, -s * 0.35);
    ctx.quadraticCurveTo(-s * 1.15, 0, -s * 1.5, s * 0.35);
    ctx.quadraticCurveTo(-s * 1.25, s * 0.5 + wt * s, -s * 0.8, 0);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    // 胸鳍
    ctx.fillStyle = sp.color;
    ctx.beginPath(); ctx.ellipse(0, -s * 0.5, s * 0.28, s * 0.08, -0.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, s * 0.5, s * 0.28, s * 0.08, 0.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // 胡须
    ctx.strokeStyle = sp.color; ctx.lineWidth = s * 0.03;
    ctx.beginPath(); ctx.moveTo(s * 1.0, 0); ctx.lineTo(s * 1.2, -s * 0.12); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s * 1.0, 0); ctx.lineTo(s * 1.2, s * 0.12); ctx.stroke();

    // 眼
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(s * 0.55, -s * 0.14, s * 0.11, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(s * 0.55, s * 0.14, s * 0.11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(s * 0.58, -s * 0.14, s * 0.06, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(s * 0.58, s * 0.14, s * 0.06, 0, Math.PI * 2); ctx.fill();
  };

  // ================================================================
  //  金枪鱼 — 粗壮梭形 + 小鳍 + 月牙尾
  // ================================================================
  Renderer.prototype._drawTuna = function (ctx, s, sp) {
    ctx.fillStyle = sp.color;
    ctx.beginPath();
    ctx.moveTo(s * 1.1, 0);
    ctx.bezierCurveTo(s * 0.7, -s * 0.48, -s * 0.25, -s * 0.48, -s * 0.85, -s * 0.22);
    ctx.quadraticCurveTo(-s * 1.05, -s * 0.08, -s * 1.05, 0);
    ctx.quadraticCurveTo(-s * 1.05, s * 0.08, -s * 0.85, s * 0.22);
    ctx.bezierCurveTo(-s * 0.25, s * 0.48, s * 0.7, s * 0.48, s * 1.1, 0);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1.3; ctx.stroke();

    // 背脊条纹
    ctx.fillStyle = sp.accent; ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.ellipse(-s * 0.2, -s * 0.48, s * 0.5, s * 0.12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    // 月牙尾
    ctx.fillStyle = sp.color;
    ctx.beginPath();
    ctx.moveTo(-s * 0.82, -s * 0.04);
    ctx.quadraticCurveTo(-s * 1.15, -s * 0.55, -s * 1.5, -s * 0.35);
    ctx.quadraticCurveTo(-s * 1.1, -s * 0.1, -s * 0.88, s * 0.02);
    ctx.quadraticCurveTo(-s * 1.05, s * 0.3, -s * 1.2, s * 0.15);
    ctx.quadraticCurveTo(-s * 1.05, s * 0.05, -s * 0.82, -s * 0.04);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    // 胸鳍
    ctx.fillStyle = sp.color;
    ctx.beginPath(); ctx.ellipse(0, -s * 0.5, s * 0.18, s * 0.08, -0.6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // 眼
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(s * 0.55, -s * 0.15, s * 0.12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(s * 0.58, -s * 0.15, s * 0.07, 0, Math.PI * 2); ctx.fill();
  };

  // ================================================================
  //  鲨鱼 — 流线体 + 三角背鳍 + 鳃裂
  // ================================================================
  Renderer.prototype._drawShark = function (ctx, s, sp) {
    ctx.fillStyle = sp.color;
    ctx.beginPath();
    ctx.moveTo(s * 1.15, 0);
    ctx.bezierCurveTo(s * 0.7, -s * 0.46, -s * 0.3, -s * 0.44, -s * 0.85, -s * 0.18);
    ctx.quadraticCurveTo(-s * 1.0, -s * 0.04, -s * 0.85, s * 0.18);
    ctx.bezierCurveTo(-s * 0.3, s * 0.44, s * 0.7, s * 0.46, s * 1.15, 0);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1.2; ctx.stroke();

    // 腹部白
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath(); ctx.ellipse(-s * 0.05, s * 0.2, s * 0.55, s * 0.2, 0.05, 0, Math.PI * 2); ctx.fill();

    // 背鳍
    ctx.fillStyle = sp.accent;
    ctx.beginPath();
    ctx.moveTo(-s * 0.05, -s * 0.5);
    ctx.lineTo(s * 0.22, -s * 1.5);
    ctx.lineTo(s * 0.42, -s * 0.5);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    // 胸鳍
    ctx.fillStyle = sp.color;
    ctx.beginPath();
    ctx.moveTo(-s * 0.1, s * 0.48);
    ctx.quadraticCurveTo(-s * 0.3, s * 0.9, -s * 0.25, s * 0.55);
    ctx.quadraticCurveTo(-s * 0.1, s * 0.5, s * 0.1, s * 0.44);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    // 月牙尾
    ctx.fillStyle = sp.color;
    ctx.beginPath();
    ctx.moveTo(-s * 0.75, -s * 0.04);
    ctx.quadraticCurveTo(-s * 1.1, -s * 0.65, -s * 1.4, -s * 0.45);
    ctx.quadraticCurveTo(-s * 1.0, -s * 0.08, -s * 0.8, s * 0.04);
    ctx.quadraticCurveTo(-s * 0.9, s * 0.3, -s * 1.0, s * 0.18);
    ctx.quadraticCurveTo(-s * 0.95, s * 0.04, -s * 0.75, -s * 0.04);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    // 鳃裂
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = s * 0.035;
    for (var g = 0; g < 3; g++) {
      ctx.beginPath();
      ctx.moveTo(s * 0.25 + g * s * 0.07, -s * 0.32);
      ctx.lineTo(s * 0.2 + g * s * 0.07, s * 0.28);
      ctx.stroke();
    }

    // 眼
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(s * 0.55, -s * 0.14, s * 0.09, 0, Math.PI * 2); ctx.fill();
  };

  // ================================================================
  //  鲸鱼 — 椭圆巨体 + 扁平尾鳍 + 喷水柱
  // ================================================================
  Renderer.prototype._drawWhale = function (ctx, s, sp) {
    ctx.fillStyle = sp.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 1.2, s * 0.68, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1.3; ctx.stroke();

    // 腹部浅色
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath(); ctx.ellipse(-s * 0.05, s * 0.2, s * 0.9, s * 0.4, 0, 0, Math.PI * 2); ctx.fill();

    // 扁平尾鳍
    ctx.fillStyle = sp.color;
    ctx.beginPath();
    ctx.moveTo(-s * 1.1, 0);
    ctx.quadraticCurveTo(-s * 1.6, -s * 0.45, -s * 1.8, -s * 0.28);
    ctx.quadraticCurveTo(-s * 1.5, 0, -s * 1.8, s * 0.28);
    ctx.quadraticCurveTo(-s * 1.6, s * 0.45, -s * 1.1, 0);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    // 胸鳍
    ctx.fillStyle = sp.color;
    ctx.beginPath(); ctx.ellipse(s * 0.05, s * 0.68, s * 0.35, s * 0.1, -0.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // 喷水柱
    ctx.strokeStyle = 'rgba(173,216,230,0.5)'; ctx.lineWidth = s * 0.04;
    var spPhase = Date.now() / 400 % 2;
    for (var p = 0; p < 3; p++) {
      ctx.beginPath();
      ctx.moveTo(s * 0.1 + p * s * 0.1, -s * 0.6);
      ctx.lineTo(s * 0.1 + p * s * 0.1, -s * 0.6 - spPhase * s * 0.25 - p * s * 0.15);
      ctx.stroke();
    }

    // 眼
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(s * 0.75, -s * 0.18, s * 0.08, 0, Math.PI * 2); ctx.fill();
  };

  // ================================================================
  //  虎鲸 — 黑白撞色 + 高背鳍 + 强壮尾
  // ================================================================
  Renderer.prototype._drawOrca = function (ctx, s, sp) {
    ctx.fillStyle = sp.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 1.25, s * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1.3; ctx.stroke();

    // 白色腹部斑块
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(-s * 0.1, s * 0.18, s * 0.8, s * 0.45, 0.05, 0, Math.PI * 2); ctx.fill();
    // 眼后白斑
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(s * 0.4, -s * 0.25, s * 0.12, s * 0.08, 0, 0, Math.PI * 2); ctx.fill();

    // 高耸背鳍（雄性特征）
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.moveTo(-s * 0.1, -s * 0.65);
    ctx.lineTo(s * 0.2, -s * 1.7);
    ctx.lineTo(s * 0.55, -s * 0.65);
    ctx.closePath(); ctx.fill();

    // 强尾鳍
    ctx.fillStyle = sp.color;
    ctx.beginPath();
    ctx.moveTo(-s * 1.1, 0);
    ctx.quadraticCurveTo(-s * 1.55, -s * 0.55, -s * 1.85, -s * 0.35);
    ctx.quadraticCurveTo(-s * 1.5, 0, -s * 1.85, s * 0.35);
    ctx.quadraticCurveTo(-s * 1.55, s * 0.55, -s * 1.1, 0);
    ctx.closePath(); ctx.fill();

    // 胸鳍
    ctx.fillStyle = sp.color;
    ctx.beginPath(); ctx.ellipse(s * 0.05, s * 0.7, s * 0.4, s * 0.12, -0.4, 0, Math.PI * 2); ctx.fill();

    // 眼（白圈+黑瞳）
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(s * 0.6, -s * 0.2, s * 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(s * 0.64, -s * 0.2, s * 0.06, 0, Math.PI * 2); ctx.fill();
  };

  // ================================================================
  //  巨齿鲨 — 超大鲨鱼 + 血盆大口 + 锯齿纹
  // ================================================================
  Renderer.prototype._drawMegalodon = function (ctx, s, sp) {
    ctx.fillStyle = sp.color;
    ctx.beginPath();
    ctx.moveTo(s * 1.2, 0);
    ctx.bezierCurveTo(s * 0.7, -s * 0.5, -s * 0.35, -s * 0.48, -s * 0.9, -s * 0.2);
    ctx.quadraticCurveTo(-s * 1.08, -s * 0.06, -s * 0.9, s * 0.2);
    ctx.bezierCurveTo(-s * 0.35, s * 0.48, s * 0.7, s * 0.5, s * 1.2, 0);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1.5; ctx.stroke();

    // 腹部浅色
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.ellipse(-s * 0.05, s * 0.2, s * 0.55, s * 0.22, 0.05, 0, Math.PI * 2); ctx.fill();

    // 巨型背鳍
    ctx.fillStyle = sp.accent;
    ctx.beginPath();
    ctx.moveTo(-s * 0.08, -s * 0.55);
    ctx.lineTo(s * 0.2, -s * 1.8);
    ctx.lineTo(s * 0.48, -s * 0.55);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    // 血盆大口
    ctx.strokeStyle = '#b71c1c'; ctx.lineWidth = s * 0.06;
    ctx.beginPath();
    ctx.moveTo(s * 0.55, s * 0.08);
    ctx.quadraticCurveTo(s * 0.9, s * 0.3, s * 0.55, s * 0.45);
    ctx.stroke();
    // 牙齿（锯齿）
    ctx.fillStyle = '#ffffff';
    for (var t = 0; t < 5; t++) {
      var tx = s * 0.6 + t * s * 0.06;
      ctx.beginPath();
      ctx.moveTo(tx, s * 0.1);
      ctx.lineTo(tx + s * 0.03, s * 0.2);
      ctx.lineTo(tx + s * 0.06, s * 0.1);
      ctx.fill();
    }

    // 锯齿月牙尾
    ctx.fillStyle = sp.color;
    ctx.beginPath();
    ctx.moveTo(-s * 0.8, -s * 0.04);
    ctx.quadraticCurveTo(-s * 1.2, -s * 0.75, -s * 1.55, -s * 0.5);
    ctx.quadraticCurveTo(-s * 1.1, -s * 0.1, -s * 0.85, s * 0.04);
    ctx.quadraticCurveTo(-s * 1.0, s * 0.35, -s * 1.15, s * 0.22);
    ctx.quadraticCurveTo(-s * 1.05, s * 0.05, -s * 0.8, -s * 0.04);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    // 胸鳍
    ctx.fillStyle = sp.color;
    ctx.beginPath();
    ctx.moveTo(-s * 0.12, s * 0.52);
    ctx.quadraticCurveTo(-s * 0.4, s * 1.05, -s * 0.3, s * 0.62);
    ctx.quadraticCurveTo(-s * 0.15, s * 0.55, s * 0.12, s * 0.48);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    // 鳃裂
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = s * 0.04;
    for (var g = 0; g < 4; g++) {
      ctx.beginPath();
      ctx.moveTo(s * 0.2 + g * s * 0.08, -s * 0.35);
      ctx.lineTo(s * 0.15 + g * s * 0.08, s * 0.3);
      ctx.stroke();
    }

    // 眼（红色凶光）
    ctx.fillStyle = '#e53935';
    ctx.beginPath(); ctx.arc(s * 0.5, -s * 0.18, s * 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(s * 0.53, -s * 0.18, s * 0.05, 0, Math.PI * 2); ctx.fill();
  };

  // ================================================================
  //  远古海兽 — 紫色巨兽 + 触须状鳍 + 诡异生物
  // ================================================================
  Renderer.prototype._drawLeviathan = function (ctx, s, sp) {
    ctx.fillStyle = sp.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 1.3, s * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = sp.accent; ctx.lineWidth = 2; ctx.stroke();

    // 发光腹部纹理
    ctx.fillStyle = 'rgba(177,100,255,0.35)';
    ctx.beginPath(); ctx.ellipse(-s * 0.05, s * 0.15, s * 1.0, s * 0.5, 0, 0, Math.PI * 2); ctx.fill();

    // 触须状尾（三叉触手）
    ctx.strokeStyle = sp.color; ctx.lineWidth = s * 0.1;
    for (var t = -1; t <= 1; t++) {
      ctx.beginPath();
      ctx.moveTo(-s * 1.15, t * s * 0.08);
      ctx.quadraticCurveTo(-s * 1.6, t * s * 0.5, -s * 1.9 + t * s * 0.3, t * s * 0.7);
      ctx.stroke();
    }

    // 背脊发光棘刺
    ctx.fillStyle = sp.accent; ctx.globalAlpha = 0.7;
    for (var i = 0; i < 6; i++) {
      var sx = s * 0.9 - i * s * 0.3;
      var sh = s * 0.5 + Math.sin(Date.now() / 200 + i) * s * 0.2;
      ctx.beginPath();
      ctx.moveTo(sx, -s * 0.6);
      ctx.lineTo(sx - s * 0.05, -sh);
      ctx.lineTo(sx + s * 0.05, -s * 0.55);
      ctx.closePath(); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // 胸鳍（翼状，带膜）
    ctx.fillStyle = 'rgba(74,20,140,0.6)';
    ctx.beginPath(); ctx.ellipse(s * 0.1, s * 0.7, s * 0.55, s * 0.14, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = sp.accent; ctx.lineWidth = 1.2; ctx.stroke();

    // 多眼球（诡异感）
    for (var e = -1; e <= 1; e++) {
      ctx.fillStyle = '#e1bee7';
      ctx.beginPath(); ctx.arc(s * 0.65, e * s * 0.25, s * 0.08, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#4a148c';
      ctx.beginPath(); ctx.arc(s * 0.67, e * s * 0.25, s * 0.04, 0, Math.PI * 2); ctx.fill();
    }
  };

  global.Renderer = Renderer;
})(typeof window !== 'undefined' ? window : this);
