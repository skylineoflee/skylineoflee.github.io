// ============================================================
// 大鱼吃小鱼 - 玩家鱼
// 处理：移动（键盘/鼠标/触摸）、成长、绘制
// 依赖：GameUtils, GameConfig（通过参数注入，不直接引用全局）
// ============================================================
(function (global) {
  'use strict';

  /**
   * 玩家鱼实体
   * @param {Object} cfg - 玩家配置（来自 GameConfig.player）
   * @param {Object} world - 世界边界 {width, height}
   */
  function Player(cfg, world) {
    this.cfg = cfg;
    this.world = world;

    // 玩家初始位于世界中心（相机始终对准玩家中心）
    this.x = world.width / 2;
    this.y = world.height / 2;

    // 速度
    this.vx = 0;
    this.vy = 0;

    // 朝向
    this.angle = -Math.PI / 2;

    // 体型
    this.size = cfg.startSize;
    this.score = 0;

    // 输入目标（鼠标/触摸目标点）
    this.targetX = null;
    this.targetY = null;

    // 键盘输入状态
    this.keys = {
      up: false, down: false, left: false, right: false,
      boost: false
    };
  }

  // ---- 输入控制 ----

  /** 设置键盘按键状态 */
  Player.prototype.setKey = function (key, pressed) {
    if (this.keys.hasOwnProperty(key)) {
      this.keys[key] = pressed;
    }
  };

  /** 设置目标点（鼠标/触摸） */
  Player.prototype.setTarget = function (x, y) {
    this.targetX = x;
    this.targetY = y;
  };

  /** 清除鼠标目标（键盘接管时调用） */
  Player.prototype.clearTarget = function () {
    this.targetX = null;
    this.targetY = null;
  };

  // ---- 更新 ----

  /**
   * 更新玩家状态
   * @param {number} dt - 帧间隔（秒）
   */
  Player.prototype.update = function (dt) {
    var cfg = this.cfg;
    var boost = this.keys.boost;
    var maxSpeed = boost ? cfg.boostSpeed : cfg.speed;

    // 速度随体型增大略微变慢
    var sizeFactor = 1 - (this.size - cfg.startSize) / (cfg.maxSize * 2);
    sizeFactor = Math.max(0.6, Math.min(1, sizeFactor));
    maxSpeed *= sizeFactor;

    // 键盘移动方向
    var dirX = 0, dirY = 0;
    if (this.keys.up) dirY -= 1;
    if (this.keys.down) dirY += 1;
    if (this.keys.left) dirX -= 1;
    if (this.keys.right) dirX += 1;

    var hasKeyInput = (dirX !== 0 || dirY !== 0);
    var hasTarget = (this.targetX !== null && this.targetY !== null);

    var accel = cfg.acceleration;

    if (hasTarget) {
      // 鼠标/触摸：向目标点平滑移动
      var dx = this.targetX - this.x;
      var dy = this.targetY - this.y;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d > 5) {
        var nx = dx / d, ny = dy / d;
        var desiredVx = nx * maxSpeed;
        var desiredVy = ny * maxSpeed;
        this.vx += (desiredVx - this.vx) * accel;
        this.vy += (desiredVy - this.vy) * accel;
        this.angle = Math.atan2(dy, dx);
      } else {
        this.vx *= cfg.friction;
        this.vy *= cfg.friction;
      }
    } else if (hasKeyInput) {
      // 键盘：方向向量归一化
      var len = Math.sqrt(dirX * dirX + dirY * dirY);
      var kx = dirX / len, ky = dirY / len;
      this.vx += (kx * maxSpeed - this.vx) * accel;
      this.vy += (ky * maxSpeed - this.vy) * accel;
      this.angle = Math.atan2(ky, kx);
    } else {
      // 无输入：减速
      this.vx *= cfg.friction;
      this.vy *= cfg.friction;
    }

    // 应用速度
    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60;

    // 玩家穿出边界时环绕传送；相机的无缝跟随由 Renderer.updateCamera 的环绕对齐处理
    var w = this.world.width;
    var h = this.world.height;
    if (this.x < 0) this.x += w;
    else if (this.x > w) this.x -= w;
    if (this.y < 0) this.y += h;
    else if (this.y > h) this.y -= h;

    // 不自动缩小（玩家决定进食速度）
    // 去掉了自动收缩机制，只通过受伤或被大鱼碰到来缩小
  };

  // ---- 成长 ----

  /** 吃掉一条鱼，体型增长并加分 */
  Player.prototype.eat = function (fishSize, baseScore) {
    this.size = Math.min(this.cfg.maxSize, this.size + this.cfg.growPerEat);
    this.score += baseScore;
  };

  // ---- 绘制 ----

  /** 绘制玩家鱼 */
  Player.prototype.draw = function (ctx, camera) {
    var x = this.x - camera.x;
    var y = this.y - camera.y;
    var s = this.size;

    // 外发光（赛博风格）
    ctx.save();
    ctx.shadowColor = this.cfg.playerGlow;
    ctx.shadowBlur = 20;

    // 身体（椭圆形，朝向右）
    ctx.fillStyle = this.cfg.playerColor;
    ctx.beginPath();
    ctx.ellipse(x, y, s * 1.4, s, this.angle, 0, Math.PI * 2);
    ctx.fill();

    // 鱼尾
    ctx.shadowBlur = 10;
    ctx.beginPath();
    var tailX = x - Math.cos(this.angle) * s * 1.4;
    var tailY = y - Math.sin(this.angle) * s * 1.4;
    var tailSpread = s * 0.6;
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(
      tailX - Math.cos(this.angle + 2.6) * s * 0.7,
      tailY - Math.sin(this.angle + 2.6) * s * 0.7
    );
    ctx.lineTo(
      tailX - Math.cos(this.angle - 2.6) * s * 0.7,
      tailY - Math.sin(this.angle - 2.6) * s * 0.7
    );
    ctx.closePath();
    ctx.fill();

    // 眼睛
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    var eyeX = x + Math.cos(this.angle) * s * 0.6;
    var eyeY = y + Math.sin(this.angle) * s * 0.6;
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, s * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.arc(eyeX + Math.cos(this.angle) * s * 0.1, eyeY + Math.sin(this.angle) * s * 0.1, s * 0.13, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  global.Player = Player;
})(typeof window !== 'undefined' ? window : this);
